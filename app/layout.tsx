import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from '@/hooks/use-cart'
import { WishlistProvider } from '@/hooks/use-wishlist'
import { SiteSettingsProvider } from '@/hooks/use-site-settings'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://peesbakery.rest'),
  title: { default: "Pee's Bakery & Restaurant | Freetown", template: "%s | Pee's Bakery" },
  description: "Explore freshly baked treats, African dishes, and fast food from Pee's Bakery & Restaurant in Freetown, Sierra Leone.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_SL',
    siteName: "Pee's Bakery & Restaurant",
    title: "Pee's Bakery & Restaurant | Freetown",
    description: "Fresh pastries, African dishes, and fast food in Freetown.",
    url: 'https://peesbakery.rest/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "Pee's Bakery & Restaurant" }],
  },
  twitter: { card: 'summary_large_image', images: ['/opengraph-image'] },
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <SiteSettingsProvider><CartProvider><WishlistProvider>{children}</WishlistProvider></CartProvider></SiteSettingsProvider>
        <Toaster />
      </body>
    </html>
  )
}
