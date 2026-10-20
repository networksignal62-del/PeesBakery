"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/utils-app"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const router = useRouter()
  const { cart, isLoaded, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount } = useCart()

  const handleClearCart = () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearCart()
    }
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  if (!isLoaded) return <div className="min-h-screen bg-[#fffbf5]"><Header /><main className="container mx-auto px-4 py-16" role="status">Loading your cart…</main><Footer /></div>

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffbf5]">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <ShoppingBag className="w-24 h-24 mx-auto text-[#e5e7e8]" />
            <h1 className="text-3xl font-bold text-[#0f1419]">Your cart is empty</h1>
            <p className="text-[#5c6466]">Add some delicious items to get started!</p>
            <Link
              href="/menu"
              className="inline-block bg-[#014325] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#014325]/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">Your Cart</h1>
            <p className="text-[#5c6466] mt-1">{getItemCount()} items</p>
          </div>
          <button
            onClick={handleClearCart}
            className="text-[#dc2626] hover:text-[#dc2626]/80 font-medium transition-colors text-sm md:text-base"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <div key={index} className="bg-white border border-[#e5e7e8] rounded-xl p-3 md:p-4">
                <div className="flex gap-3 md:gap-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base md:text-lg text-[#0f1419] line-clamp-1">
                        {item.product.name}
                      </h3>

                      {/* Remove Button - Mobile */}
                      <button
                        onClick={() => removeFromCart(index)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-[#dc2626]" />
                      </button>
                    </div>

                    {item.selectedAddOns.length > 0 && (
                      <p className="text-xs md:text-sm text-[#5c6466] mb-2 line-clamp-1">
                        Add-ons: {item.selectedAddOns.map((a) => a.name).join(", ")}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 mt-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-[#e5e7e8] flex items-center justify-center hover:border-[#014325] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <span className="font-medium w-6 md:w-8 text-center text-sm md:text-base">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-[#e5e7e8] flex items-center justify-center hover:border-[#014325] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-base md:text-lg text-[#014325]">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-[#e5e7e8] rounded-xl p-6 sticky top-24 bg-green-100">
              <h2 className="text-2xl font-bold mb-6 text-[#0f1419]">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-[#5c6466]">Subtotal</span>
                  <span className="font-medium">{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c6466]">Items</span>
                  <span className="font-medium">{getItemCount()}</span>
                </div>
              </div>

              <div className="border-t border-[#e5e7e8] pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-[#014325]">{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#014325] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#014325]/90 transition-colors"
              >
                Proceed to Checkout
              </button>

              <Link href="/menu" className="block text-center mt-4 text-[#014325] font-medium hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
