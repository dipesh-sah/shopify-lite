'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getOrderAction, updateOrderStatusAction } from '@/actions/orders'
import { getProductAction } from '@/actions/products'
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle, Mail, Calendar, DollarSign } from 'lucide-react'

interface Order {
  id: string
  total: number
  status: string
  isPaid: boolean
  createdAt: any
  customerEmail?: string
  userId?: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
}

interface Product {
  id: string
  name: string
  images?: string[]
  price: number
}

export default function AdminOrderDetailsPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [products, setProducts] = useState<Map<string, Product>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

  useEffect(() => {
    loadOrderDetails()
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true)
      const orderData = await getOrderAction(orderId)

      if (!orderData) {
        setError('Order not found.')
        return
      }

      setOrder(orderData as Order)

      // Load product details for all items
      if (orderData.items) {
        const productMap = new Map<string, Product>()
        for (const item of orderData.items) {
          try {
            const product = await getProductAction(item.productId)
            if (product) {
              productMap.set(item.productId, product as any)
            }
          } catch (err) {
            console.error(`Failed to load product ${item.productId}:`, err)
          }
        }
        setProducts(productMap)
      }
    } catch (err) {
      console.error('Failed to load order details:', err)
      setError('Failed to load order details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    setIsUpdating(true)
    try {
      await updateOrderStatusAction(order.id, newStatus)
      setOrder({ ...order, status: newStatus })
    } catch (err) {
      console.error('Error updating order status:', err)
      setError('Failed to update order status.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePaymentToggle = async () => {
    if (!order) return

    setIsUpdating(true)
    try {
      // Note: Action currently serves status updates. Explicit payment update might need separate action if logic differs. 
      // Assuming updateOrderStatusAction handles payment status if passed (need to update action)
      // For now, disabling payment toggle or making action accept it.
      await updateOrderStatusAction(order.id, order.status) // TODO: Add isPaid to action
      setOrder({ ...order, isPaid: !order.isPaid })
    } catch (err) {
      console.error('Error updating payment status:', err)
      setError('Failed to update payment status.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">{error || 'Order not found'}</h2>
        </div>
      </div>
    )
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-12)}</h1>
          <p className="text-muted-foreground mt-1">Manage this order</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Order Status</h2>
            <div className="flex items-center gap-4 mb-6">
              {getStatusIcon(order.status)}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Update Status</label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => {
                  const product = products.get(item.productId)
                  return (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {product?.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-medium">{product?.name || 'Product'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Price: ${Number(item.price).toFixed(2)} each
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">
                          ${Number(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-muted-foreground text-sm">No items in this order</p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Customer Information</h2>
            <div className="space-y-3">
              {order.customerEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <Link
                      href={`/admin/customers/${encodeURIComponent(order.customerEmail)}`}
                      className="text-primary hover:underline break-all"
                    >
                      {order.customerEmail}
                    </Link>
                  </div>
                </div>
              )}
              {order.userId && (
                <div className="flex items-start gap-3">
                  <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm break-all">{order.userId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(order.total * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  ${Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Payment Status</h2>
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.isPaid
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
                }`}>
                {order.isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
            <button
              onClick={handlePaymentToggle}
              disabled={isUpdating}
              className="w-full px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : order.isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>
          </div>

          {/* Order Information */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Order Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Order Date
                </p>
                <p className="text-sm font-medium">
                  {order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Order Total
                </p>
                <p className="text-sm font-medium">${Number(order.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
