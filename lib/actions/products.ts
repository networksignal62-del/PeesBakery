"use server"

import { createClient } from "@/lib/supabase/server"
import { getSupabasePublicKey } from "@/lib/supabase/config"

function databaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKey())
}

interface DbOption {
  id: number
  name: string
  price: number | string
  description?: string | null
}

interface DbProduct {
  id: number
  name: string
  category: string
  price: number | string
  image?: string | null
  description?: string | null
  long_description?: string | null
  featured?: boolean | null
  rating?: number | string | null
  review_count?: number | null
  is_customizable?: boolean | null
  product_addons?: DbOption[] | null
  product_variants?: DbOption[] | null
}

// Transform database product to frontend Product type
function transformProduct(dbProduct: DbProduct) {
  const images = typeof dbProduct.image === 'string'
    ? dbProduct.image.split(',').map((image: string) => image.trim()).filter(Boolean)
    : []
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    price: Number(dbProduct.price),
    image: images[0] || "/placeholder.svg",
    images,
    description: dbProduct.description || "",
    longDescription: dbProduct.long_description || dbProduct.description || "",
    featured: dbProduct.featured ?? false,
    rating: dbProduct.rating ? Number(dbProduct.rating) : undefined,
    reviewCount: dbProduct.review_count ?? 0,
    isCustomizable: dbProduct.is_customizable ?? false,
    addOns: (dbProduct.product_addons || []).map((addon: DbOption) => ({
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
    })),
    variants: (dbProduct.product_variants || []).map((variant: DbOption) => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price),
      description: variant.description || undefined,
    })),
  }
}

// ==================== CUSTOMER-FACING FUNCTIONS ====================

// Get all active products for customers
export async function getProducts() {
  if (!databaseConfigured()) return { success: false, error: 'The menu is temporarily unavailable.', data: [] }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return { success: false, error: 'The menu could not be loaded. Please try again.', data: [] }
  }

  const transformedProducts = (data ?? []).map(transformProduct)
  return { success: true, data: transformedProducts }
}

// Get featured products only
export async function getFeaturedProducts() {
  if (!databaseConfigured()) return { success: false, error: 'The menu is temporarily unavailable.', data: [] }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("is_active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching featured products:", error)
    return { success: false, error: 'Featured products could not be loaded. Please try again.', data: [] }
  }

  const transformedProducts = (data ?? []).map(transformProduct)
  return { success: true, data: transformedProducts }
}

// Get single product by ID
export async function getProductById(id: number) {
  if (!databaseConfigured()) return { success: false, error: 'The menu is temporarily unavailable.', data: null }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return { success: false, error: 'This product is unavailable. Please try again.', data: null }
  }

  return { success: true, data: transformProduct(data) }
}

// Get products by category
export async function getProductsByCategory(category: string) {
  if (!databaseConfigured()) return { success: false, error: 'The menu is temporarily unavailable.', data: [] }
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (category !== "all") {
    query = query.eq("category", category)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching products by category:", error)
    return { success: false, error: 'The menu could not be loaded. Please try again.', data: [] }
  }

  const transformedProducts = (data ?? []).map(transformProduct)
  return { success: true, data: transformedProducts }
}

// Get all categories from database
export async function getCategories() {
  if (!databaseConfigured()) return { success: false, error: 'The menu is temporarily unavailable.', data: [] }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return { success: false, error: 'Categories could not be loaded. Please try again.', data: [] }
  }

  return { success: true, data: data ?? [] }
}

export async function getSiteSettings() {
  if (!databaseConfigured()) return { success: false, error: 'Settings are temporarily unavailable.', data: [] }
  const supabase = await createClient()
  const { data, error } = await supabase.from("site_settings").select("*")
  if (error) return { success: false, error: 'Settings could not be loaded. Please try again.', data: [] }
  return { success: true, data: data ?? [] }
}
