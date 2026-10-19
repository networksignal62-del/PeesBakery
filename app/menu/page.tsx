"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { CategoryFilter } from "@/components/category-filter"
import { getProducts, getCategories } from "@/lib/actions/products"
import type { Product } from "@/lib/types"

interface Category {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // Load products and categories from Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setLoadError('')
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getProducts(),
          getCategories(),
        ])

        if (productsResult.success) {
          setProducts(productsResult.data)
          setFilteredProducts(productsResult.data)
        } else throw new Error('The menu could not load. Please try again.')

        if (categoriesResult.success) {
          setCategories(categoriesResult.data)
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'The menu could not load. Please try again.')
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
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-[#0f1419]">Our Menu</h1>

        {/* Category Filter - Sticky */}
        <div className="sticky top-16 md:top-18 bg-[#fffbf5] py-4 z-40 -mx-4 px-4 mb-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </div>

        {/* Loading State */}
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
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#5c6466] text-lg">{products.length ? 'No products in this category.' : 'The menu is empty right now. Please check back soon.'}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
