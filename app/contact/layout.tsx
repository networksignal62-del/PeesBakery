import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Contact us',
  description: "Find Pee's Bakery & Restaurant on Regent Road in Freetown or contact the team by phone and WhatsApp.",
  alternates: { canonical: '/contact' },
  openGraph: { title: "Contact Pee's Bakery", description: 'Visit or contact our Freetown bakery and restaurant.', url: '/contact', images: ['/opengraph-image'] },
}

export default function ContactLayout({ children }: { children: ReactNode }) { return children }
