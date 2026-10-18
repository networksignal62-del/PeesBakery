'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AddOn, CartItem, Product, ProductVariant } from '@/lib/types'

type CartContextValue = {
  cart: CartItem[]
  isLoaded: boolean
  addToCart: (product: Product, quantity: number, selectedAddOns: AddOn[], selectedVariant?: ProductVariant | null) => void
  removeFromCart: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'fresh-cuisine-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setCart(parsed.filter((item): item is CartItem =>
            item && typeof item === 'object' && Number.isInteger(item.productId) &&
            item.product && typeof item.product.name === 'string' &&
            Number.isInteger(item.quantity) && item.quantity > 0 &&
            Number.isFinite(item.totalPrice) && Array.isArray(item.selectedAddOns),
          ))
        }
      }
    } catch {
      setCart([])
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)) } catch { /* Cart remains available for this session. */ }
  }, [cart, isLoaded])

  function addToCart(product: Product, quantity: number, selectedAddOns: AddOn[], selectedVariant?: ProductVariant | null) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return
    const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)
    const basePrice = selectedVariant ? selectedVariant.price : product.price
    const item: CartItem = {
      productId: product.id,
      product,
      quantity,
      selectedAddOns,
      selectedVariant: selectedVariant || undefined,
      totalPrice: (basePrice + addOnsTotal) * quantity,
    }
    setCart(current => [...current, item])
  }

  function removeFromCart(index: number) {
    setCart(current => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function updateQuantity(index: number, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return
    setCart(current => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const basePrice = item.selectedVariant ? item.selectedVariant.price : item.product.price
      const addOnsTotal = item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)
      return { ...item, quantity, totalPrice: (basePrice + addOnsTotal) * quantity }
    }))
  }

  const value: CartContextValue = {
    cart, isLoaded, addToCart, removeFromCart, updateQuantity,
    clearCart: () => setCart([]),
    getCartTotal: () => cart.reduce((sum, item) => sum + item.totalPrice, 0),
    getItemCount: () => cart.reduce((sum, item) => sum + item.quantity, 0),
  }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('CartProvider is missing')
  return context
}
