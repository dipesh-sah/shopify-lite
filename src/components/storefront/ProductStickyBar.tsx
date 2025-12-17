'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/store/cart"
import { cn } from "@/lib/utils"

interface ProductStickyBarProps {
  product: any
  selectedVariant: any
  quantity?: number
}

export function ProductStickyBar({ product, selectedVariant, quantity = 1, onVariantSelect }: ProductStickyBarProps & { onVariantSelect?: (variant: any) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(quantity)
  const { addItem } = useCart()

  useEffect(() => {
    setLocalQuantity(quantity)
  }, [quantity])

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 600px
      setIsVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.title,
      description: product.description || '',
      price: product.price,
      images: product.images || [],
      categoryId: product.categoryId || ''
    }, localQuantity, selectedVariant?.id)
    useCart.getState().openCart()
  }

  const image = product.images?.[0] ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t py-3 shadow-lg transform transition-transform duration-300 z-50",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="container flex items-center justify-between gap-4">
        {/* Left Side: Image & Title */}
        {/* Left Side: Image & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {image && (
            <img src={image} alt={product.title} className="h-10 w-10 object-cover rounded-sm hidden sm:block" />
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm text-[#111] truncate">{product.title}</p>
          </div>
        </div>

        {/* Right Side: Select, Qty, Add to Cart */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Variant Selector (Mock/Simplified) */}
          {product.variants && product.variants.length > 0 && (
            <div className="hidden sm:block">
              <select
                className="h-9 px-3 border rounded text-sm bg-white min-w-[120px]"
                value={selectedVariant?.id || ""}
                onChange={(e) => {
                  const variant = product.variants.find((v: any) => v.id === e.target.value)
                  if (variant && onVariantSelect) {
                    onVariantSelect(variant)
                  }
                }}
              >
                {product.variants
                  .filter((v: any) => v.inventoryQuantity > 0)
                  .map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.title} - ${Number(v.price).toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="items-center border border-gray-300 h-9 hidden sm:flex">
            <button className="px-3 h-full hover:bg-gray-50" onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}>-</button>
            <div className="w-8 text-center text-sm">{localQuantity}</div>
            <button className="px-3 h-full hover:bg-gray-50" onClick={() => setLocalQuantity(localQuantity + 1)}>+</button>
          </div>

          <Button className="flex-1 sm:flex-none uppercase font-bold tracking-wider bg-black hover:bg-gray-900 text-white rounded-none h-9 px-6 text-xs" onClick={handleAddToCart}>
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  )
}
