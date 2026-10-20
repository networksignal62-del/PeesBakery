'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, ChefHat, LayoutDashboard, LockKeyhole, LogOut, Package, Settings, ShoppingBag, Tags, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import type { AdminProfile } from '@/lib/admin-types'
import { canAccessAdminPath, isStaffRole } from '@/lib/admin-access'
import { createClient } from '@/lib/supabase/client'
import styles from './AdminSidebar.module.css'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Tags },
      { href: '/admin/menu', label: 'Digital menu', icon: BookOpen },
      { href: '/admin/staff', label: 'Staff access', icon: Users },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function AdminSidebar({ admin, onClose }: { admin: AdminProfile; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [pendingCount, setPendingCount] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!isStaffRole(admin.role) || !canAccessAdminPath(admin.role, '/admin/orders')) return
    async function refreshCount() {
      const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      setPendingCount(count ?? 0)
    }
    void refreshCount()
    const channel = supabase
      .channel('admin-pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { void refreshCount() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [admin.role, supabase])

  async function handleLogout() {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    setSigningOut(false)
    if (error) {
      toast.error('Could not sign out. Please try again.')
      return
    }
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <aside className={styles.sidebar} id="admin-navigation" aria-label="Admin navigation">
      <Link href="/admin" className={styles.brand} onClick={onClose}>
        <span className={styles.logoFrame}><ChefHat size={25} strokeWidth={1.8} aria-hidden="true" /></span>
        <span className={styles.brandText}><strong>Pee&apos;s Bakery</strong><small>Staff workspace</small></span>
      </Link>

      <div className={styles.navigation}>
        {NAV_GROUPS.map(group => {
          const items = group.items.filter(item => isStaffRole(admin.role) && canAccessAdminPath(admin.role, item.href))
          if (items.length === 0) return null
          return <div className={styles.navGroup} key={group.label}>
            <p className={styles.groupLabel}>{group.label}</p>
            <nav aria-label={group.label} className={styles.nav}>
              {items.map(({ href, label, icon: Icon }) => {
                const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
                return <Link
                  href={href}
                  key={href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`${styles.navItem} ${active ? styles.navActive : ''}`}
                >
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                  <span>{label}</span>
                  {href === '/admin/orders' && pendingCount > 0 && <span className={styles.navBadge} aria-label={`${pendingCount} pending orders`}>{pendingCount}</span>}
                </Link>
              })}
            </nav>
          </div>
        })}
      </div>

      <div className={styles.footer}>
        <Link href="/admin/account" onClick={onClose} className={`${styles.accountCard} ${pathname.startsWith('/admin/account') ? styles.accountActive : ''}`}>
          <span className={styles.adminAvatar}>{admin.full_name?.trim().charAt(0).toUpperCase() || admin.email.charAt(0).toUpperCase()}</span>
          <span className={styles.adminInfo}>
            <strong>{admin.full_name || 'Staff account'}</strong>
            <small>{admin.role === 'super_admin' ? 'Owner' : admin.role.replace('_', ' ')}</small>
          </span>
          <LockKeyhole size={16} aria-hidden="true" />
        </Link>
        <button className={styles.logoutBtn} type="button" onClick={handleLogout} disabled={signingOut}>
          <LogOut size={17} aria-hidden="true" />{signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
