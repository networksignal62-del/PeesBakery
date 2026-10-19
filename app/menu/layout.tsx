import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Menu',
  description: "Browse Pee's Bakery's current menu of fresh pastries, African dishes, fast food, and drinks.",
  alternates: { canonical: '/menu' },
  openGraph: { title: "Pee's Bakery Menu", description: 'Explore our current menu in Freetown.', url: '/menu', images: ['/opengraph-image'] },
}

export default function MenuLayout({ children }: { children: ReactNode }) { return children }
