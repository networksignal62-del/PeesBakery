"use client"

import { useWishlist } from "@/hooks/use-wishlist"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function WishlistPage() {
  const { wishlist, isLoaded } = useWishlist()


  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fffbf5]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-[#5c6466]">Loading wishlist...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-[#014325] fill-[#014325]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">My Wishlist</h1>
          </div>
          <p className="text-[#5c6466]">
            {wishlist.length === 0
              ? "Your wishlist is empty. Start adding your favorite items!"
              : `You have ${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} in your wishlist`}
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e5e7e8] p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-[#fffbf5] rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-[#5c6466]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0f1419] mb-3">Your Wishlist is Empty</h2>
              <p className="text-[#5c6466] mb-6 leading-relaxed">
                Save your favorite dishes and bakery items here. Click the heart icon on any product to add it to your
                wishlist!
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-[#014325] text-white px-6 py-3 rounded-lg hover:bg-[#014325]/90 transition-colors font-medium"
              >
                <ShoppingBag className="w-5 h-5" />
                Browse Menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
