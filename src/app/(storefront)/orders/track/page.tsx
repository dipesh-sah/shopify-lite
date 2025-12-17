
"use client"

import { useState } from 'react'
import { trackOrderAction } from '@/actions/orders'
import Link from 'next/link'

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const result = await trackOrderAction(orderNumber, email)
      if (result) {
        setOrder(result)
      } else {
        setError('Order not found. Please check your details.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Track Your Order</h1>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Order Number</label>
            <input
              type="text"
              required
              placeholder="#1001"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md font-medium disabled:opacity-50"
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        {order && (
          <div className="mt-6 border-t pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                {order.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p>${Number(order.total).toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Shipping To</p>
                <p>{order.shippingAddress?.address1}, {order.shippingAddress?.city}</p>
              </div>
            </div>

            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" className="block text-center text-blue-600 hover:underline text-sm">
                View Carrier Tracking
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
