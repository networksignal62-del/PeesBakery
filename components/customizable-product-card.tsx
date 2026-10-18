"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { MessageCircle, Sparkles } from 'lucide-react'

interface CustomizableProductCardProps {
  product: Product
}

export function CustomizableProductCard({ product }: CustomizableProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const images = product.images || [product.image]

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const phoneNumber = "23278891638"
    const message = encodeURIComponent(
      `Hello! I'm interested in ordering a customized cake design. I'd like to discuss my ideas for a special occasion.`,
    )
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="bg-gradient-to-br from-[#fffbf5] via-white to-[#fff5e6] border-2 border-[#fd4d00] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(253,77,0,0.3)] hover:-translate-y-3 hover:scale-[1.02] flex flex-col h-full group relative">
      {/* Decorative corner elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#fd4d00]/20 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#014325]/10 to-transparent rounded-tr-full" />

      {/* Sparkle badge */}
      <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-[#fd4d00] to-[#ffd700] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
        <Sparkles className="w-4 h-4" />
        CUSTOM ORDER
      </div>

      <div>
        {/* Image Carousel */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#f5f5f0] to-[#fffbf5]">
          <Image
            src={images[currentImageIndex] || "/placeholder.svg"}
            alt={`${product.name} - Design ${currentImageIndex + 1}`}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
          />
          <Link href={`/product/${product.id}`} className="absolute inset-0 z-[1]" aria-label={`View ${product.name}`} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fd4d00]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Image dots navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setCurrentImageIndex(index)
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? "bg-[#fd4d00] w-6" : "bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`View design ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Premium badge */}
          <span className="absolute top-4 right-4 bg-[#014325] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            PREMIUM
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 relative z-10">
          <h3 className="font-bold text-lg sm:text-xl text-[#0f1419] mb-2 transition-all duration-300 group-hover:text-[#014325] flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#fd4d00] group-hover:rotate-180 transition-transform duration-500" />
            <Link href={`/product/${product.id}`}>{product.name}</Link>
          </h3>

          <p className="text-xs sm:text-sm text-[#5c6466] line-clamp-2 leading-relaxed mb-4 flex-1">
            {product.description}
          </p>

          {/* WhatsApp CTA Button */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-[#fd4d00] hover:bg-[#ffc83d] text-white py-2.5 sm:py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 group/btn text-sm sm:text-base"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:animate-bounce" />
            <span>Message on WhatsApp</span>
          </button>

          {/* Contact info */}
          <p className="text-center text-xs text-[#5c6466] mt-3 font-medium">+232 78 891638</p>

          {/* Note */}
          <p className="text-center text-xs text-[#014325] mt-2 italic">Custom prices based on design complexity</p>
        </div>
      </div>
    </div>
  )
}
