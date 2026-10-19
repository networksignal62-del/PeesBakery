"use client"

import Image from "next/image"
import Link from "next/link"
import { LayoutDashboard, LogOut, Package, Store } from "lucide-react"

export function AdminHeader({ adminName, active }: { adminName: string; active: "orders" | "products" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe7df] bg-[#fffdf8]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-[#014325] shadow-sm">
            <Image src="/pees-bakery-logo.png" alt="Pee's Bakery" fill className="object-contain p-1" />
          </div>
          <div className="hidden sm:block">
            <p className="font-serif text-base font-bold leading-none tracking-tight text-[#173b2a]">Pee&apos;s Bakery</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#759080]">Staff portal</p>
          </div>
        </div>
        <nav className="flex items-center gap-1" aria-label="Admin navigation">
          <Link href="/admin" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active === "orders" ? "bg-[#e6f1e9] text-[#014325]" : "text-[#637268] hover:bg-[#f0f5f1] hover:text-[#173b2a]"}`}>
            <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Orders</span>
          </Link>
          <Link href="/admin/products" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active === "products" ? "bg-[#e6f1e9] text-[#014325]" : "text-[#637268] hover:bg-[#f0f5f1] hover:text-[#173b2a]"}`}>
            <Package className="h-4 w-4" /> <span className="hidden sm:inline">Products</span>
          </Link>
          <Link href="/" className="ml-2 hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#637268] hover:bg-[#f0f5f1] sm:flex">
            <Store className="h-4 w-4" /> View store
          </Link>
          <button onClick={async () => { const { createClient } = await import("@/lib/supabase/client"); await createClient().auth.signOut(); window.location.href = "/admin/login" }} className="ml-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#637268] hover:bg-[#fff0ee] hover:text-[#a84235]">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
