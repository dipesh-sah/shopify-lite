"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Minus, Star, ShoppingCart, Eye } from "lucide-react"
import { QuickViewModal } from "./QuickViewModal"
import { useCart } from "@/store/cart"

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = React.useState(0)
  const [quickViewOpen, setQuickViewOpen] = React.useState(false)
  const { addItem, removeItem, updateQuantity, items } = useCart()

  // Sync local quantity with cart quantity
  React.useEffect(() => {
    const cartItem = items.find(item => item.product.id === product.id)
    setQuantity(cartItem ? cartItem.quantity : 0)
  }, [items, product.id])

  const hasVariants = product.variants && product.variants.length > 1
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price

  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  const displayPrice = product.displayPrice ||
    (product.variants && product.variants.length > 0 ? product.variants[0].price : null) ||
    product.price;

  return (
    <div className="group relative bg-white flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-xl p-3 border border-transparent hover:border-gray-100 h-full">
      {/* Product Image Wrapper */}
      <Link href={`/products/${product.slug}`} className="block w-full mb-6 relative outline-none">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-50/50 relative">
          {product.images?.[0] ? (
            <div className="relative h-full w-full">
              <Image
                src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                alt={product.title || product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                className={`object-cover transition-all duration-700 ease-in-out group-hover:scale-110 ${product.images.length > 1 ? 'group-hover:opacity-0' : ''}`}
                loading="lazy"
              />
              {product.images.length > 1 && (
                <Image
                  src={typeof product.images[1] === 'string' ? product.images[1] : product.images[1].url}
                  alt={product.title || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
                  loading="lazy"
                />
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Sale Badge - Floating style with percentage */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm z-10 backdrop-blur-sm bg-red-500/90">
              Sale {discountPercent}% off
            </div>
          )}

          {/* Quick View Overlay (Visible on Hover) */}
          <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              className="w-full bg-black/80 backdrop-blur-md text-white py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <Eye className="h-3.5 w-3.5" /> Quick View
            </button>
          </div>
        </div>
      </Link>

      <div className="flex flex-col items-center w-full grow">
        {/* Category Name */}
        {product.categoryName && (
          <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 mb-1.5 font-semibold">
            {product.categoryName}
          </span>
        )}

        {/* Title */}
        <h3 className="text-[15px] font-medium leading-snug line-clamp-2 min-h-[42px] mb-2 px-2 transition-colors group-hover:text-primary">
          <Link href={`/products/${product.slug}`}>
            {product.title || product.name}
          </Link>
        </h3>

        {/* Star Ratings */}
        <div className="flex items-center gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Pricing - Premium layout */}
        <div className="flex items-baseline gap-2 mb-5">
          <span className={`text-[17px] font-bold ${hasDiscount ? 'text-red-600' : 'text-zinc-900'}`}>
            ${Number(displayPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {hasDiscount && (
            <span className="text-[13px] text-muted-foreground/60 line-through font-medium">
              ${Number(product.compareAtPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="w-full mt-auto pt-2">
          {hasVariants ? (
            <Link
              href={`/products/${product.slug}`}
              className="group/btn relative flex items-center justify-center w-full py-2.5 bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-lg font-semibold text-[13px] hover:bg-black hover:text-white hover:border-black transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Choose Options</span>
              <div className="absolute inset-0 bg-black translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </Link>
          ) : (
            <div className="flex items-center w-full bg-zinc-50 border border-zinc-200 rounded-lg h-10 overflow-hidden px-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (quantity > 0) {
                    setQuantity(q => q - 1);
                    // Remove one from cart
                    addItem({
                      id: product.id,
                      name: product.title || product.name,
                      slug: product.slug,
                      description: product.description || '',
                      price: displayPrice,
                      images: product.images || [],
                      categoryId: product.categoryId || ''
                    }, -1);
                  }
                }}
                className="flex-1 h-full flex items-center justify-center hover:bg-zinc-200 transition-colors text-zinc-500 hover:text-zinc-900 rounded-md"
              >
                <Minus className="h-3 w-3" />
              </button>
              <div className="flex-[1.5] h-full flex items-center justify-center text-sm font-bold text-zinc-800 border-x border-zinc-200/60">
                {quantity}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity(q => q + 1);
                  // Add one to cart
                  addItem({
                    id: product.id,
                    name: product.title || product.name,
                    slug: product.slug,
                    description: product.description || '',
                    price: displayPrice,
                    images: product.images || [],
                    categoryId: product.categoryId || ''
                  }, 1);
                }}
                className="flex-1 h-full flex items-center justify-center hover:bg-zinc-200 transition-colors text-zinc-500 hover:text-zinc-900 rounded-md"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  )
}
