'use client'

import Link from 'next/link'
import { useSiteSettings } from '@/hooks/use-site-settings'

export function Footer() {
  const settings = useSiteSettings()
  const orderPhone = settings.order_phone || '+232 75 361494'
  const generalWhatsapp = settings.whatsapp || '+232 78 891638'
  return <footer className="bg-[#014325] text-white">
    <div className="container mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <p className="text-xl font-bold">Pee&apos;s Bakery &amp; Restaurant</p>
        <p className="mt-3 text-white/80">Fresh pastries and meals in Freetown, Sierra Leone.</p>
      </div>
      <nav aria-label="Footer navigation" className="flex flex-col gap-2">
        <Link className="hover:underline" href="/menu">Menu</Link>
        <Link className="hover:underline" href="/about">About us</Link>
        <Link className="hover:underline" href="/contact">Contact</Link>
      </nav>
      <div className="flex flex-col gap-2">
        <a className="hover:underline" href={`tel:+${orderPhone.replace(/\D/g, '')}`}>Order calls: {orderPhone}</a>
        <a className="hover:underline" href={`https://wa.me/${generalWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">General WhatsApp: {generalWhatsapp}</a>
        <p className="text-white/80">{settings.address}</p>
      </div>
    </div>
  </footer>
}
