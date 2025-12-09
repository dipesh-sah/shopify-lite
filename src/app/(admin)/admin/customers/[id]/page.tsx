'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCustomerOrders } from '@/lib/firestore'
import { ArrowLeft, Mail, Package, DollarSign, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react'

interface Order {
  id: string
  total: number
  status: string
  isPaid: boolean
  createdAt: any
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
}

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const customerEmail = decodeURIComponent(params.id)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getCustomerOrders(customerEmail)
        setOrders(data as Order[])
      } catch (error) {
        console.error('Failed to load orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [customerEmail])

  // Calculate metrics
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0
  const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0)
  const paidOrders = orders.filter(o => o.isPaid).length
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length
  const firstOrder = orders.length > 0 ? orders[orders.length - 1] : null
  const lastOrder = orders.length > 0 ? orders[0] : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/customers"
          className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Customer Details</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Mail className="w-4 h-4" />
            <p>{customerEmail}</p>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold mt-1">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-3xl font-bold mt-1">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-3xl font-bold mt-1">${averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Items Ordered</p>
              <p className="text-3xl font-bold mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Paid Orders</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{paidOrders}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {orders.length > 0 ? `${((paidOrders / orders.length) * 100).toFixed(0)}% of orders` : 'No orders'}
          </p>
          <div className="mt-3 w-full bg-muted h-1 rounded-full overflow-hidden">
            <div 
              className="bg-green-600 h-full"
              style={{ width: orders.length > 0 ? `${(paidOrders / orders.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Delivered Orders</h3>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{deliveredOrders}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {orders.length > 0 ? `${((deliveredOrders / orders.length) * 100).toFixed(0)}% of orders` : 'No orders'}
          </p>
          <div className="mt-3 w-full bg-muted h-1 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full"
              style={{ width: orders.length > 0 ? `${(deliveredOrders / orders.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pending Orders</h3>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{orders.filter(o => o.status === 'PENDING').length}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {orders.length > 0 ? `${((orders.filter(o => o.status === 'PENDING').length / orders.length) * 100).toFixed(0)}% of orders` : 'No orders'}
          </p>
          <div className="mt-3 w-full bg-muted h-1 rounded-full overflow-hidden">
            <div 
              className="bg-yellow-600 h-full"
              style={{ width: orders.length > 0 ? `${(orders.filter(o => o.status === 'PENDING').length / orders.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      {(firstOrder || lastOrder) && (
        <div className="grid gap-4 md:grid-cols-2">
          {firstOrder && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-2">First Order</p>
              <p className="text-lg font-semibold">
                {firstOrder.createdAt?.toDate
                  ? firstOrder.createdAt.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Customer since this date
              </p>
            </div>
          )}

          {lastOrder && (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground mb-2">Last Order</p>
              <p className="text-lg font-semibold">
                {lastOrder.createdAt?.toDate
                  ? lastOrder.createdAt.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                #{lastOrder.id.slice(-6)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Orders History */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order History ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No orders found for this customer.
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Items</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {orders.map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">#{order.id.slice(-6)}</td>
                    <td className="p-4 align-middle text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-sm">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td className="p-4 align-middle font-semibold">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        order.status === 'DELIVERED'
                          ? 'bg-green-50 text-green-700'
                          : order.status === 'PENDING'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        order.isPaid
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {order.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
