"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateOrderStatus } from "@/lib/actions/orders"
import { AdminHeader } from "@/components/admin/admin-header"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const ORDER_FLOW = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [adminName, setAdminName] = useState("Admin")
  const [filterStatus, setFilterStatus] = useState("all")
  const [stats, setStats] = useState({ total: 0, pending: 0, today: 0, revenue: 0 })

  const loadOrders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })

    if (data) {
      setOrders(data)
      const today = new Date().toDateString()
      const todayOrders = data.filter((o) => new Date(o.created_at).toDateString() === today)
      setStats({
        total: data.length,
        pending: data.filter((o) => o.status === "pending").length,
        today: todayOrders.length,
        revenue: todayOrders.reduce((sum, o) => sum + Number(o.total), 0),
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/admin/login")
        return
      }
      supabase
        .from("admin_profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.full_name) setAdminName(profile.full_name)
        })
    })

    loadOrders()

    // Real-time subscription for new orders
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router, loadOrders])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }))
    }
    setStats((prev) => ({
      ...prev,
      pending: orders.filter((o) => (o.id === orderId ? newStatus === "pending" : o.status === "pending")).length,
    }))
  }

  const filteredOrders =
    filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-SL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen bg-[#f6f8f5] font-sans">
      <AdminHeader adminName={adminName} active="orders" />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Orders", value: stats.total, color: "text-[#014325]" },
            { label: "Pending", value: stats.pending, color: "text-yellow-600" },
            { label: "Today's Orders", value: stats.today, color: "text-blue-600" },
            { label: "Today's Revenue", value: `Le ${stats.revenue.toLocaleString()}`, color: "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-[#e5e7e8] p-4">
              <p className="text-xs text-[#5c6466] mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl border border-[#e5e7e8]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7e8]">
            <h2 className="font-bold text-lg text-[#0f1419]">Orders</h2>
            <div className="flex items-center gap-2 overflow-x-auto">
              {["all", "pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === s
                      ? "bg-[#014325] text-white"
                      : "bg-[#f0f2f3] text-[#5c6466] hover:bg-[#e5e7e8]"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#5c6466]">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-[#5c6466]">No orders found.</div>
          ) : (
            <div className="divide-y divide-[#f0f2f3]">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="px-6 py-4 hover:bg-[#fafafa] cursor-pointer transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#0f1419] truncate">{order.customer_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-[#5c6466]">{order.customer_phone}</p>
                      <p className="text-xs text-[#5c6466] mt-1 truncate">{order.customer_address}</p>
                      <p className="text-xs text-[#9ca3af] mt-1">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#014325]">Le {Number(order.total).toLocaleString()}</p>
                      <p className="text-xs text-[#5c6466]">{order.order_items?.length ?? 0} items</p>
                      <p className="text-xs text-[#5c6466] capitalize">{order.delivery_method}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e5e7e8] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-[#f0f2f3] flex items-center justify-center text-[#5c6466] hover:bg-[#e5e7e8] transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selectedOrder.status]}`}>
                  {STATUS_LABELS[selectedOrder.status]}
                </span>
                <span className="text-xs text-[#5c6466]">{formatDate(selectedOrder.created_at)}</span>
              </div>

              {/* Customer */}
              <div className="bg-[#f8f9fa] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#5c6466] uppercase mb-2">Customer</p>
                <p className="font-semibold text-[#0f1419]">{selectedOrder.customer_name}</p>
                <p className="text-sm text-[#5c6466]">{selectedOrder.customer_phone}</p>
                {selectedOrder.customer_address && (
                  <p className="text-sm text-[#5c6466] mt-1">{selectedOrder.customer_address}</p>
                )}
                <p className="text-sm text-[#5c6466] capitalize mt-1">
                  {selectedOrder.delivery_method === "pickup" ? "Pickup" : "Delivery"} •{" "}
                  {selectedOrder.payment_method?.replace("_", " ")}
                </p>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-[#5c6466] uppercase mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-[#0f1419]">
                          {item.product_name}
                          {item.variant_name && <span className="text-[#5c6466]"> ({item.variant_name})</span>}
                        </p>
                        <p className="text-[#5c6466] text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-[#0f1419]">Le {Number(item.total_price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-[#e5e7e8] pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-[#5c6466]">
                  <span>Subtotal</span>
                  <span>Le {Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5c6466]">
                  <span>Delivery Fee</span>
                  <span>Le {Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0f1419] text-base pt-1">
                  <span>Total</span>
                  <span>Le {Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <p className="text-xs font-semibold text-[#5c6466] uppercase mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {ORDER_FLOW.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        selectedOrder.status === status
                          ? "bg-[#014325] text-white cursor-default"
                          : "bg-[#f0f2f3] text-[#5c6466] hover:bg-[#e5e7e8]"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                    disabled={selectedOrder.status === "cancelled"}
                    className={`px-3 py-2 rounded-lg text-xs font-medium col-span-2 transition-colors ${
                      selectedOrder.status === "cancelled"
                        ? "bg-red-500 text-white cursor-default"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
