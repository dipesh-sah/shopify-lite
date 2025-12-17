"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomerSelector } from "@/components/admin/orders/CustomerSelector"
import { ProductSelector } from "@/components/admin/orders/ProductSelector"
import { createOrderAction } from "@/actions/orders"

interface OrderItem {
  productId: string
  variantId?: string
  title: string
  price: number
  quantity: number
  image?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    country: '',
    zip: '',
    phone: ''
  })

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  //   const tax = 0 // Keeping simple for now
  //   const shipping = 0 // Manual shipping for now? Or 0?
  // Let's allow editing shipping cost manually?
  const [shippingCost, setShippingCost] = useState(0)

  const total = subtotal + shippingCost

  const handleSelectCustomer = (c: any) => {
    setCustomer(c)
    if (c) {
      // Pre-fill address
      const def = c.defaultAddress || (c.addresses && c.addresses[0])
      if (def) {
        setShippingAddress({
          firstName: def.firstName || c.firstName,
          lastName: def.lastName || c.lastName,
          address1: def.address1 || '',
          address2: def.address2 || '',
          city: def.city || '',
          country: def.country || '',
          zip: def.zip || '',
          phone: def.phone || c.phone || ''
        })
      } else {
        setShippingAddress(prev => ({
          ...prev,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone || ''
        }))
      }
    }
  }

  const handleAddProduct = (product: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        productId: product.id,
        title: product.title,
        price: Number(product.price),
        quantity: 1,
        image: product.images?.[0]?.url || (typeof product.images?.[0] === 'string' ? product.images[0] : null)
      }]
    })
  }

  const removeLineItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQty } : item))
  }

  const handleCreateOrder = async () => {
    if (!customer) {
      alert("Please select a customer")
      return
    }
    if (items.length === 0) {
      alert("Please add at least one product")
      return
    }

    setLoading(true)
    try {
      await createOrderAction({
        userId: customer.id, // User ID linked
        customerEmail: customer.email,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
          title: i.title,
          image: i.image
        })),
        total: total, // Logic in backend might recalc, but let's pass it
        shippingCost: shippingCost,
        shippingAddress: shippingAddress,
        billingAddress: shippingAddress, // Logic simplification
        paymentStatus: 'pending' // Manual orders usually pending payment or "Draft"
      })
      router.push('/admin/orders')
      router.refresh()
    } catch (e: any) {
      console.error(e)
      alert("Failed to create order: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create New Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Products */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold mb-4">Products</h2>
            <ProductSelector onSelect={handleAddProduct} />

            <div className="mt-6 space-y-4">
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>}
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden">
                    {item.image && <img src={item.image} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(idx, item.quantity - 1)}>-</Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(idx, item.quantity + 1)}>+</Button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeLineItem(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold mb-4">Payment</h2>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Shipping Cost</span>
              <Input
                type="number"
                value={shippingCost}
                onChange={e => setShippingCost(Number(e.target.value))}
                className="w-24 text-right h-8"
              />
            </div>
            <div className="flex justify-between items-center py-4 border-t mt-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Shipping */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold mb-4">Customer</h2>
            <CustomerSelector onSelect={handleSelectCustomer} selectedCustomer={customer} />
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">First Name</Label>
                  <Input value={shippingAddress.firstName} onChange={e => setShippingAddress({ ...shippingAddress, firstName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Name</Label>
                  <Input value={shippingAddress.lastName} onChange={e => setShippingAddress({ ...shippingAddress, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Address</Label>
                <Input value={shippingAddress.address1} onChange={e => setShippingAddress({ ...shippingAddress, address1: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zip</Label>
                  <Input value={shippingAddress.zip} onChange={e => setShippingAddress({ ...shippingAddress, zip: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Country</Label>
                <Input value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} />
              </div>
            </div>
          </div>

          <Button className="w-full h-12 text-lg" onClick={handleCreateOrder} disabled={loading}>
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
