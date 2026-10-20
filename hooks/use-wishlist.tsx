'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Product } from '@/lib/types'

type WishlistContextValue = {
  wishlist: Product[]
  isLoaded: boolean
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: number) => void
  toggleWishlist: (product: Product) => void
  isInWishlist: (productId: number) => boolean
  getWishlistCount: () => number
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)
const STORAGE_KEY = 'pees-bakery-wishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setWishlist(parsed.filter((product): product is Product =>
            product && typeof product === 'object' && Number.isInteger(product.id) && typeof product.name === 'string',
          ))
        }
      }
    } catch {
      setWishlist([])
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist)) } catch { /* Wishlist remains available for this session. */ }
  }, [wishlist, isLoaded])

  function addToWishlist(product: Product) {
    setWishlist(current => current.some(item => item.id === product.id) ? current : [...current, product])
  }

  function removeFromWishlist(productId: number) {
    setWishlist(current => current.filter(item => item.id !== productId))
  }

  const value: WishlistContextValue = {
    wishlist, isLoaded, addToWishlist, removeFromWishlist,
    toggleWishlist: product => setWishlist(current =>
      current.some(item => item.id === product.id)
        ? current.filter(item => item.id !== product.id)
        : [...current, product],
    ),
    isInWishlist: productId => wishlist.some(item => item.id === productId),
    getWishlistCount: () => wishlist.length,
    clearWishlist: () => setWishlist([]),
  }
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('WishlistProvider is missing')
  return context
}
