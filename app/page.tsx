"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { CustomizableProductCard } from "@/components/customizable-product-card"
import { CategoryFilter } from "@/components/category-filter"
import { getProducts, getFeaturedProducts, getCategories } from "@/lib/actions/products"
import type { Product } from "@/lib/types"

interface Category {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // Load products, featured products, and categories from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setLoadError('')
      try {
        const [productsResult, featuredResult, categoriesResult] = await Promise.all([
          getProducts(),
          getFeaturedProducts(),
          getCategories(),
        ])

        if (productsResult.success) {
          setProducts(productsResult.data)
          setFilteredProducts(productsResult.data)
        } else throw new Error('Products could not load. Please try again.')

        if (featuredResult.success) {
          setFeaturedProducts(featuredResult.data)
        }

        if (categoriesResult.success) {
          setCategories(categoriesResult.data)
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Products could not load. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [retryCount])

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter((p) => p.category === selectedCategory))
    }
  }, [selectedCategory, products])

  return (
    <div className="min-h-screen bg-[#fffbf5] bg-popover-foreground">
      <Header />

      <main className="bg-[rgba(234,236,223,1)]">
        <section className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-b from-[#014325] to-[#014325]/80">
          <div className="absolute inset-0">
            <Image
              src="/images/design-mode/hero-background.jpeg"
              alt=""
              fill
              className="object-cover opacity-100"
              priority
            />
          </div>

          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
            <h1 className="sm:text-3xl font-bold mb-3 md:mb-4 text-balance px-4 text-white text-3xl mt-[-50px] md:text-7xl">
              Welcome to Pee&apos;s Bakery & Restaurant
            </h1>
            <p className="text-sm sm:text-base md:text-lg max-w-2xl mb-6 md:mb-8 text-pretty leading-relaxed px-4 rounded-sm lg:text-base">
              Your Home of Authentic African Dishes, Fresh Pastries, and Fast Food Delights in Freetown. Taste the
              culture, enjoy the comfort, and order your favorite meals with ease.
            </p>

            {/* Featured Dishes Grid */}
            <div className="hidden sm:grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mt-4 w-full max-w-4xl md:mt-[-1px] px-2.5">
              {featuredProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-3 hover:bg-white/20 transition-colors"
                >
                  <div className="relative aspect-square mb-1 md:mb-2 rounded-md overflow-hidden">
                    <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-center line-clamp-1">{product.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Category */}
        <section className="container mx-auto px-4 py-6 md:py-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-[#0f1419]">Shop by Category</h2>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-[#0f1419]">
            {selectedCategory === "all"
              ? "All Products"
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-xl bg-white p-8 text-center">
              <p className="text-red-700">{loadError}</p>
              <button type="button" onClick={() => setRetryCount(count => count + 1)} className="mt-4 rounded-lg bg-[#014325] px-5 py-2 text-white">Try again</button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) =>
                product.isCustomizable ? (
                  <CustomizableProductCard key={product.id} product={product} />
                ) : (
                  <ProductCard key={product.id} product={product} />
                ),
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#5c6466] text-lg">{products.length ? 'No products in this category.' : 'The menu is empty right now. Please check back soon.'}</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
