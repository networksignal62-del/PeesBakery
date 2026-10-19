// Type definitions for Fresh Cuisine restaurant app

export interface AddOn {
  id: number
  name: string
  price: number
}

export interface ProductVariant {
  id: number
  name: string
  price: number
  description?: string
}

export interface Product {
  id: number
  name: string
  category: "noodles" | "seafood" | "chicken" | "rice" | "salads" | "african" | "bakery" | "fast-food" | "drinks"
  price: number
  image: string
  images?: string[]
  description: string
  longDescription?: string
  addOns: AddOn[]
  variants?: ProductVariant[]
  featured?: boolean
  rating?: number
  reviewCount?: number
  isCustomizable?: boolean // Added flag for customizable products
}

export interface CartItem {
  productId: number
  product: Product
  quantity: number
  selectedAddOns: AddOn[]
  selectedVariant?: ProductVariant
  totalPrice: number
}

export interface DeliveryAddress {
  street: string
  city: string
  zipCode: string
  instructions?: string
}

export interface Customer {
  name: string
  phone: string
  email?: string
}

export interface Order {
  id: string
  reference: string
  customer: Customer
  deliveryAddress: DeliveryAddress
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  total: number
  deliveryOption: "standard" | "express" | "pickup"
  paymentMethod: "cod" | "orange-money" | "vault" | "afrimoney"
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered"
  createdAt: Date
  estimatedDelivery: Date
}
