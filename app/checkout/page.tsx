"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCart } from "@/hooks/use-cart"
import { formatPrice, generateOrderReference, calculateEstimatedDelivery } from "@/lib/utils-app"
import type { Order, Customer, DeliveryAddress } from "@/lib/types"
import { OrderConfirmationModal } from "@/components/order-confirmation-modal"
import { saveOrder } from "@/lib/actions/orders"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [deliveryOption, setDeliveryOption] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "" })
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: "",
    city: "",
    zipCode: "",
    instructions: "",
  })
  const [orangeMoneyTransaction, setOrangeMoneyTransaction] = useState({
    transactionId: "",
    phoneNumber: "",
    accountName: "",
  })

  useEffect(() => {
    setMounted(true)
    console.log("[v0] Checkout page mounted")
  }, [])

  useEffect(() => {
    console.log("[v0] Cart check - items:", cart.length)

    if (mounted && cart.length === 0 && !showConfirmation) {
      console.log("[v0] Empty cart detected, redirecting to cart page")
      router.push("/cart")
    }
  }, [cart.length, mounted, showConfirmation, router, cart])

  const deliveryFees: Record<string, number> = {
    standard: 25,
    express: 25,
    pickup: 0,
  }

  const subtotal = getCartTotal()
  const deliveryFee = deliveryFees[deliveryOption] ?? 0
  const total = subtotal + deliveryFee

  const handleDeliveryOptionChange = (option: string) => {
    setDeliveryOption(option)
    console.log("[v0] Delivery option changed to:", option)
  }

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method)
    console.log("[v0] Payment method changed to:", method)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] ==========================================")
    console.log("[v0] FORM SUBMITTED - handleSubmit called!")
    console.log("[v0] ==========================================")

    const orderItems = [...cart].map((item) => ({
      product: { ...item.product },
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      selectedVariant: item.selectedVariant,
    }))

    console.log("[v0] Order items captured:", orderItems.length)
    console.log("[v0] Cart length at submit:", cart.length)
    console.log("[v0] Customer name:", customer.name)
    console.log("[v0] Customer phone:", customer.phone)

    if (orderItems.length === 0) {
      console.error("[v0] ERROR: No items in order!")
      alert("Your cart is empty. Please add items before checkout.")
      return
    }

    console.log("[v0] Order items details:")
    orderItems.forEach((item, idx) => {
      console.log(`[v0]   ${idx + 1}. ${item.product.name} x${item.quantity} = Le ${item.totalPrice}`)
    })

    setIsProcessing(true)
    console.log("[v0] Processing started...")

    try {
      const orderRef = generateOrderReference()

      // Save order to Supabase
      const deliveryMethodMapped =
        deliveryOption === "pickup" ? "pickup" : "delivery"
      const paymentMethodMapped =
        paymentMethod === "orange-money"
          ? "orange_money"
          : paymentMethod === "vault"
          ? "afrimoney"
          : "cash"

      await saveOrder({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: `${deliveryAddress.street}, ${deliveryAddress.city} ${deliveryAddress.zipCode}${deliveryAddress.instructions ? ` - ${deliveryAddress.instructions}` : ""}`,
        deliveryMethod: deliveryMethodMapped,
        paymentMethod: paymentMethodMapped,
        subtotal,
        deliveryFee,
        total,
        notes: deliveryAddress.instructions,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          variantName: item.selectedVariant?.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.totalPrice,
        })),
      })
      console.log("[v0] Generated order reference:", orderRef)

      const order: Order = {
        id: orderRef,
        reference: orderRef,
        customer,
        deliveryAddress,
        items: orderItems,
        subtotal,
        deliveryFee,
        tax: 0,
        discount: 0,
        total,
        deliveryOption: deliveryOption as "standard" | "express" | "pickup",
        paymentMethod: paymentMethod as "cod" | "orange-money" | "vault" | "afrimoney",
        status: "confirmed",
        createdAt: new Date(),
        estimatedDelivery: calculateEstimatedDelivery(deliveryOption as "standard" | "express" | "pickup"),
      }

      console.log("[v0] Order object created")
      console.log("[v0] Building WhatsApp message...")

      const itemsList = orderItems
        .map((item, idx) => {
          const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : ""
          return `${idx + 1}. ${item.product.name}${variantText} x${item.quantity} - Le ${item.totalPrice}`
        })
        .join("%0A")

      console.log("[v0] Items list created, length:", itemsList.length)

      const orangeMoneyDetails =
        paymentMethod === "orange-money"
          ? `%0A%0A*Orange Money Transaction:*%0ATransaction ID: ${orangeMoneyTransaction.transactionId}${orangeMoneyTransaction.phoneNumber ? `%0APhone: ${orangeMoneyTransaction.phoneNumber}` : ""}${orangeMoneyTransaction.accountName ? `%0AAccount Name: ${orangeMoneyTransaction.accountName}` : ""}`
          : ""

      const message = `*New Order from Pee's Bakery*%0A%0A*Order Reference:* ${orderRef}%0A%0A*Customer Details:*%0AName: ${customer.name}%0APhone: ${customer.phone}${customer.email ? `%0AEmail: ${customer.email}` : ""}%0A%0A*Delivery Address:*%0A${deliveryAddress.street}%0A${deliveryAddress.city}, ${deliveryAddress.zipCode}${deliveryAddress.instructions ? `%0AInstructions: ${deliveryAddress.instructions}` : ""}%0A%0A*Order Items:*%0A${itemsList}%0A%0A*Order Summary:*%0ASubtotal: Le ${subtotal}%0ADelivery (${deliveryOption}): Le ${deliveryFee}%0A*Total: Le ${total}*%0A%0A*Payment Method:* ${paymentMethod.toUpperCase()}${orangeMoneyDetails}%0A%0A*Estimated Delivery:* ${order.estimatedDelivery.toLocaleString()}`

      console.log("[v0] WhatsApp message created")
      console.log("[v0] Message length:", message.length)
      console.log("[v0] Message preview:", message.substring(0, 200))

      const whatsappNumber = "232033680260"
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`

      console.log("[v0] WhatsApp URL length:", whatsappURL.length)
      console.log("[v0] Opening WhatsApp...")

      window.open(whatsappURL, "_blank")
      console.log("[v0] WhatsApp window opened")

      setCompletedOrder(order)
      setShowConfirmation(true)

      console.log("[v0] Clearing cart...")
      clearCart()
      console.log("[v0] Cart cleared")

      console.log("[v0] ==========================================")
      console.log("[v0] ORDER COMPLETED SUCCESSFULLY!")
      console.log("[v0] ==========================================")
    } catch (error) {
      console.error("[v0] ==========================================")
      console.error("[v0] ERROR during order submission:")
      console.error("[v0]", error)
      console.error("[v0] ==========================================")
      alert("Failed to place order. Please try again.")
    } finally {
      setIsProcessing(false)
      console.log("[v0] Processing finished")
    }
  }

  const isFormValid = Boolean(
    customer.name.trim() &&
      customer.phone.trim() &&
      deliveryAddress.street.trim() &&
      deliveryAddress.city.trim() &&
      deliveryAddress.zipCode.trim() &&
      cart.length > 0 &&
      (paymentMethod !== "orange-money" || orangeMoneyTransaction.transactionId.trim()),
  )

  useEffect(() => {
    console.log("[v0] Form validation check:")
    console.log("[v0]   Name:", customer.name ? "✓" : "✗")
    console.log("[v0]   Phone:", customer.phone ? "✓" : "✗")
    console.log("[v0]   Street:", deliveryAddress.street ? "✓" : "✗")
    console.log("[v0]   City:", deliveryAddress.city ? "✓" : "✗")
    console.log("[v0]   Zip:", deliveryAddress.zipCode ? "✓" : "✗")
    console.log("[v0]   Cart items:", cart.length)
    console.log("[v0]   Form valid:", isFormValid)
  }, [customer, deliveryAddress, cart.length, isFormValid])

  if (!mounted || (cart.length === 0 && !showConfirmation)) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <OrderConfirmationModal
        order={completedOrder}
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false)
          router.push("/")
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-[#0f1419]">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Information */}
              <section className="bg-white border border-[#e5e7e8] rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6 text-[#0f1419]">Delivery Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      Phone Number <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="+232 78 891 638"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address (Optional)
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="street" className="block text-sm font-medium mb-2">
                      Street Address <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="street"
                      type="text"
                      required
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-2">
                      City/Town <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      required
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="Freetown"
                    />
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
                      ZIP/Postal Code <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      required
                      value={deliveryAddress.zipCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="12345"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="instructions" className="block text-sm font-medium mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      id="instructions"
                      rows={3}
                      value={deliveryAddress.instructions}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent resize-none"
                      placeholder="Any special instructions for delivery..."
                    />
                  </div>
                </div>
              </section>

              {/* Delivery Options */}
              <section className="bg-white border border-[#e5e7e8] rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6 text-[#0f1419]">Delivery Options</h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="delivery"
                      value="standard"
                      checked={deliveryOption === "standard"}
                      onChange={() => handleDeliveryOptionChange("standard")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Standard Delivery</p>
                      <p className="text-sm text-[#5c6466]">Depending on the location</p>
                    </div>
                    <span className="font-bold text-[#014325]">Le 25</span> {/* Updated to show Le 25 directly */}
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="delivery"
                      value="express"
                      checked={deliveryOption === "express"}
                      onChange={() => handleDeliveryOptionChange("express")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Express Delivery</p>
                      <p className="text-sm text-[#5c6466]">Depending on the location</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="delivery"
                      value="pickup"
                      checked={deliveryOption === "pickup"}
                      onChange={() => handleDeliveryOptionChange("pickup")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Pickup</p>
                      <p className="text-sm text-[#5c6466]">Ready in 30 minutes</p>
                    </div>
                    <span className="font-bold text-[#10b981]">Free</span>
                  </label>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white border border-[#e5e7e8] rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6 text-[#0f1419]">Payment Method</h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => handlePaymentMethodChange("cod")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Cash on Delivery</p>
                      <p className="text-sm text-[#5c6466]">Pay when you receive your order</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="payment"
                      value="orange-money"
                      checked={paymentMethod === "orange-money"}
                      onChange={() => handlePaymentMethodChange("orange-money")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Orange Money</p>
                      <p className="text-sm text-[#5c6466]">Mobile money (*144#) or Maxit app</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="payment"
                      value="vault"
                      checked={paymentMethod === "vault"}
                      onChange={() => handlePaymentMethodChange("vault")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Vault</p>
                      <p className="text-sm text-[#5c6466]">Secure card payment</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-[#e5e7e8] rounded-lg cursor-pointer hover:border-[#014325] transition-colors has-[:checked]:border-[#014325] has-[:checked]:bg-[#f0fdf4]">
                    <input
                      type="radio"
                      name="payment"
                      value="afrimoney"
                      checked={paymentMethod === "afrimoney"}
                      onChange={() => handlePaymentMethodChange("afrimoney")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Afrimoney</p>
                      <p className="text-sm text-[#5c6466]">West African payment</p>
                    </div>
                  </label>
                </div>

                {paymentMethod === "orange-money" && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-[#ff8c00]/10 border border-[#fd4d00] rounded-lg">
                      <h3 className="font-bold text-[#0f1419] mb-3">Orange Money Payment Instructions</h3>

                      <div className="space-y-3 mb-4">
                        <p className="text-sm text-[#0f1419]">
                          <strong>Step 1:</strong> Click the button below to dial the payment code directly. The amount
                          (Le {total}) is already included.
                        </p>
                        <a
                          href={`tel:*144*4*1*216542*${total}%23`}
                          className="flex items-center justify-center gap-2 w-full bg-[#ff8c00] text-white py-3 rounded-lg font-bold hover:bg-[#ff8c00]/90 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          Dial *144*4*1*216542*{total}#
                        </a>
                        <p className="text-sm text-[#0f1419]">
                          <strong>Step 2:</strong> Enter your PIN to confirm the payment of{" "}
                          <strong className="text-[#ff8c00]">Le {total}</strong>.
                        </p>
                        <p className="text-sm text-[#0f1419]">
                          <strong>Step 3:</strong> Complete payment and fill in transaction details below
                        </p>
                      </div>

                      <div className="p-3 bg-[#fffbf5] border border-[#fd4d00] rounded-lg text-sm">
                        <p className="font-bold text-[#dc2626] mb-1">Important:</p>
                        <p className="text-[#0f1419] mb-2">
                          Please complete the payment within 15 minutes. Your order will be automatically cancelled if
                          payment is not received within this time.
                        </p>
                        <p className="text-[#0f1419]">
                          After completing the payment, you will receive a confirmation SMS. Your order will be
                          processed immediately upon payment confirmation.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white border-2 border-[#fd4d00] rounded-lg">
                      <h4 className="font-bold text-[#0f1419] mb-3">
                        Transaction Details <span className="text-[#dc2626]">*</span>
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label htmlFor="transactionId" className="block text-sm font-medium mb-2">
                            Transaction ID <span className="text-[#dc2626]">*</span>
                          </label>
                          <input
                            id="transactionId"
                            type="text"
                            required
                            value={orangeMoneyTransaction.transactionId}
                            onChange={(e) =>
                              setOrangeMoneyTransaction({ ...orangeMoneyTransaction, transactionId: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c00] focus:border-transparent"
                            placeholder="e.g., MP123456789"
                          />
                          <p className="text-xs text-[#5c6466] mt-1">
                            Enter the transaction ID from your Orange Money confirmation SMS
                          </p>
                        </div>

                        <div>
                          <label htmlFor="orangeMoneyPhone" className="block text-sm font-medium mb-2">
                            Orange Money Phone Number (Optional)
                          </label>
                          <input
                            id="orangeMoneyPhone"
                            type="tel"
                            value={orangeMoneyTransaction.phoneNumber}
                            onChange={(e) =>
                              setOrangeMoneyTransaction({ ...orangeMoneyTransaction, phoneNumber: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c00] focus:border-transparent"
                            placeholder="+232 XX XXX XXX"
                          />
                          <p className="text-xs text-[#5c6466] mt-1">The phone number used for the payment</p>
                        </div>

                        <div>
                          <label htmlFor="orangeMoneyName" className="block text-sm font-medium mb-2">
                            Account Holder Name (Optional)
                          </label>
                          <input
                            id="orangeMoneyName"
                            type="text"
                            value={orangeMoneyTransaction.accountName}
                            onChange={(e) =>
                              setOrangeMoneyTransaction({ ...orangeMoneyTransaction, accountName: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8c00] focus:border-transparent"
                            placeholder="Name on Orange Money account"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod !== "cod" && paymentMethod !== "orange-money" && (
                  <div className="mt-6 p-4 bg-[#fffbf5] border border-[#fd4d00] rounded-lg">
                    <p className="text-sm text-[#0f1419] mb-2">
                      <strong>Note:</strong> After placing your order, please send your payment transaction screenshot
                      via WhatsApp.
                    </p>
                    <p className="text-sm text-[#0f1419]">
                      For customized cakes, contact us on WhatsApp at{" "}
                      <a href="https://wa.me/232033680260" className="text-[#014325] font-bold hover:underline">
                        033680260
                      </a>
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-[#e5e7e8] rounded-xl p-6 sticky top-24 bg-green-100">
                <h2 className="text-2xl font-bold mb-6 text-[#0f1419]">Order Summary</h2>

                {/* Items List */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-[#5c6466]">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-[#014325]">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#e5e7e8] pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5c6466]">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5c6466]">Delivery Fee</span>
                    <span className="font-medium">{formatPrice(deliveryFee)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-[#014325] pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Grand Total</span>
                    <span className="font-bold text-2xl text-[#014325]">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || isProcessing}
                  onClick={() => console.log("[v0] Confirm Order button clicked!")}
                  className="w-full bg-[#014325] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#014325]/90 disabled:bg-[#f2f3f4] disabled:text-[#5c6466] disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Processing..." : `Confirm Order - ${formatPrice(total)}`}
                </button>

                <div className="mt-4 p-3 bg-[#014325]/5 border border-[#014325] rounded-lg">
                  <p className="text-sm text-[#0f1419] text-center">
                    <strong>Call this number to confirm your order:</strong>
                  </p>
                  <a
                    href="tel:+23275361494"
                    className="block text-center text-lg font-bold text-[#014325] hover:underline mt-1"
                  >
                    +232 75 361494
                  </a>
                </div>

                <p className="text-xs text-center mt-2 text-[#5c6466]">
                  {!isFormValid && "Please fill all required fields"}
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
