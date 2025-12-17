'use client'

import { useEffect, useState } from 'react'
import { getDashboardStatsAction } from '@/actions/dashboard'
import { DollarSign, ShoppingBag, Package, Clock, Users } from 'lucide-react'
import Link from 'next/link'

import { getAnalyticsUsageAction } from '@/actions/analytics'
import { Download } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    recentOrders: [] as any[]
  })
  const [analyticsData, setAnalyticsData] = useState<any>({ sales: [], topProducts: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [dashStats, analytics] = await Promise.all([
          getDashboardStatsAction(),
          getAnalyticsUsageAction()
        ])
        setStats(dashStats)
        setAnalyticsData(analytics)
      } catch (error) {
        console.error('Failed to load dashboard stats', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...analyticsData.sales.map((s: any) => s.revenue), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <a href="/api/admin/reports/export" target="_blank" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Orders</h3>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">+{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Active Products</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Products in store</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Pending Orders</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Chart */}
        <div className="col-span-4 rounded-xl border bg-card shadow-sm p-6">
          <h3 className="font-semibold mb-6">Sales Over Time directly</h3>
          <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-2">
            {analyticsData.sales.length === 0 ? (
              <div className="w-full text-center text-muted-foreground self-center">No sales data available</div>
            ) : (
              analyticsData.sales.map((day: any) => (
                <div key={day.date} className="flex flex-col items-center gap-2 group flex-1 min-w-[20px]">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-all relative"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      ${day.revenue} ({day.orders} orders)
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap rotate-[-45deg] origin-top-left translate-y-4">{day.date.slice(5)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-3 rounded-xl border bg-card shadow-sm p-6">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="space-y-4">
            {analyticsData.topProducts.map((prod: any, i: number) => (
              <div key={prod.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{prod.title}</p>
                    <p className="text-xs text-muted-foreground">{prod.sold} sold</p>
                  </div>
                </div>
                <div className="text-sm font-bold">
                  ${prod.revenue.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
          {/* Quick Actions moved here or kept? Kept below or removed to save space. */}
          <div className="mt-8 pt-4 border-t space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Quick Actions</h4>
            <Link href="/admin/products/new" className="flex items-center text-sm hover:underline">
              <Package className="mr-2 h-4 w-4" /> Add Product
            </Link>
            <Link href="/admin/discounts" className="flex items-center text-sm hover:underline">
              <DollarSign className="mr-2 h-4 w-4" /> Create Discount
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders - Keep simplified */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 flex items-center justify-between">
          <h3 className="font-semibold">Recent Orders</h3>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="divide-y border-t">
          {stats.recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
              <div className="flex flex-col">
                <span className="font-medium">{order.customerName}</span>
                <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">${order.total.toFixed(2)}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                  }`}>{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
