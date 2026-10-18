import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Your cart', description: "Review the Pee's Bakery dishes in your cart before checkout.", robots: { index: false, follow: false }, alternates: { canonical: '/cart' } }
export default function CartLayout({ children }: { children: ReactNode }) { return children }
