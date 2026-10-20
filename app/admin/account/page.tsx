'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

export default function AccountPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPasswords, setShowNewPasswords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email || '')
    })
    return () => { cancelled = true }
  }, [supabase])

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (newPassword.length < 12) return setError('Use at least 12 characters for the new password.')
    if (newPassword !== confirmPassword) return setError('The new passwords do not match.')
    if (newPassword === currentPassword) return setError('Choose a password different from your current one.')

    setSaving(true)
    let passwordUpdated = false
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user?.email) throw new Error('Your session expired. Sign in again.')

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyError) throw new Error('Current password could not be verified. Check it and try again.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw new Error(updateError.message || 'Your password could not be changed.')
      passwordUpdated = true

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw new Error('Password changed, but sign out failed. Please sign out manually.')
      toast.success('Password changed. Sign in with your new password.')
      router.replace('/admin/login')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your password could not be changed.')
      if (passwordUpdated) setCurrentPassword('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}><ShieldCheck size={15} /> Account security</span>
        <h1>My account</h1>
        <p>Keep your staff sign-in secure and up to date.</p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.identityCard}>
          <span className={styles.identityIcon}><Mail size={22} /></span>
          <h2>Sign-in details</h2>
          <p>This is the email address linked to your staff account.</p>
          <div className={styles.identityField}>
            <span>Email address</span>
            <strong>{email || 'Loading…'}</strong>
          </div>
          <div className={styles.identityNote}><LockKeyhole size={16} /> Only you can change your password here.</div>
        </aside>

        <form className={styles.card} onSubmit={changePassword} aria-busy={saving}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}><KeyRound size={21} /></span>
            <div><h2>Change password</h2><p>Enter your current password to confirm it is you.</p></div>
          </div>

          <div className={styles.fields}>
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required autoComplete="current-password" />

            <div className={styles.labelRow}>
              <label htmlFor="new-password">New password</label>
              <button type="button" className={styles.visibilityBtn} aria-label={showNewPasswords ? 'Hide new passwords' : 'Show new passwords'} onClick={() => setShowNewPasswords(value => !value)}>
                {showNewPasswords ? <EyeOff size={16} /> : <Eye size={16} />}{showNewPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
            <input id="new-password" type={showNewPasswords ? 'text' : 'password'} value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={12} required autoComplete="new-password" aria-describedby="password-help" />
            <p className={styles.helper} id="password-help">Use at least 12 characters. Choose a password you have not used before.</p>

            <label htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type={showNewPasswords ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={12} required autoComplete="new-password" aria-invalid={Boolean(confirmPassword && confirmPassword !== newPassword)} />
            {confirmPassword && confirmPassword === newPassword && <p className={styles.match}><Check size={15} /> Passwords match</p>}
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.cardFooter}>
            <p>You will sign in again after saving.</p>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
          </div>
        </form>
      </div>
    </section>
  )
}
