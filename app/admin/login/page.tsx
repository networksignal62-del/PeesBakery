'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChefHat, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { defaultAdminPath, isStaffRole } from '@/lib/admin-access'
import styles from './page.module.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signInError || !data.user) throw new Error('Check your email and password, then try again.')

      const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (profileError || !profile || !isStaffRole(profile.role)) {
        await supabase.auth.signOut()
        throw new Error('This account does not have active staff access.')
      }

      router.replace(defaultAdminPath(profile.role))
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel} aria-label="Pee's Bakery staff workspace">
        <div className={styles.brandLockup}>
          <span className={styles.brandLogo}><ChefHat size={26} strokeWidth={1.8} aria-hidden="true" /></span>
          <span><strong>Pee&apos;s Bakery</strong><small>Staff workspace</small></span>
        </div>
        <div className={styles.brandMessage}>
          <span className={styles.brandEyebrow}>Bakery operations</span>
          <h2>Everything your team needs, in one place.</h2>
          <p>Stay on top of orders, keep the menu current, and manage the day with confidence.</p>
        </div>
        <p className={styles.brandFooter}>Pee&apos;s Bakery &amp; Restaurant · Freetown</p>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.mobileBrand}>
          <span className={styles.brandLogo}><ChefHat size={25} strokeWidth={1.8} aria-hidden="true" /></span>
          <strong>Pee&apos;s Bakery</strong>
        </div>
        <div className={styles.formContent}>
          <span className={styles.formIcon}><LockKeyhole size={23} /></span>
          <span className={styles.eyebrow}>Staff access</span>
          <h1>Welcome back</h1>
          <p className={styles.intro}>Sign in to your bakery workspace.</p>

          <form onSubmit={handleLogin} className={styles.form} aria-busy={loading}>
            <label htmlFor="admin-email">Email address</label>
            <input id="admin-email" type="email" inputMode="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />

            <label htmlFor="admin-password">Password</label>
            <div className={styles.passwordField}>
              <input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Enter your password" />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}<ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <p className={styles.help}>Need access? Ask the owner to invite you from Staff access.</p>
          <Link href="/" className={styles.backLink}><ArrowLeft size={16} /> Back to storefront</Link>
        </div>
      </main>
    </div>
  )
}
