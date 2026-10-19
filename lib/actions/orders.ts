"use server"

import { createClient } from "@/lib/supabase/server"

export interface OrderPayload {
  customerName: string
  customerPhone: string
  customerAddress: string
  deliveryMethod: "delivery" | "pickup"
  paymentMethod: "cash" | "orange_money" | "afrimoney"
  paymentProofUrl?: string
  expectedTotal: number
  notes?: string
  items: {
    productId: number
    variantName?: string
    quantity: number
    addons?: { name: string }[]
    specialInstructions?: string
  }[]
}

export async function saveOrder(payload: OrderPayload) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { success: false as const, error: 'Ordering is temporarily unavailable. Please call the restaurant.' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: payload.customerName,
    p_customer_phone: payload.customerPhone,
    p_customer_address: payload.customerAddress,
    p_delivery_method: payload.deliveryMethod,
    p_payment_method: payload.paymentMethod,
    p_payment_proof_url: payload.paymentProofUrl ?? null,
    p_notes: payload.notes ?? null,
    p_items: payload.items,
    p_expected_total: payload.expectedTotal,
  })

  if (error || !data?.id) {
    const knownErrors = [
      'Invalid order details', 'Invalid order item', 'Invalid quantity',
      'A product is no longer available', 'A product option is no longer available',
      'An add-on is no longer available', 'Prices changed. Refresh the menu and review your cart.',
      'Orders are temporarily closed',
    ]
    const message = knownErrors.find(known => error?.message?.includes(known)) ||
      'Ordering is temporarily unavailable. Please try again or call the restaurant.'
    return { success: false as const, error: message }
  }

  return {
    success: true as const,
    orderId: data.id as string,
    subtotal: Number(data.subtotal),
    deliveryFee: Number(data.deliveryFee),
    total: Number(data.total),
  }
}
