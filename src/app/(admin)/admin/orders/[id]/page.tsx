'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getOrderAction, updateOrderStatusAction, updatePaymentStatusAction } from '@/actions/orders'
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle, Mail, Calendar, DollarSign, Pencil, Download } from 'lucide-react'
import { useStoreSettings } from '@/components/providers/StoreSettingsProvider'
import { generateInvoice } from '@/components/admin/orders/InvoiceGenerator'
import { MetafieldsRenderer } from "@/components/admin/metadata/MetafieldsRenderer"
import { updateOrderAction } from '@/actions/orders'
import Loading from '@/components/ui/Loading'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  isPaid: boolean
  createdAt: any
  customerEmail?: string
  customerFirstName?: string
  customerLastName?: string
  customerPhone?: string
  customerTotalOrders?: number
  customerTotalSpent?: number
  userId?: string
  shippingAddress?: {
    address1: string
    city: string
    province?: string
    zip: string
    country: string
    firstName?: string
    lastName?: string
    phone?: string
    company?: string
    address2?: string
  }
  billingAddress?: {
    firstName?: string
    lastName?: string
    company?: string
    address1?: string
    address2?: string
    city?: string
    province?: string
    zip?: string
    country?: string
    phone?: string
  }
  items: Array<{
    productId: string
    name?: string
    image?: string
    quantity: number
    price: number
  }>
  taxTotal?: number
  taxBreakdown?: any
}

