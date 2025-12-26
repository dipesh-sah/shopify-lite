'use client'

import { useEffect, useState, useRef } from 'react'
import { getDashboardStatsAction } from '@/actions/dashboard'
import { DollarSign, ShoppingBag, Package, Clock, Store } from 'lucide-react'
import Link from 'next/link'
import { InventoryAlerts } from '@/components/admin/dashboard/InventoryAlerts'
import { TopCustomers } from '@/components/admin/dashboard/TopCustomers'

import { getAnalyticsUsageAction } from '@/actions/analytics'
import { Download } from 'lucide-react'
import { SalesAreaChart } from '@/components/admin/dashboard/SalesAreaChart'
import { exportDashboardAction } from '@/actions/dashboard' // Updated import
import { showToast } from '@/components/ui/Toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    pendingB2BApplications: 0,
    recentOrders: [] as any[],
    inventoryAlerts: [] as any[],
    topCustomers: [] as any[]
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

  // Scroll chart to end on load
  const chartRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollLeft = chartRef.current.scrollWidth
    }
  }, [analyticsData.sales])

  async function handleExport() {
    try {
      showToast('Generating report...', 'info')
      const result = await exportDashboardAction() // Updated action call

      if (result.error) {
        showToast(result.error, 'error')
        return
      }

      if (result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || 'report.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Report downloaded successfully', 'success')
      }
    } catch (error) {
      console.error('Export failed:', error)
      showToast('Failed to export report', 'error')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...analyticsData.sales.map((s: any) => s.revenue), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
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

        <Link href="/admin/b2b/applications" className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary/50">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground group-hover:text-primary">B2B Applications</h3>
            <Store className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.pendingB2BApplications}</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </div>
        </Link>
      </div>

      {/* Sales Chart */}
      {/* Middle Section: Sales Chart & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <div className="rounded-xl border bg-card shadow-sm p-6 lg:col-span-2">
          <h3 className="font-semibold mb-6">Sales Over Time</h3>
          <SalesAreaChart data={analyticsData.sales} height={320} />
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border bg-card shadow-sm h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold">Recent Orders</h3>
            </div>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="flex-1 overflow-auto">
            {stats.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No recent orders.</div>
            ) : (
              <div className="divide-y">
                {stats.recentOrders.map((order) => (
                  <Link href={`/admin/orders/${order.id}`} key={order.id} className="block hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{order.customerName}</span>
                        <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">${order.total.toFixed(2)}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>{order.status}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Section: Top Customers & Inventory Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopCustomers customers={stats.topCustomers || []} />
        <InventoryAlerts products={stats.inventoryAlerts || []} />
      </div>
    </div>
  )
}
