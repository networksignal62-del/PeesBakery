"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Product, ProductVariant } from "@/lib/types"
import { formatPrice } from "@/lib/utils-app"
import { Plus, Minus, Heart } from 'lucide-react'
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { FlyingCartAnimation } from "@/components/flying-cart-animation"
import { CartModal } from "@/components/cart-modal"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1) // Start with quantity of 1 instead of 0
  const [isExpanded, setIsExpanded] = useState(false) // New state to track if the add button has been clicked
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  )
  const [flyingAnimation, setFlyingAnimation] = useState(false)
  const [animationStart, setAnimationStart] = useState({ x: 0, y: 0 })
  const [showCartModal, setShowCartModal] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { toast } = useToast()
  const isFavorite = isInWishlist(product.id)

  const handleClick = () => {
    // Link navigation handled by Next.js
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)

    toast({
      title: isFavorite ? "Removed from Wishlist" : "Added to Wishlist ❤️",
      description: `${product.name}`,
      duration: 3000,
    })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setAnimationStart({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      setFlyingAnimation(true)
    }

    addToCart(product, quantity, [], selectedVariant)

    toast({
      title: "Added to Cart! 🛒",
      description: `${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ""} x${quantity}`,
      duration: 3000,
    })

    setShowCartModal(true)
    setQuantity(1) // Reset to 1 instead of 0 after adding to cart
    setIsExpanded(false) // Reset to initial state after adding to cart
  }

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.preventDefault()
    e.stopPropagation()

    const newQuantity = Math.max(1, quantity + delta) // Minimum quantity is 1, not 0
    setQuantity(newQuantity)
  }

  return (
    <>
      <FlyingCartAnimation
        trigger={flyingAnimation}
        startPosition={animationStart}
        onComplete={() => setFlyingAnimation(false)}
      />

      <CartModal isOpen={showCartModal} onClose={() => setShowCartModal(false)} />

      <Link href={`/product/${product.id}`} onClick={handleClick}>
        <div className="bg-white border border-[#e5e7e8] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_24px_rgba(1,67,37,0.15)] hover:-translate-y-2 hover:scale-[1.03] cursor-pointer flex flex-col h-full group">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-[#f5f5f0]">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-95"
            />
            {/* Animated gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#014325]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Price Badge */}
            <span className="absolute top-3 right-3 bg-[#fd4d00] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
              {formatPrice(selectedVariant ? selectedVariant.price : product.price)}
            </span>

            <button
              onClick={handleWishlistToggle}
              className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-md hover:scale-125 hover:rotate-12 active:scale-95"
              aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-5 h-5 transition-all duration-300 ${isFavorite ? "fill-[#dc2626] text-[#dc2626] animate-[scale-in_0.3s_ease-out]" : "text-[#5c6466]"}`}
              />
            </button>

            {/* "NEW" badge for featured items */}
            {product.featured && (
              <span className="absolute bottom-3 left-3 bg-[#014325] text-white text-xs font-bold px-2 py-1 rounded-md shadow-md animate-pulse">
                FEATURED
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1">
            {/* Slide animation to title on hover */}
            <h3 className="font-bold text-lg text-[#0f1419] line-clamp-1 mb-1 transition-all duration-300 group-hover:text-[#014325]">
              {product.name}
            </h3>

            <p className="text-sm text-[#5c6466] capitalize mb-2 transition-colors duration-300 group-hover:text-[#014325]">
              {product.category}
            </p>

            <p className="text-sm text-[#5c6466] line-clamp-2 leading-relaxed mb-3 flex-1 transition-all duration-300">
              {product.description}
            </p>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-3 pb-3 border-b border-[#e5e7e8]">
                <p className="text-xs font-semibold text-[#0f1419] mb-2 uppercase tracking-wide">Select Size / Type</p>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#f5f5f0]"
                    >
                      <input
                        type="radio"
                        name={`variant-${product.id}`}
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => setSelectedVariant(variant)}
                        className="w-4 h-4 accent-[#fd4d00] cursor-pointer"
                      />
                      <span className="text-sm text-[#0f1419] font-medium flex-1">
                        {variant.name}
                      </span>
                      <span className="text-sm font-bold text-[#fd4d00]">
                        {formatPrice(variant.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto">
              {!isExpanded ? (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsExpanded(true)
                    setQuantity(1)
                  }}
                  className="w-full bg-[#f5f5f0] text-[#0f1419] py-3 rounded-lg font-bold transition-all duration-300 hover:bg-[#e5e7e8] flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add
                </button>
              ) : (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between bg-white border-2 border-[#fd4d00] p-2 rounded-lg">
                    <button
                      onClick={(e) => handleQuantityChange(e, -1)}
                      className="text-[#fd4d00] hover:bg-[#fd4d00]/10 p-1.5 rounded transition-all duration-200 hover:scale-110 active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-lg text-[#0f1419] w-8 text-center">{quantity}</span>
                    <button
                      onClick={(e) => handleQuantityChange(e, 1)}
                      className="text-[#fd4d00] hover:bg-[#fd4d00]/10 p-1.5 rounded transition-all duration-200 hover:scale-110 active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    ref={buttonRef}
                    onClick={handleAddToCart}
                    className="w-full bg-[#fd4d00] text-white py-2.5 rounded-lg font-bold transition-all duration-300 hover:bg-[#fd4d00]/90 hover:scale-105 active:scale-95 shadow-md"
                  >
                    Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </>
  )
}
