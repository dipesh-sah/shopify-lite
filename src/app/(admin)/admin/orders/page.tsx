import Link from "next/link"
import React from 'react';
import { getOrdersAction, getOrderStatsAction } from "@/actions/orders"
import { Mail, DollarSign, Calendar, Package } from "lucide-react"
import OrdersTable from "./OrdersTable"

interface AdminOrdersPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams
  const search = (params?.search as string) || undefined
  const status = (params?.status as string) || undefined
  const paymentStatus = (params?.paymentStatus as string) || undefined
  const page = params?.page ? parseInt(params.page as string) : 1
  const limit = 15

  const [
    { orders, totalCount, totalPages, currentPage },
    stats
  ] = await Promise.all([
    getOrdersAction({
      search,
      status, // Fulfillment Status
      paymentStatus, // Payment Status
      page,
      limit,
      sortOrder: 'desc',
      sortBy: 'created_at'
    }),
    getOrderStatsAction()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage all customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">${Number(stats.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-3xl font-bold mt-1">{stats.deliveredOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <React.Suspense fallback={<div>Loading orders...</div>}>
        <OrdersTable
          orders={orders}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      </React.Suspense>
    </div>
  )
}
