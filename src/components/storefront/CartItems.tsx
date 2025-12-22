'use client'

import { useCart } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Trash2, Minus, Plus } from "lucide-react"
import Link from "next/link"

export function CartItems() {
  const { items, removeItem, updateQuantity } = useCart()

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg border-dashed">
        <h3 className="text-lg font-semibold">Your cart is empty</h3>
        <p className="text-muted-foreground mt-2 mb-6">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Button asChild>
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={`${item.product.id}-${item.variantId || 'base'}`} className="flex gap-4 rounded-lg border bg-card p-4">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
            {item.product.images[0] && (
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="h-full w-full object-cover object-center"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">
                  <Link href={`/products/${item.product.slug}`} className="hover:underline">
                    {item.product.name}
                  </Link>
                </h3>
                {/* Show variant options if available in product title or name if we had them stored
                      For now just relying on the fact that different variants are separate rows
                  */}
                <p className="text-sm text-muted-foreground mt-1">
                  ${Number(item.product.price).toFixed(2)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.product.id, item.variantId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.variantId)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
