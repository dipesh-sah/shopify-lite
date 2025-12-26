"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCart } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingBag, Globe } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useStoreSettings } from "@/contexts/StoreSettingsContext"
import { CurrencySelector } from "./CurrencySelector"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, isOpen, closeCart, syncWithServer } = useCart()
  const { formatPrice } = useStoreSettings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    syncWithServer()
  }, [])

  if (!mounted) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg bg-white">
        {/* Header with Currency Selector */}
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-gray-50 to-white">
          <SheetHeader className="space-y-4">
            <SheetTitle className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">Shopping Cart</span>
              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <CurrencySelector />
            </div>
          </SheetHeader>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-4 px-6">
            <div className="relative">
              <ShoppingBag className="h-20 w-20 text-gray-300" />
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-xs font-bold">0</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-gray-900">Your cart is empty</p>
              <p className="text-sm text-gray-500">Add items to get started</p>
            </div>
            <Button
              onClick={() => closeCart()}
              className="mt-4 bg-black hover:bg-gray-800 text-white px-8 h-11 rounded-lg font-semibold shadow-lg"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {items.map((item) => {
                  const img = item.product.images[0]
                  return (
                    <div
                      key={`${item.product.id}-${item.variantId || 'base'}`}
                      className="flex gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white shadow-sm bg-white">
                        <img
                          src={img ? (typeof img === 'string' ? img : (img as any).url) : '/placeholder.png'}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/products/${item.product.slug}`}
                              onClick={closeCart}
                              className="text-sm font-semibold text-gray-900 hover:text-gray-600 line-clamp-2 transition-colors"
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-sm font-bold text-gray-900">{formatPrice(Number(item.product.price) * item.quantity)}</p>
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-600 transition-colors"
                              onClick={() => removeItem(item.product.id, item.variantId)}
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                            <button
                              className="px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-700"
                              onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1), item.variantId)}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                            <button
                              className="px-3 py-1.5 hover:bg-gray-50 transition-colors text-gray-700"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t bg-gradient-to-br from-gray-50 to-white px-6 py-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(total())}</span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Shipping and taxes calculated at checkout
                </p>
              </div>

              <div className="grid gap-3">
                <Link href="/checkout" onClick={closeCart}>
                  <Button className="w-full bg-black hover:bg-gray-800 text-white h-12 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={closeCart}
                  className="w-full h-12 rounded-lg font-semibold border-2 hover:bg-gray-50"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
