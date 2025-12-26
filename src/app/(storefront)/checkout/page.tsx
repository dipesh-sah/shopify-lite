'use client'

import { useCart } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createOrderAction } from '@/actions/orders'
import { getAddressesAction } from '@/actions/addresses'
import { getPromotionByCodeAction } from '@/actions/promotions'
import { calculateTaxAction } from '@/actions/tax'
import { clearCartAction } from '@/actions/cart'
import { showToast } from "@/components/ui/Toast"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, X, CreditCard, Banknote } from "lucide-react"
import { getPaymentMethodsAction } from "@/actions/public-settings"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promotion, setPromotion] = useState<any>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<any>(null)

  // Shipping State
  const [shippingRates, setShippingRates] = useState<any[]>([])
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [taxAmount, setTaxAmount] = useState(0)
  const [taxBreakdown, setTaxBreakdown] = useState<any[]>([])
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false)
  const [calculatingTax, setCalculatingTax] = useState(false)

  const [shippingTax, setShippingTax] = useState(0)

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<{ cashOnDeliveryEnabled: boolean, stripeEnabled: boolean }>({ cashOnDeliveryEnabled: false, stripeEnabled: false })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')

  useEffect(() => {
    async function loadSettings() {
      try {
        const methods = await getPaymentMethodsAction()
        setPaymentMethods(methods)
        // Auto-select if only one is available
        if (methods.cashOnDeliveryEnabled && !methods.stripeEnabled) setSelectedPaymentMethod('cod')
        if (!methods.cashOnDeliveryEnabled && methods.stripeEnabled) setSelectedPaymentMethod('stripe')
      } catch (e) {
        console.error("Failed to load payment methods", e)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    async function loadAddresses() {
      try {
        // Using dynamic import or direct import if server action?
        // Since getAddressesAction is a server action, it's async
        // dynamic import needed to avoid module graph issues? No, standard import works for actions.
        const data = await getAddressesAction()
        setAddresses(data)
        if (data.length > 0) {
          // Default or first
          const def = data.find((a: any) => a.isDefault) || data[0]
          setSelectedAddress(def)
        }
      } catch (e) {
        console.error("Failed to load addresses", e)
      }
    }
    if (user) loadAddresses()
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  // Calculate Shipping
  useEffect(() => {
    async function fetchShippingRates() {
      if (!selectedAddress) return

      setLoadingShipping(true)
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: selectedAddress,
            items: items.map(i => ({ product: i.product, quantity: i.quantity, variantId: i.variantId })),
            total: subtotal
          })
        })
        const data = await res.json()
        if (data.rates) {
          setShippingRates(data.rates)
          // Auto select first if available and none selected, or if only one
          if (data.rates.length > 0 && !selectedShippingRate) {
            setSelectedShippingRate(data.rates[0])
          }
        }
      } catch (e) {
        console.error("Error fetching shipping rates:", e)
      } finally {
        setLoadingShipping(false)
      }
    }

    fetchShippingRates()
  }, [selectedAddress, subtotal])

  const shippingCost = selectedShippingRate ? parseFloat(selectedShippingRate.cost) : 0


  const discountAmount = promotion ? (
    promotion.discountType === 'percentage'
      ? (subtotal * promotion.discountValue) / 100
      : Math.min(promotion.discountValue, subtotal)
  ) : 0

  // Fix Total Calculation: If prices include tax, DON'T add taxAmount again
  const total = Math.max(0, subtotal + shippingCost + (pricesIncludeTax ? 0 : taxAmount) - discountAmount)

  // Calculate Net Subtotal for Display (Excl Tax)
  // If prices INCLUDE tax, we subtract the tax portion from the subtotal to show the "before tax" price
  const itemTax = taxAmount - shippingTax;
  const displaySubtotal = pricesIncludeTax ? (subtotal - itemTax) : subtotal;

  // Calculate Tax
  useEffect(() => {
    async function calcTax() {
      if (!selectedAddress || items.length === 0) return

      setCalculatingTax(true)
      try {
        const res = await calculateTaxAction({
          items: items.map(i => ({
            productId: i.product.id,
            variantId: i.variantId,
            price: Number(i.product.price),
            quantity: i.quantity
          })),
          address: {
            country: selectedAddress.country,
            state: selectedAddress.province,
            zip: selectedAddress.zip
          },
          shippingCost: shippingCost
        })

        setTaxAmount(res.taxTotal)
        setShippingTax(res.shippingTax || 0)
        setTaxBreakdown(res.taxBreakdown)
        setPricesIncludeTax(res.pricesIncludeTax || false)
      } catch (error) {
        console.error('Failed to calculate tax:', error)
      } finally {
        setCalculatingTax(false)
      }
    }

    // Debounce or just run? Shipping updates are async too.
    const timer = setTimeout(calcTax, 500)
    return () => clearTimeout(timer)
  }, [items, selectedAddress, shippingCost])


  async function applyPromotion() {
    if (!promoCode.trim()) {
      showToast('Please enter a promo code', 'error')
      return
    }

    setApplyingPromo(true)
    try {
      const promo = await getPromotionByCodeAction(promoCode)
      if (!promo) {
        showToast('Promo code not found', 'error')
        return
      }

      setPromotion(promo)
      showToast('Promo code applied!', 'success')
      setPromoCode('')
    } catch (error) {
      console.error('Failed to apply promo:', error)
      showToast('Failed to apply promo code', 'error')
    } finally {
      setApplyingPromo(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!user) {
      setError('You must be signed in to place an order')
      return
    }

    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }

    setIsPlacingOrder(true)
    setError(null)

    try {
      const orderData = {
        userId: user.id,
        customerEmail: user.email || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          variantId: item.variantId,
          quantity: item.quantity,
          price: Number(item.product.price),
          title: item.product.name,
          image: item.product.images?.[0] || null,
        })),
        total: total,
        shippingAddress: selectedAddress ? {
          firstName: selectedAddress.firstName,
          lastName: selectedAddress.lastName,
          company: selectedAddress.company,
          address1: selectedAddress.address1,
          address2: selectedAddress.address2,
          city: selectedAddress.city,
          province: selectedAddress.province,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
          phone: selectedAddress.phone
        } : undefined,
        billingAddress: sameAsShipping ? (selectedAddress ? {
          firstName: selectedAddress.firstName,
          lastName: selectedAddress.lastName,
          company: selectedAddress.company,
          address1: selectedAddress.address1,
          address2: selectedAddress.address2,
          city: selectedAddress.city,
          province: selectedAddress.province,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
          phone: selectedAddress.phone
        } : undefined) : (selectedBillingAddress ? {
          firstName: selectedBillingAddress.firstName,
          lastName: selectedBillingAddress.lastName,
          company: selectedBillingAddress.company,
          address1: selectedBillingAddress.address1,
          address2: selectedBillingAddress.address2,
          city: selectedBillingAddress.city,
          province: selectedBillingAddress.province,
          zip: selectedBillingAddress.zip,
          country: selectedBillingAddress.country,
          phone: selectedBillingAddress.phone
        } : undefined),
        shippingMethodId: selectedShippingRate?.methodId,
        shippingCost: shippingCost,
        paymentMethod: selectedPaymentMethod // Pass to backend
      }

      const orderId = await createOrderAction(orderData)
      setSuccess(true)

      // Clear both client-side (localStorage) and server-side (database) cart
      clearCart()
      await clearCartAction()

      setTimeout(() => {
        router.push(`/orders/${orderId}`)
      }, 2000)
    } catch (err) {
      console.error('Error placing order:', err)
      setError('Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. You'll be redirected to your order details shortly.
          </p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 md:px-6 py-8 md:py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="space-y-8">
        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Promo Code Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Promo Code</h2>
          <div className="space-y-4">
            {promotion ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{promotion.code}</p>
                    <p className="text-sm text-green-700">
                      {promotion.discountType === 'percentage'
                        ? `${promotion.discountValue}% off`
                        : `$${promotion.discountValue} off`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPromotion(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={applyPromotion}
                  disabled={applyingPromo || !promoCode.trim()}
                  variant="outline"
                >
                  {applyingPromo ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${displaySubtotal.toFixed(2)}</span>
                  </div>
                  {selectedShippingRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{Number(shippingCost) === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{calculatingTax ? '...' : `$${taxAmount.toFixed(2)}`}</span>
                  </div>
                  {taxBreakdown.length > 0 && !calculatingTax && (
                    <div className="text-xs text-muted-foreground space-y-1 pl-2 border-l">
                      {taxBreakdown.map((line, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{line.title} ({line.rate}%)</span>
                          <span>${line.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {promotion && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({promotion.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Combined Shipping & Billing Info */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Shipping Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Shipping Information</h2>
              <Button variant="ghost" size="sm" asChild>
                <a href="/account/addresses" target="_blank">Change</a>
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Shipping Address</p>
                {selectedAddress ? (
                  <div className="font-medium">
                    <p>{selectedAddress.firstName} {selectedAddress.lastName}</p>
                    <p>{selectedAddress.address1}</p>
                    {selectedAddress.address2 && <p>{selectedAddress.address2}</p>}
                    <p>{selectedAddress.city}, {selectedAddress.province} {selectedAddress.zip}</p>
                    <p>{selectedAddress.country}</p>
                    {selectedAddress.phone && <p className="mt-1 text-muted-foreground">{selectedAddress.phone}</p>}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    No address found. <a href="/account/addresses" className="text-primary hover:underline">Add a shipping address</a>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Methods Selection inside Shipping Section */}
            {shippingRates.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold mb-3">Shipping Method</h3>
                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <div
                      key={rate.rateId}
                      className={`border p-3 rounded-lg flex items-center justify-between cursor-pointer ${selectedShippingRate?.rateId === rate.rateId ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}`}
                      onClick={() => setSelectedShippingRate(rate)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedShippingRate?.rateId === rate.rateId ? 'border-primary' : 'border-gray-300'}`}>
                          {selectedShippingRate?.rateId === rate.rateId && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="font-medium">{rate.label || rate.methodName}</p>
                          {rate.description && <p className="text-xs text-muted-foreground">{rate.description}</p>}
                        </div>
                      </div>
                      <span className="font-semibold">{Number(rate.cost) === 0 ? 'Free' : `$${Number(rate.cost).toFixed(2)}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Billing Section */}
          <div className="p-6 bg-muted/5">
            <h2 className="font-semibold mb-4">Billing Address</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sameAsShipping"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="sameAsShipping" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Same as shipping address
                </label>
              </div>

              {!sameAsShipping && (
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium">Select Billing Address</label>
                  {addresses.length > 0 ? (
                    <div className="grid gap-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`border p-3 rounded-md cursor-pointer flex items-start gap-3 ${selectedBillingAddress?.id === addr.id ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}`}
                          onClick={() => setSelectedBillingAddress(addr)}
                        >
                          <div className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center ${selectedBillingAddress?.id === addr.id ? 'border-primary' : 'border-gray-300'}`}>
                            {selectedBillingAddress?.id === addr.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                            <p className="text-muted-foreground">{addr.address1}, {addr.city}</p>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <a href="/account/addresses" target="_blank">Add New Address</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No addresses found. <a href="/account/addresses" className="text-primary hover:underline" target="_blank">Add one here</a>.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Payment Method</h2>
          <div className="space-y-4">
            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              {paymentMethods.cashOnDeliveryEnabled && (
                <div
                  className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${selectedPaymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}`}
                  onClick={() => setSelectedPaymentMethod('cod')}
                >
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay with cash upon delivery</p>
                    </div>
                  </Label>
                </div>
              )}
              {paymentMethods.stripeEnabled && (
                <div
                  className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${selectedPaymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}`}
                  onClick={() => setSelectedPaymentMethod('stripe')}
                >
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-medium">Credit/Debit Card (Stripe)</p>
                      <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
            {!paymentMethods.cashOnDeliveryEnabled && !paymentMethods.stripeEnabled && (
              <p className="text-sm text-yellow-600">No payment methods are currently enabled.</p>
            )}
          </div>
        </div>

        {/* Place Order Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Ready to Place Your Order?</h3>
          <p className="text-sm text-blue-800">
            Click the button below to confirm and place your order. You'll receive an order confirmation email shortly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.back()} disabled={isPlacingOrder}>
            Continue Shopping
          </Button>
          <Button
            onClick={handlePlaceOrder}
            disabled={items.length === 0 || isPlacingOrder || (!selectedAddress) || (!sameAsShipping && !selectedBillingAddress) || (shippingRates.length > 0 && !selectedShippingRate) || !selectedPaymentMethod}
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </div >
    </div >
  )
}
