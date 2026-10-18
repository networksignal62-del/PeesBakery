"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getProductById, getProducts } from "@/lib/actions/products"
import { formatPrice } from "@/lib/utils-app"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useToast } from "@/hooks/use-toast"
import { Star, Minus, Plus, ShoppingCart, Heart, Loader2 } from "lucide-react"
import type { AddOn, ProductVariant, Product } from "@/lib/types"
import { FlyingCartAnimation } from "@/components/flying-cart-animation"
import { CartModal } from "@/components/cart-modal"
import { RelatedProducts } from "@/components/related-products"
import { PromoBanner } from "@/components/promo-banner"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [flyingAnimation, setFlyingAnimation] = useState(false)
  const [animationStart, setAnimationStart] = useState({ x: 0, y: 0 })
  const [showCartModal, setShowCartModal] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const productId = Number(params.id)
  const isFavorite = product ? isInWishlist(product.id) : false

  // Load product data from Supabase
  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setLoadError('')
      try {
        const [productResult, allProductsResult] = await Promise.all([
          getProductById(productId),
          getProducts(),
        ])

        if (productResult.success && productResult.data) {
          setProduct(productResult.data)
          // Set default variant if available
          if (productResult.data.variants && productResult.data.variants.length > 0) {
            setSelectedVariant(productResult.data.variants[0])
          }
        } else if (!productResult.success) {
          throw new Error('This product could not load. Please try again.')
        }

        if (allProductsResult.success) {
          setAllProducts(allProductsResult.data)
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'This product could not load. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (Number.isSafeInteger(productId) && productId > 0) {
      loadProduct()
    } else {
      setLoading(false)
    }
  }, [productId, retryCount])

  const handleWishlistToggle = () => {
    if (!product) return

    toggleWishlist(product)

    toast({
      title: isFavorite ? "Removed from Wishlist" : "Added to Wishlist",
      description: `${product.name}`,
      duration: 3000,
    })
  }

  const handleAddOnToggle = (addOn: AddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.id === addOn.id)
      if (exists) {
        return prev.filter((a) => a.id !== addOn.id)
      } else {
        return [...prev, addOn]
      }
    })
  }

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.min(99, Math.max(1, quantity + delta))
    setQuantity(newQuantity)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbf5]">
        <Header />
        <main className="container mx-auto px-4 py-16 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#014325]" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fffbf5]">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{loadError || 'Product not found'}</h1>
          {loadError && <button type="button" onClick={() => setRetryCount(count => count + 1)} className="mr-3 bg-[#fd4d00] text-white px-6 py-3 rounded-lg">Try again</button>}
          <button onClick={() => router.push("/menu")} className="bg-[#014325] text-white px-6 py-3 rounded-lg">
            Back to Menu
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)
  const basePrice = selectedVariant ? selectedVariant.price : product.price
  const totalPrice = (basePrice + addOnsTotal) * quantity

  const handleAddToCart = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setAnimationStart({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
      setFlyingAnimation(true)
    }

    addToCart(product, quantity, selectedAddOns, selectedVariant)

    const variantText = selectedVariant ? ` (${selectedVariant.name})` : ""
    const addOnsText =
      selectedAddOns.length > 0 ? ` + ${selectedAddOns.length} add-on${selectedAddOns.length > 1 ? "s" : ""}` : ""

    toast({
      title: "Added to Cart!",
      description: `${product.name}${variantText} x${quantity}${addOnsText} - ${formatPrice(totalPrice)}`,
      duration: 3000,
    })

    setShowCartModal(true)
  }

  return (
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <FlyingCartAnimation
        trigger={flyingAnimation}
        startPosition={animationStart}
        onComplete={() => setFlyingAnimation(false)}
      />

      <CartModal isOpen={showCartModal} onClose={() => setShowCartModal(false)} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            <button
              onClick={handleWishlistToggle}
              className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg hover:scale-110"
              aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-6 h-6 transition-all ${isFavorite ? "fill-[#dc2626] text-[#dc2626]" : "text-[#5c6466]"}`}
              />
            </button>
          </div>

          {/* Right Column: Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <span className="inline-block bg-[#014325] text-white text-sm px-3 py-1 rounded-md capitalize">
              {product.category}
            </span>

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-[#0f1419]">{product.name}</h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating!) ? "fill-[#fd4d00] text-[#fd4d00]" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-medium">{product.rating}</span>
                <span className="text-[#5c6466]">({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="text-3xl font-bold text-[#014325]">{formatPrice(basePrice)}</div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0f1419]">Description</h2>
              <p className="text-[#5c6466] leading-relaxed">{product.longDescription || product.description}</p>
            </div>

            {/* Variants selection section */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#0f1419]">Choose Your Option</h2>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <label
                      key={variant.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedVariant?.id === variant.id
                          ? "border-[#014325] bg-[#014325]/5"
                          : "border-[#e5e7e8] hover:border-[#014325]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?.id === variant.id}
                        onChange={() => handleVariantSelect(variant)}
                        className="mt-1 w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325] focus:ring-offset-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0f1419]">{variant.name}</span>
                          <span className="text-[#014325] font-bold">{formatPrice(variant.price)}</span>
                        </div>
                        {variant.description && <p className="text-sm text-[#5c6466] mt-1">{variant.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {product.addOns && product.addOns.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#0f1419]">Customize Your Order</h2>
                <div className="space-y-2">
                  {product.addOns.map((addOn) => (
                    <label
                      key={addOn.id}
                      className="flex items-center gap-3 p-3 border border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddOns.some((a) => a.id === addOn.id)}
                        onChange={() => handleAddOnToggle(addOn)}
                        className="w-5 h-5 rounded border-2 border-[#e5e7e8] text-[#014325] focus:ring-2 focus:ring-[#014325] focus:ring-offset-2"
                      />
                      <span className="flex-1 font-medium">{addOn.name}</span>
                      <span className="text-[#014325] font-medium">
                        {addOn.price > 0 ? `+${formatPrice(addOn.price)}` : "Free"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-[#0f1419]">Quantity</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-lg border-2 border-[#e5e7e8] flex items-center justify-center hover:border-[#014325] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 rounded-lg border-2 border-[#e5e7e8] flex items-center justify-center hover:border-[#014325] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-[#fffbf5] border border-[#e5e7e8] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6466]">{selectedVariant ? selectedVariant.name : "Base Price"}</span>
                <span>{formatPrice(basePrice)}</span>
              </div>
              {selectedAddOns.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5c6466]">Add-ons</span>
                  <span>{formatPrice(addOnsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6466]">Quantity</span>
                <span>x {quantity}</span>
              </div>
              <div className="border-t border-[#e5e7e8] pt-2 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-[#014325]">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              ref={buttonRef}
              onClick={handleAddToCart}
              className="w-full bg-[#fd4d00] text-white py-4 rounded-xl font-bold text-lg shadow-[0_2px_8px_rgba(253,77,0,0.3)] hover:shadow-[0_4px_12px_rgba(253,77,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-6 h-6" />
              Add to Cart
            </button>
          </div>
        </div>
      </main>

      {/* Related Products section */}
      <RelatedProducts currentProduct={product} allProducts={allProducts} />

      {/* Promo Banner above footer */}
      <PromoBanner />

      <Footer />
    </div>
  )
}
