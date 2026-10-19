import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AdminShell from './AdminShell'
import { Toaster } from 'react-hot-toast'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: "Admin | Pee's Bakery", template: "%s | Pee's Bakery Admin" },
  description: "Staff administration for Pee's Bakery & Restaurant.",
  robots: { index: false, follow: false, noarchive: true },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <><AdminShell>{children}</AdminShell><Toaster position="top-right" /></>
}
