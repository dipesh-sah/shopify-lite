'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getOrderAction } from '@/actions/orders'
import { getProductAction } from '@/actions/products'
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle, MapPin, Mail, Phone } from 'lucide-react'

interface OrderItem {
  productId: string
  name?: string
  image?: string
  quantity: number
  price: number
}

interface Order {
  id: string
  total: number
  status: string
  isPaid: boolean
  createdAt: any
  items: OrderItem[]
  customerEmail?: string
  shippingAddress?: {
    firstName?: string
    lastName?: string
    phone?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    zip?: string
    country?: string
  }
  taxTotal?: number
  taxBreakdown?: any
}

export default function OrderDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
      return
    }

    if (user?.id && orderId) {
      loadOrderDetails()
    }
  }, [user, loading, orderId, router])

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true)
      const orderData = await getOrderAction(orderId) as any

      if (!orderData) {
        setError('Order not found.')
        return
      }

      // Check if the order belongs to the current user
      if (orderData.userId && orderData.userId !== user?.id) {
        setError('You do not have permission to view this order.')
        return
      }

      setOrder(orderData as Order)
    } catch (err) {
      console.error('Failed to load order details:', err)
      setError('Failed to load order details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 md:px-6 py-8 md:py-12">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">{error}</h2>
            <Link
              href="/orders"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
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
    <div className="min-h-screen bg-background">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">Order Details</p>
            <h1 className="text-2xl md:text-3xl font-bold">#{order.id.slice(-12)}</h1>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-4">Order Status</h2>
              <div className="flex items-center gap-4">
                {getStatusIcon(order.status)}
                <div className="flex-1">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {order.isPaid && <CheckCircle className="w-4 h-4" />}
                    {order.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2">
                    {order.isPaid ? 'Payment received' : 'Payment pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {item.name || 'Product'}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Price: ${Number(item.price).toFixed(2)} each
                        </p>
                      </div>

                      {/* Item Total */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">
                          ${Number(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No items in this order</p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </h2>
                <div className="space-y-2 text-sm">
                  {(order.shippingAddress.firstName || order.shippingAddress.lastName) && (
                    <p className="font-medium">
                      {[order.shippingAddress.firstName, order.shippingAddress.lastName].filter(Boolean).join(' ')}
                    </p>
                  )}
                  {order.shippingAddress.address1 && (
                    <p>{order.shippingAddress.address1}</p>
                  )}
                  {order.shippingAddress.address2 && (
                    <p>{order.shippingAddress.address2}</p>
                  )}
                  {(order.shippingAddress.city || order.shippingAddress.province || order.shippingAddress.zip) && (
                    <p>
                      {[order.shippingAddress.city, order.shippingAddress.province, order.shippingAddress.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {order.shippingAddress.country && (
                    <p>{order.shippingAddress.country}</p>
                  )}
                  {order.shippingAddress.phone && (
                    <p className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${Number(order.total * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${Number(order.taxTotal || 0).toFixed(2)}</span>
                </div>
                {/* Tax Breakdown */}
                {(() => {
                  let breakdown = order.taxBreakdown;
                  if (typeof breakdown === 'string') {
                    try { breakdown = JSON.parse(breakdown); } catch (e) { }
                  }
                  if (Array.isArray(breakdown) && breakdown.length > 0) {
                    return (
                      <div className="text-xs text-muted-foreground space-y-1 pl-2 border-l">
                        {breakdown.map((line: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>{line.title} ({line.rate}%)</span>
                            <span>${Number(line.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">
                    ${Number(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-4">Order Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Order Date</p>
                  <p className="text-sm">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      : 'N/A'}
                  </p>
                </div>
                {order.customerEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </p>
                    <p className="text-sm break-all">{order.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/products"
                className="w-full inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Continue Shopping
              </Link>
              <Link
                href="/orders"
                className="w-full inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
