'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getOrderAction } from '@/actions/orders'
import { getProductAction } from '@/actions/products'
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle, MapPin, Mail, Phone } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface OrderItem {
  productId: string
  name?: string
  image?: string
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
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
  shippingMethod?: {
    name: string
    description: string
  }
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

  const handleDownloadInvoice = () => {
    if (!order) return

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text('INVOICE', 14, 22)

    doc.setFontSize(10)
    doc.text('Shopify Lite', 14, 30)
    doc.text('support@shopifylite.com', 14, 35)

    // Order Info
    doc.text(`Order ID: ${order.orderNumber}`, 140, 22)
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 28)
    doc.text(`Status: ${order.status}`, 140, 34)

    // Bill To
    doc.text('Bill To:', 14, 50)
    if (order.shippingAddress) {
      const addr = order.shippingAddress
      doc.text(`${addr.firstName} ${addr.lastName}`, 14, 56)
      doc.text(`${addr.address1}`, 14, 62)
      if (addr.address2) doc.text(`${addr.address2}`, 14, 68)
      doc.text(`${addr.city}, ${addr.province} ${addr.zip}`, 14, addr.address2 ? 74 : 68)
      doc.text(`${addr.country}`, 14, addr.address2 ? 80 : 74)
    }

    // Items Table
    const tableColumn = ["Item", "Quantity", "Price", "Total"]
    const tableRows = order.items.map(item => [
      item.name || 'Product',
      item.quantity,
      `$${Number(item.price).toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
    })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Subtotal: $${Number(order.total * 0.9).toFixed(2)}`, 140, finalY)
    doc.text(`Tax: $${Number(order.taxTotal || 0).toFixed(2)}`, 140, finalY + 6)
    doc.text(`Shipping: Free`, 140, finalY + 12)
    doc.setFontSize(12)
    doc.text(`Total: $${Number(order.total).toFixed(2)}`, 140, finalY + 20)

    doc.save(`invoice-${order.orderNumber}.pdf`)
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

  const getTimelineSteps = (status: string) => {
    const steps = [
      { id: 'pending', label: 'Order Placed', icon: Package },
      { id: 'processing', label: 'Processing', icon: Clock },
      { id: 'shipped', label: 'Shipped', icon: MapPin },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle },
    ]

    const currentIdx = steps.findIndex(s => s.id === status.toLowerCase())
    // If status is cancelled, show special state? For now assume standard flow
    if (status.toLowerCase() === 'cancelled') return []

    // If not found (e.g. unknown status), default to first?
    const activeIndex = currentIdx === -1 ? 0 : currentIdx

    return steps.map((step, index) => ({
      ...step,
      completed: index <= activeIndex,
      active: index === activeIndex
    }))
  }

  const timeline = getTimelineSteps(order?.status || '')

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-2">
            <button className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2">
              <Mail className="w-4 h-4" />
              Support
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
            >
              <Package className="w-4 h-4" />
              Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className={`inline-flex px-4 py-1.5 rounded-full text-sm font-semibold capitalize border ${getStatusColor(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Timeline (Hidden if cancelled) */}
        {order.status.toLowerCase() !== 'cancelled' && (
          <div className="mb-10 py-6 px-4 md:px-12 bg-white rounded-xl border shadow-sm overflow-x-auto">
            <div className="min-w-[500px] flex items-center justify-between relative">
              {/* Progress Bar Background */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-0 rounded-full" />

              {/* Active Progress Bar */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 rounded-full -z-0"
                style={{ width: `${(timeline.filter(t => t.completed).length - 1) / (timeline.length - 1) * 100}%` }}
              />

              {timeline.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.completed
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-100'
                      : 'bg-white border-gray-200 text-gray-300'
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`absolute top-12 text-sm font-medium whitespace-nowrap transition-colors duration-300 ${step.completed ? 'text-blue-900' : 'text-gray-400'
                      }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="h-6" /> {/* Spacer for labels */}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6 min-w-0">

            {/* Items Card */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Order Items</h2>
                <span className="text-sm text-muted-foreground">{order.items.length} items</span>
              </div>
              <div className="divide-y">
                {order.items.map((item, index) => (
                  <div key={index} className="p-6 flex gap-6 hover:bg-gray-50/40 transition-colors">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">
                            <Link href={`/products/${item.productId}`} className="hover:underline">
                              {item.name || 'Product'}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-medium text-gray-900">
                            ${(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <h2 className="font-semibold text-gray-900">Delivery Information</h2>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="break-words">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
                  {order.shippingAddress ? (
                    <address className="not-italic text-sm text-gray-900 space-y-1">
                      <p className="font-medium">
                        {[order.shippingAddress.firstName, order.shippingAddress.lastName].filter(Boolean).join(' ')}
                      </p>
                      <p>{order.shippingAddress.address1}</p>
                      {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                      <p>
                        {[order.shippingAddress.city, order.shippingAddress.province, order.shippingAddress.zip].filter(Boolean).join(', ')}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && (
                        <p className="mt-2 text-gray-500">{order.shippingAddress.phone}</p>
                      )}
                    </address>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address information.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Shipping Method</h3>
                  <p className="text-sm text-gray-900 font-medium">{order.shippingMethod?.name || 'Standard Delivery'}</p>
                  <p className="text-sm text-gray-500">{order.shippingMethod?.description || 'Takes 3-5 business days'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <h2 className="font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">${Number(order.total * 0.9).toFixed(2)}</span>
                </div>
                {Number(order.taxTotal) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-medium text-gray-900">${Number(order.taxTotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>

                <div className="pt-4 border-t flex justify-between items-end">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.isPaid ? 'Paid with Card ending ••42' : 'Payment Pending'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t">
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Download Invoice
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-4">
                If you have any questions about your order, please contact our support team.
              </p>
              <div className="space-y-2">
                <a href="mailto:support@shopifylite.com" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="w-4 h-4" /> support@shopifylite.com
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" /> +1 (555) 123-4567
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
