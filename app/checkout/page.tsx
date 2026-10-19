"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/utils-app"
import { getSiteSettings } from "@/lib/actions/products"
import type { Order, Customer, DeliveryAddress } from "@/lib/types"
import { OrderConfirmationModal } from "@/components/order-confirmation-modal"
import { saveOrder } from "@/lib/actions/orders"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart, isLoaded: cartLoaded } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [whatsappUrl, setWhatsappUrl] = useState("")
  const [checkoutError, setCheckoutError] = useState("")
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState(25)
  const [checkoutWhatsapp, setCheckoutWhatsapp] = useState('23233680260')
  const [settingsReady, setSettingsReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [deliveryOption, setDeliveryOption] = useState<Order['deliveryOption']>("standard")
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>("cod")
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "" })
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: "",
    city: "",
    zipCode: "",
    instructions: "",
  })
  const submittingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    getSiteSettings().then(result => {
      if (!result.success) {
        setCheckoutError('Delivery pricing is unavailable. Refresh the page before ordering.')
        return
      }
      const rawFee = result.data.find(setting => setting.key === 'delivery_fee')?.value
      const configuredCheckout = result.data.find(setting => setting.key === 'checkout_whatsapp')?.value?.replace(/\D/g, '')
      if (configuredCheckout) setCheckoutWhatsapp(configuredCheckout)
      if (result.data.find(setting => setting.key === 'is_open')?.value === 'false') {
        setCheckoutError('Online orders are temporarily closed. Please call the restaurant.')
        return
      }
      const fee = Number(rawFee ?? 25)
      if (!Number.isFinite(fee) || fee < 0 || fee > 10000) {
        setCheckoutError('Delivery pricing is unavailable. Please contact the restaurant.')
        return
      }
      setDeliveryFeeAmount(fee)
      setSettingsReady(true)
    }).catch(() => setCheckoutError('Delivery pricing is unavailable. Refresh the page before ordering.'))
  }, [])

  useEffect(() => {

    if (mounted && cartLoaded && cart.length === 0 && !showConfirmation) {
      router.push("/cart")
    }
  }, [cart.length, cartLoaded, mounted, showConfirmation, router])

  const deliveryFees = {
    standard: deliveryFeeAmount,
    pickup: 0,
  }

  const subtotal = getCartTotal()
  const deliveryFee = deliveryFees[deliveryOption]
  const total = subtotal + deliveryFee

  const handleDeliveryOptionChange = (option: Order['deliveryOption']) => {
    setDeliveryOption(option)
  }

  const handlePaymentMethodChange = (method: Order['paymentMethod']) => {
    setPaymentMethod(method)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current || !isFormValid) return
    setCheckoutError("")

    const orderItems = [...cart].map((item) => ({
      productId: item.productId,
      product: { ...item.product },
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      selectedVariant: item.selectedVariant,
      selectedAddOns: item.selectedAddOns,
    }))


    if (orderItems.length === 0) {
      alert("Your cart is empty. Please add items before checkout.")
      return
    }

    submittingRef.current = true
    setIsProcessing(true)

    try {
      // Save order to Supabase
      const deliveryMethodMapped =
        deliveryOption === "pickup" ? "pickup" : "delivery"
      const paymentMethodMapped =
        paymentMethod === "orange-money"
          ? "orange_money"
          : paymentMethod === "afrimoney"
          ? "afrimoney"
          : "cash"

      const savedOrder = await saveOrder({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: deliveryMethodMapped === 'pickup' ? '' : `${deliveryAddress.street}, ${deliveryAddress.city}${deliveryAddress.zipCode ? ` ${deliveryAddress.zipCode}` : ''}`,
        deliveryMethod: deliveryMethodMapped,
        paymentMethod: paymentMethodMapped,
        expectedTotal: total,
        notes: deliveryAddress.instructions,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          variantName: item.selectedVariant?.name,
          quantity: item.quantity,
          addons: item.selectedAddOns?.map(addon => ({ name: addon.name })) ?? [],
        })),
      })
      if (!savedOrder.success) throw new Error(savedOrder.error)
      const orderRef = savedOrder.orderId

      const order: Order = {
        id: orderRef,
        reference: orderRef,
        customer,
        deliveryAddress,
        items: orderItems,
        subtotal: savedOrder.subtotal,
        deliveryFee: savedOrder.deliveryFee,
        tax: 0,
        discount: 0,
        total: savedOrder.total,
        deliveryOption,
        paymentMethod,
        status: "pending",
        createdAt: new Date(),
      }


      const itemsList = orderItems
        .map((item, idx) => {
          const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : ""
          return `${idx + 1}. ${item.product.name}${variantText} x${item.quantity} - Le ${item.totalPrice}`
        })
        .join("\n")


      const message = [
        `New order from Pee's Bakery`,
        `Order reference: ${orderRef}`,
        `Customer: ${customer.name}`,
        `Phone: ${customer.phone}`,
        customer.email ? `Email: ${customer.email}` : '',
        deliveryMethodMapped === 'pickup' ? 'Pickup' : `Delivery: ${deliveryAddress.street}, ${deliveryAddress.city}${deliveryAddress.zipCode ? ` ${deliveryAddress.zipCode}` : ''}`,
        deliveryAddress.instructions ? `Instructions: ${deliveryAddress.instructions}` : '',
        `Items:\n${itemsList}`,
        `Subtotal: Le ${savedOrder.subtotal}`,
        `Delivery fee: Le ${savedOrder.deliveryFee}`,
        `Total: Le ${savedOrder.total}`,
        `Payment preference: ${paymentMethod === 'cod' ? 'Cash' : paymentMethod === 'orange-money' ? 'Orange Money' : 'Afrimoney'}`,
        'Please confirm availability and payment instructions.',
      ].filter(Boolean).join('\n\n')
      const whatsappURL = `https://wa.me/${checkoutWhatsapp}?text=${encodeURIComponent(message)}`


      setWhatsappUrl(whatsappURL)

      setCompletedOrder(order)
      setShowConfirmation(true)

      clearCart()

    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Order could not be saved. Please try again.')
    } finally {
      submittingRef.current = false
      setIsProcessing(false)
    }
  }

  const isFormValid = Boolean(
    customer.name.trim() &&
      customer.phone.trim() &&
      (deliveryOption === 'pickup' || (deliveryAddress.street.trim() && deliveryAddress.city.trim())) &&
      cart.length > 0 && settingsReady,
  )

  if (!mounted || !cartLoaded || (cart.length === 0 && !showConfirmation)) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <OrderConfirmationModal
        order={completedOrder}
        whatsappUrl={whatsappUrl}
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
                      required={deliveryOption !== 'pickup'}
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
                      required={deliveryOption !== 'pickup'}
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                      placeholder="Freetown"
                    />
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium mb-2">
                      ZIP/Postal Code (optional)
                    </label>
                    <input
                      id="zipCode"
                      type="text"
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
                      <p className="text-sm text-[#5c6466]">We&apos;ll confirm timing when we review your order.</p>
                    </div>
                    <span className="font-bold text-[#014325]">{formatPrice(deliveryFeeAmount)}</span>
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
                      <p className="text-sm text-[#5c6466]">We&apos;ll confirm when your order is ready.</p>
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
                      value="afrimoney"
                      checked={paymentMethod === "afrimoney"}
                      onChange={() => handlePaymentMethodChange("afrimoney")}
                      className="w-5 h-5 text-[#014325] focus:ring-2 focus:ring-[#014325]"
                    />
                    <div className="flex-1">
                      <p className="font-bold">Afrimoney</p>
                      <p className="text-sm text-[#5c6466]">Ask our team for payment instructions after ordering.</p>
                    </div>
                  </label>
                </div>

                {paymentMethod !== "cod" && (
                  <div className="mt-6 rounded-lg border border-[#fd4d00] bg-[#fffbf5] p-4 text-sm text-[#0f1419]">
                    Select your preferred mobile money method here. Our team will confirm the payment details after reviewing your order. Do not send payment until you have confirmed the recipient with the team.
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
                  className="w-full bg-[#014325] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#014325]/90 disabled:bg-[#f2f3f4] disabled:text-[#5c6466] disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Placing order..." : `Place Order - ${formatPrice(total)}`}
                </button>
                {checkoutError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{checkoutError}</p>}

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
                  {!settingsReady ? 'Checkout is temporarily unavailable.' : !isFormValid ? 'Please fill all required fields.' : ''}
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
