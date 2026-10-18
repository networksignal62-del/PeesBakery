"use client"

import { useEffect, useState } from "react"
import { X, ShoppingCart } from 'lucide-react'
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/utils-app"
import Image from "next/image"
import Link from "next/link"
import { Confetti } from "./confetti"

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, getCartTotal } = useCart()
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, cart.length, getCartTotal])

  if (!isOpen) return null

  return (
    <>
      {showConfetti && <Confetti trigger={showConfetti} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#014325] text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6" />
              <h2 className="text-xl font-bold">Added to Cart!</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-[#5c6466]">Your cart is empty</p>
            ) : (
              cart
                .slice(-3)
                .reverse()
                .map((item, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0f1419] line-clamp-1">{item.product.name}</p>
                      <p className="text-sm text-[#5c6466]">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#014325]">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#e5e7e8] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Cart Total:</span>
              <span className="text-2xl font-bold text-[#014325]">{formatPrice(getCartTotal())}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-[#f2f3f4] text-[#0f1419] py-3 rounded-lg font-bold hover:bg-[#e5e7e8] transition-colors"
              >
                Continue Shopping
              </button>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 bg-[#fd4d00] text-white py-3 rounded-lg font-bold hover:bg-[#fd4d00]/90 transition-colors text-center"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
