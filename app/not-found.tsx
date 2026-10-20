import Link from 'next/link'
import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = { title: 'Page not found', description: "This Pee's Bakery page could not be found. Browse the current menu instead.", robots: { index: false, follow: false } }

export default function NotFound() {
  return <div className="min-h-screen bg-[#fffbf5] flex flex-col">
    <Header />
    <main className="container mx-auto px-4 py-24 text-center flex-1">
      <p className="text-[#fd4d00] font-bold">404</p>
      <h1 className="text-4xl font-bold text-[#0f1419] mt-2">We couldn&apos;t find that page</h1>
      <p className="text-[#5c6466] mt-4">The link may have changed. You can return to the menu to keep browsing.</p>
      <Link className="inline-block mt-8 rounded-xl bg-[#014325] px-6 py-3 text-white font-semibold" href="/menu">Browse the menu</Link>
    </main>
    <Footer />
  </div>
}
