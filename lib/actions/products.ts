"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ProductPayload {
  name: string
  category: string
  price: number
  image?: string
  description?: string
  longDescription?: string
  featured?: boolean
  rating?: number
  reviewCount?: number
  isCustomizable?: boolean
  isActive?: boolean
}

// Transform database product to frontend Product type
function transformProduct(dbProduct: any) {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    price: Number(dbProduct.price),
    image: dbProduct.image || "/placeholder.svg",
    description: dbProduct.description || "",
    longDescription: dbProduct.long_description || dbProduct.description || "",
    featured: dbProduct.featured ?? false,
    rating: dbProduct.rating ? Number(dbProduct.rating) : undefined,
    reviewCount: dbProduct.review_count ?? 0,
    isCustomizable: dbProduct.is_customizable ?? false,
    addOns: (dbProduct.product_addons || []).map((addon: any) => ({
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
    })),
    variants: (dbProduct.product_variants || []).map((variant: any) => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price),
      description: variant.description,
    })),
  }
}

// ==================== CUSTOMER-FACING FUNCTIONS ====================

// Get all active products for customers
export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return { success: false, error: error.message, data: [] }
  }

  const transformedProducts = (data ?? []).map(transformProduct)
  return { success: true, data: transformedProducts }
}

// Get featured products only
export async function getFeaturedProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("is_active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching featured products:", error)
    return { success: false, error: error.message, data: [] }
  }

  const transformedProducts = (data ?? []).map(transformProduct)
  return { success: true, data: transformedProducts }
}

// Get single product by ID
export async function getProductById(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data: transformProduct(data) }
}

// Get products by category
export async function getProductsByCategory(category: string) {
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
    return { success: false, error: error.message, data: [] }
  }

  const transformedProducts = (data ?? []).map(transformProduct)
  return { success: true, data: transformedProducts }
}

// Get all categories from database
export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data ?? [] }
}

// ==================== ADMIN FUNCTIONS ====================

export async function getAdminProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_variants(*), product_addons(*)`)
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message, data: [] }
  return { success: true, data: data ?? [] }
}

export async function createProduct(payload: ProductPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: payload.name,
      category: payload.category,
      price: payload.price,
      image: payload.image ?? null,
      description: payload.description ?? null,
      long_description: payload.longDescription ?? null,
      featured: payload.featured ?? false,
      rating: payload.rating ?? null,
      review_count: payload.reviewCount ?? 0,
      is_customizable: payload.isCustomizable ?? false,
      is_active: payload.isActive ?? true,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath("/menu")
  revalidatePath("/admin/products")
  return { success: true, data }
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>) {
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: "Invalid product id" }
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) {
    return { success: false, error: "Price must be a valid non-negative number" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("products")
    .update({
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.category !== undefined && { category: payload.category }),
      ...(payload.price !== undefined && { price: payload.price }),
      ...(payload.image !== undefined && { image: payload.image }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.longDescription !== undefined && { long_description: payload.longDescription }),
      ...(payload.featured !== undefined && { featured: payload.featured }),
      ...(payload.isActive !== undefined && { is_active: payload.isActive }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  revalidatePath("/menu")
  revalidatePath("/admin/products")
  return { success: true }
}

export async function deleteProduct(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) return { success: false, error: error.message }
  revalidatePath("/menu")
  revalidatePath("/admin/products")
  return { success: true }
}

export async function toggleProductActive(id: number, isActive: boolean) {
  return updateProduct(id, { isActive })
}

export async function getSiteSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("site_settings").select("*")
  if (error) return { success: false, error: error.message, data: [] }
  return { success: true, data: data ?? [] }
}

export async function updateSiteSetting(key: string, value: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
