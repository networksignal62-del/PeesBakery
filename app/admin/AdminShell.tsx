'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isStaffRole } from '@/lib/admin-access'
import type { AdminProfile } from '@/lib/admin-types'
import AdminSidebar from '@/components/admin/AdminSidebar'
import styles from './AdminLayout.module.css'

const PAGE_LABELS: Record<string, string> = {
  orders: 'Orders',
  products: 'Products',
  categories: 'Categories',
  menu: 'Digital menu',
  staff: 'Staff access',
  settings: 'Settings',
  account: 'My account',
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const publicPage = pathname === '/admin/login' || pathname === '/admin/welcome'
  const mobileMenuOpen = mobileMenuPath === pathname
  const section = pathname.split('/')[2]
  const pageLabel = PAGE_LABELS[section] || 'Dashboard'

  useEffect(() => {
    if (publicPage) return
    let cancelled = false

    async function checkAuth() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (cancelled) return
      if (userError || !user) {
        setAdmin(null)
        setLoading(false)
        router.replace('/admin/login')
        return
      }

      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (cancelled) return
      if (!profile || !isStaffRole(profile.role)) {
        setAdmin(null)
        setLoading(false)
        await supabase.auth.signOut()
        router.replace('/admin/login')
        return
      }

      setAdmin(profile)
      setLoading(false)
    }

    void checkAuth()
    return () => { cancelled = true }
  }, [publicPage, router, supabase])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen || !isMobile) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.querySelector<HTMLElement>('#admin-navigation a')?.focus()
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuPath(null)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMobile, mobileMenuOpen])

  if (publicPage) return <>{children}</>

  if (loading) {
    return <div className={styles.loading} role="status"><div className={styles.spinner} /><p>Opening your workspace…</p></div>
  }

  if (!admin) return null

  return (
    <div className={styles.layout}>
      <div className={`${styles.sidebarWrapper} ${mobileMenuOpen ? styles.sidebarOpen : ''}`} inert={isMobile && !mobileMenuOpen}>
        <AdminSidebar admin={admin} onClose={() => setMobileMenuPath(null)} />
      </div>
      {mobileMenuOpen && <button type="button" className={styles.sidebarBackdrop} aria-label="Close navigation" onClick={() => setMobileMenuPath(null)} />}

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
            <button
              ref={menuButtonRef}
              className={styles.mobileMenuBtn}
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-navigation"
              onClick={() => setMobileMenuPath(current => current === pathname ? null : pathname)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/admin">Workspace</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{pageLabel}</span>
            </nav>
          </div>
          <div className={styles.topbarActions}>
            <Link href="/" className={styles.storeLink}>View storefront <ArrowUpRight size={16} /></Link>
            <Link href="/admin/account" className={styles.accountLink} aria-label="My account">
              {admin.full_name?.trim().charAt(0).toUpperCase() || admin.email.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>
        <main className={styles.main} id="admin-main">{children}</main>
      </div>
    </div>
  )
}
