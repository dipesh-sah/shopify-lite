"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingBag, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, isOpen, closeCart } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wide">Shopping Cart ({items.length})</span>
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-xl font-medium text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => closeCart()} className="mt-4 uppercase font-bold tracking-wider">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {items.map((item) => {
                  const img = item.product.images[0]
                  return (
                    <div key={`${item.product.id}-${item.variantId || 'base'}`} className="flex gap-4">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={img ? (typeof img === 'string' ? img : (img as any).url) : '/placeholder.png'}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between text-base font-medium">
                          <h3 className="line-clamp-2">
                            <Link href={`/products/${item.product.id}`} onClick={closeCart} className="hover:underline">
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="ml-4">${(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                        </div>
                        {/* Variant info if needed, simplified here */}
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center border rounded-md">
                            <button
                              className="px-2 py-1 hover:bg-muted"
                              onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1), item.variantId)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              className="px-2 py-1 hover:bg-muted"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="font-medium text-red-600 hover:text-red-500 flex items-center gap-1"
                            onClick={() => removeItem(item.product.id, item.variantId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="space-y-4 pr-6 pt-4">
              <Separator />
              <div className="flex items-center justify-between text-base font-medium">
                <span>Subtotal</span>
                <span>${total().toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="grid gap-2">
                <Link href="/checkout" onClick={closeCart}>
                  <Button className="w-full bg-black hover:bg-black/90 text-white uppercase font-bold tracking-wider h-12">
                    Checkout
                  </Button>
                </Link>
                <Button variant="outline" onClick={closeCart} className="w-full uppercase font-bold tracking-wider h-12">
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
