import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'About us',
  description: "Meet Pee's Bakery & Restaurant and discover the food we make for our Freetown community.",
  alternates: { canonical: '/about' },
  openGraph: { title: "About Pee's Bakery & Restaurant", description: 'Discover our bakery and restaurant in Freetown.', url: '/about', images: ['/opengraph-image'] },
}

export default function AboutLayout({ children }: { children: ReactNode }) { return children }
