import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Your wishlist', description: "Your saved Pee's Bakery dishes, ready to add to your cart.", robots: { index: false, follow: false }, alternates: { canonical: '/wishlist' } }
export default function WishlistLayout({ children }: { children: ReactNode }) { return children }