export default function AdminOrderDetailsPage() {
  const params = useParams()
  const { formatPrice } = useStoreSettings()
  const [order, setOrder] = useState<Order | null>(null)
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

      // Check if taxTotal is present, or map if needed.
      // Usually getOrderAction returns DB columns snake_case? 
      // But getOrderAction calls getOrderMySQL which selects *.
      // DB columns: tax_total, tax_breakdown.
      // If UI expects taxTotal (camelCase), I must map it here manually OR update getOrderAction?
      // getOrderAction currently just returns 'order'.
      // If getOrderMySQL returns row directly, it is snake_case.
      // BUT `order.items` suggests some mapping happened?
      // getOrderMySQL logic (Step 57 summary, or viewed earlier):
      // It returns `items` array nested.
      // Let's assume it maps keys to camelCase? Or stays snake_case?
      // Check Order interface above: `customerEmail`, `shippingAddress`. These are camelCase.
      // So mapping happens. 
      // I should check getOrderMySQL mapping logic to see if it maps tax_total -> taxTotal.
      // If not, I should add mapping here.

      // Let's assume I need to map it if not present.
      const raw: any = orderData;
      const mappedOrder = {
        ...orderData,
        taxTotal: raw.taxTotal ?? raw.tax_total,
        taxBreakdown: raw.taxBreakdown ?? raw.tax_breakdown,
        isPaid: orderData.paymentStatus === 'paid' || orderData.paymentStatus === 'PAID',
      }

      setOrder(mappedOrder as unknown as Order)
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
      // Normalize to lowercase for DB
      const result = await updateOrderStatusAction(order.id, newStatus.toLowerCase())
      if (result.error) {
        throw new Error(result.error)
      }
      setOrder({ ...order, status: newStatus.toLowerCase() })
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
      // Toggle logic
      const newPaymentStatus = order.isPaid ? 'pending' : 'paid'

      const result = await updatePaymentStatusAction(order.id, newPaymentStatus)
      if (result.error) {
        throw new Error(result.error)
      }

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
        <Loading size="lg" variant="centered" text="Loading order details..." />
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

  // Helper to safely handle status case for select
  const currentStatus = order?.status?.toUpperCase() || 'PENDING'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Order #{order.orderNumber}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${order.isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                {order.isPaid ? 'PAID' : 'PAYMENT PENDING'}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateInvoice(order)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="w-4 h-4" />
            Invoice
          </button>
          <button
            onClick={() => handleStatusChange('PENDING')}
            disabled={isUpdating}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Restock
          </button>
          <button
            className="px-3 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Fulfillment Card */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status.toUpperCase() === 'DELIVERED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {order.status === 'DELIVERED' ? 'Fulfilled' : 'Unfulfilled'} ({order.items?.length || 0})
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  Primary Location
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={order.status.toUpperCase()}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdating}
                  className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-1"
                >
                  <option value="PENDING">Mark as Unfulfilled</option>
                  <option value="SHIPPED">Mark as Fulfilled</option>
                  <option value="DELIVERED">Mark as Delivered</option>
                </select>
              </div>
            </div>

            <div className="p-6">
              <div className="border rounded-md p-4 mb-4 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Standard Shipping</p>
                  <p className="text-xs text-gray-500">Free Shipping</p>
                </div>
              </div>

              <div className="space-y-6">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded border bg-gray-100 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : <Package className="w-full h-full p-2 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{item.name || 'Product'}</p>
                        {/* <p className="text-xs text-gray-500">SKU: {item.productId.slice(0,8)}</p> */}
                        <p className="text-sm mt-1">{formatPrice(item.price)} × {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(Number(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => handleStatusChange('SHIPPED')}
                disabled={isUpdating}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
              >
                Mark as fulfilled
              </button>
              <button
                onClick={() => handleStatusChange('SHIPPED')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Create shipping label
              </button>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                  {order.isPaid ? 'Paid' : 'Payment pending'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{order.items?.length || 0} items</span>
                <span className="font-medium">{formatPrice(Number(order.total) * 0.9)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-600">Standard (0.71 lb)</span>
                <span className="font-medium">{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <div className="text-right">
                  <span className="font-medium block">{formatPrice(order.taxTotal || 0)}</span>
                  {/* Breakdown */}
                  {(() => {
                    let breakdown = order.taxBreakdown;
                    if (typeof breakdown === 'string') {
                      try { breakdown = JSON.parse(breakdown); } catch (e) { }
                    }
                    if (Array.isArray(breakdown) && breakdown.length > 0) {
                      return (
                        <div className="text-xs text-gray-500 mt-1">
                          {breakdown.map((line: any, i: number) => (
                            <div key={i}>
                              {line.title} ({line.rate}%): {formatPrice(line.amount)}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>

              <div className="flex justify-between text-sm pt-3 border-t">
                <span className="text-gray-600">Paid by customer</span>
                <span className="font-medium">{order.isPaid ? formatPrice(order.total) : formatPrice(0)}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              {/* Just a visual button for now, action handled by toggle or we can hook it up */}
              <button
                onClick={handlePaymentToggle}
                disabled={isUpdating}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
              >
                {order.isPaid ? 'Mark as Unpaid' : 'Collect payment'}
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm text-gray-900">Notes</h3>
              <button className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-500">No notes from customer</p>
          </div>

          {/* Metafields */}
          <MetafieldsRenderer
            ownerType="order"
            ownerId={order.id}
            onChange={async (metafields) => {
              await updateOrderAction(order.id, { metafields })
            }}
          />

          {/* Customer */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-sm text-gray-900">Customer</h3>
              <button className="text-gray-400 hover:text-gray-600">...</button>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-4 last:border-0 last:pb-0">
                <Link href={`/admin/customers/${encodeURIComponent(order.customerEmail || '')}`} className="text-sm font-medium text-blue-600 hover:underline block">
                  {order.customerFirstName && order.customerLastName ? `${order.customerFirstName} ${order.customerLastName}` : order.customerEmail}
                </Link>
                <p className="text-xs text-gray-500 mt-1">{order.customerTotalOrders || 0} orders</p>
              </div>

              <div className="border-b pb-4 last:border-0 last:pb-0">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Contact information</h4>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer">{order.customerEmail}</p>
                <p className="text-sm text-gray-900 mt-1">{order.customerPhone || 'No phone number'}</p>
              </div>

              <div className="border-b pb-4 last:border-0 last:pb-0">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Shipping address</h4>
                <div className="text-sm text-gray-900">
                  {order.shippingAddress ? (
                    <>
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                      {order.shippingAddress.company && <>{order.shippingAddress.company}<br /></>}
                      {order.shippingAddress.address1}<br />
                      {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
                      {order.shippingAddress.city} {order.shippingAddress.province} {order.shippingAddress.zip}<br />
                      {order.shippingAddress.country}<br />
                      {order.shippingAddress.phone || order.customerPhone}
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No shipping address provided</span>
                  )}
                </div>
              </div>

              <div className="pb-0">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Billing address</h4>
                <div className="text-sm text-gray-900">
                  {order.billingAddress ? (
                    <>
                      {order.billingAddress.firstName} {order.billingAddress.lastName}<br />
                      {order.billingAddress.company && <>{order.billingAddress.company}<br /></>}
                      {order.billingAddress.address1}<br />
                      {order.billingAddress.address2 && <>{order.billingAddress.address2}<br /></>}
                      {order.billingAddress.city} {order.billingAddress.province} {order.billingAddress.zip}<br />
                      {order.billingAddress.country}<br />
                      {order.billingAddress.phone || order.customerPhone}
                    </>
                  ) : (
                    <span className="text-gray-500">Same as shipping address</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Conversion (Static Placeholder) */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-sm text-gray-900 mb-4">Conversion summary</h3>
            <p className="text-sm text-gray-500">There are no conversion details available for this order.</p>
          </div>

        </div>
      </div>
    </div>
  )
}

