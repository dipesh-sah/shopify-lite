'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getCustomerOrdersAction } from '@/actions/orders'
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  isPaid: boolean
  createdAt: any
  items: Array<{
    productId: string
    name?: string
    image?: string
    quantity: number
    price: number
  }>
  customerEmail?: string
  shippingAddress?: any
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
      return
    }

    if (user?.id) {
      loadOrders()
    }
  }, [user, loading, router])

  const loadOrders = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const data = await getCustomerOrdersAction(undefined, user.id)

      if (Array.isArray(data)) {
        setOrders(data)
      } else {
        console.error('Invalid orders data received:', data)
        setOrders([])
        setError('Received invalid data from server.')
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Initializing session...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'CANCELLED':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Package className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container px-4 md:px-6 py-8 md:py-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders. Start shopping to create your first order!
            </p>
            <Link
              href="/products"
              className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">

                {/* 1. Header Row (ID & Date) */}
                <div className="p-6 pb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order ID</h3>
                    <p className="text-base font-bold text-gray-900">#{order.orderNumber}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order Date</h3>
                    <p className="text-base font-medium text-gray-900">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* 2. Items Section */}
                <div className="p-6 py-4 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-center">
                          {/* Image */}
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name || 'Product'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name || `Product ID: ${item.productId}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          </div>

                          {/* Price */}
                          <p className="text-sm font-semibold text-gray-900">
                            ${Number(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic">No items details available</p>
                    )}
                  </div>
                </div>

                {/* 3. Footer Section (Status, Total, Action) */}
                <div className="p-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">

                  {/* Status */}
                  <div className="w-full sm:w-auto">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 sm:mb-1">Status</h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize border ${order.status.toLowerCase() === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status.toLowerCase() === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total</h3>
                    <p className="text-xl font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                  </div>
                </div>

                {/* Action Button (Separate Row or inline? Image implies separate or bottom left) 
                   The image shows "View Details" button on the bottom left, below status. 
                   Let's put it in a separate padding block or vertically stacked if needed. 
                   Actually looking closely at the image: 
                   Row 1: ID -------- Date
                   Row 2: Items
                   Row 3: Status (Left) ----- Total (Right)
                   Row 4: View Details Button (Left)
                */}
                <div className="px-6 pb-6">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
