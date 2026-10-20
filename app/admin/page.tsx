'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/admin-types'
import { ArrowRight, BookOpen, Clock, LockKeyhole, Package, ShoppingBag, Wallet } from 'lucide-react'
import Link from 'next/link'
import styles from './page.module.css'
import toast from 'react-hot-toast'

interface Stats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  totalProducts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, todayRevenue: 0, pendingOrders: 0, totalProducts: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = useMemo(() => createClient(), [])

  const fetchData = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const [todayOrdersRes, pendingRes, productsRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total').gte('created_at', todayStr).neq('status', 'cancelled'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10),
    ])
    if (todayOrdersRes.error || pendingRes.error || productsRes.error || recentRes.error) {
      setError('Dashboard data could not be loaded. Check your connection and try again.')
      setLoading(false)
      return
    }

    const todayRevenue = (todayOrdersRes.data || []).reduce((sum: number, row: { total: number | string | null }) => sum + Number(row.total || 0), 0)
    setStats({
      todayOrders: todayOrdersRes.data?.length || 0,
      todayRevenue,
      pendingOrders: pendingRes.count || 0,
      totalProducts: productsRes.count || 0,
    })
    setRecentOrders(recentRes.data || [])
    setError('')
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) void fetchData() })
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: { new: unknown }) => {
        const order = payload.new as Order
        toast(`🛒 New Order! #${order.id.substring(0,8).toUpperCase()} — ${order.customer_name}`, {
          duration: 8000,
          style: { background: '#f97316', color: 'white', fontWeight: '700' },
        })
        void fetchData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        void fetchData()
      })
      .subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [fetchData, supabase])

  const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    preparing: '#0ea5e9',
    ready: '#22c55e',
    out_for_delivery: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Overview</span>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>A clear view of today&apos;s orders and storefront activity.</p>
        </div>
        <Link href="/admin/orders" className={styles.viewAllBtn}>
          Manage orders <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </header>

      {error && <div role="alert" className={styles.empty}>{error} <button type="button" onClick={() => { setLoading(true); void fetchData() }}>Try again</button></div>}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<ShoppingBag size={22} />}
          title="Today's Orders"
          value={loading || error ? '—' : stats.todayOrders}
          color="#f97316"
          bg="#fff7ed"
        />
        <StatCard
          icon={<Wallet size={22} />}
          title="Today's revenue"
          value={loading || error ? '—' : `Le ${stats.todayRevenue.toLocaleString()}`}
          color="#166534"
          bg="#f0fdf4"
        />
        <StatCard
          icon={<Clock size={22} />}
          title="Pending orders"
          value={loading || error ? '—' : stats.pendingOrders}
          color="#f59e0b"
          bg="#fffbeb"
          alert={stats.pendingOrders > 0}
        />
        <StatCard
          icon={<Package size={22} />}
          title="Active products"
          value={loading || error ? '—' : stats.totalProducts}
          color="#3b82f6"
          bg="#eff6ff"
        />
      </div>

      <div className={styles.contentGrid}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div><span className={styles.sectionKicker}>Latest activity</span><h2>Recent orders</h2></div>
          <Link href="/admin/orders">View all <ArrowRight size={15} /></Link>
        </div>
        <div className={styles.ordersTable}>
          <table>
            <caption className={styles.srOnly}>The ten most recent customer orders</caption>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j}><div className={styles.skeletonCell} /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>{error ? 'Orders are unavailable.' : 'New orders will appear here.'}</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className={styles.orderNum}>{order.id.substring(0,8).toUpperCase()}</td>
                    <td>
                      <div className={styles.customerName}>{order.customer_name}</div>
                      <div className={styles.customerPhone}>{order.customer_phone}</div>
                    </td>
                    <td>{order.order_items?.length || 0} items</td>
                    <td className={styles.amount}>Le {order.total?.toLocaleString()}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ background: (STATUS_COLORS[order.status] || '#627169') + '20', color: STATUS_COLORS[order.status] || '#627169' }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.date}>
                      {new Date(order.created_at).toLocaleDateString('en-SL', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={styles.viewBtn} aria-label={`View order ${order.id.substring(0,8)}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className={styles.quickActions}>
        <span className={styles.sectionKicker}>Shortcuts</span>
        <h2>Quick actions</h2>
        <p>Get where you need to go.</p>
        <div className={styles.actionsGrid}>
          <Link href="/admin/orders" className={styles.action}>
            <span className={styles.actionIcon}><ShoppingBag size={19} /></span>
            <span>View orders</span><ArrowRight size={17} className={styles.actionArrow} />
          </Link>
          <Link href="/admin/menu" className={styles.action}>
            <span className={styles.actionIcon}><BookOpen size={19} /></span>
            <span>Digital menu</span><ArrowRight size={17} className={styles.actionArrow} />
          </Link>
          <Link href="/admin/account" className={styles.action}>
            <span className={styles.actionIcon}><LockKeyhole size={19} /></span>
            <span>My account</span><ArrowRight size={17} className={styles.actionArrow} />
          </Link>
        </div>
      </aside>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color, bg, alert }: {
  icon: React.ReactNode; title: string; value: string | number; color: string; bg: string; alert?: boolean
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: bg, color }}>
        {icon}
        {alert && <span className={styles.alertDot} aria-hidden="true" />}
      </div>
      <div className={styles.statBody}>
        <span className={styles.statTitle}>{title}</span>
        <span className={styles.statValue}>{value}</span>
      </div>
    </div>
  )
}
