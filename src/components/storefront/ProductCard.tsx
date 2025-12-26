"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Minus, Star, ShoppingCart, Eye } from "lucide-react"
import { QuickViewModal } from "./QuickViewModal"
import { useCart } from "@/store/cart"
import { useStoreSettings } from "@/contexts/StoreSettingsContext"

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = React.useState(0)
  const [quickViewOpen, setQuickViewOpen] = React.useState(false)
  const { addItem, removeItem, updateQuantity, items } = useCart()
  const { formatPrice } = useStoreSettings()

  // Sync local quantity with cart quantity
  React.useEffect(() => {
    const cartItem = items.find(item => item.product.id === product.id)
    setQuantity(cartItem ? cartItem.quantity : 0)
  }, [items, product.id])

  const displayPrice = product.displayPrice ||
    (product.variants && product.variants.length > 0 ? product.variants[0].price : null) ||
    product.price;

  const hasVariants = product.variants && product.variants.length > 1
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > displayPrice

  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - displayPrice) / product.compareAtPrice) * 100)
    : 0

  return (
    <div className="group relative bg-white flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-xl p-3 border border-transparent hover:border-gray-100 h-full">
      {/* Product Image Wrapper */}
      <Link href={`/products/${product.slug}`} className="block w-full mb-6 relative outline-none">
        <div className="aspect-square w-full overflow-hidden relative">
          {product.images?.[0] ? (
            <div className="relative h-full w-full">
              <Image
                src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                alt={product.title || product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                className={`object-contain transition-all duration-700 ease-in-out group-hover:scale-110 ${product.images.length > 1 ? 'group-hover:opacity-0' : ''}`}
                loading="lazy"
              />
              {product.images.length > 1 && (
                <Image
                  src={typeof product.images[1] === 'string' ? product.images[1] : product.images[1].url}
                  alt={product.title || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-contain opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
                  loading="lazy"
                />
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <ShoppingCart className="h-10 w-10 text-gray-200" />
            </div>
          )}

          {/* Sale Badge */}
          {hasDiscount && (
            <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-full shadow-md z-10">
              SAVE {discountPercent}%
            </div>
          )}

          {/* Quick View Overlay (Visible on Hover) */}
          <div className="absolute inset-x-3 bottom-0 translate-y-4 opacity-0 group-hover:translate-y-[-12px] group-hover:opacity-100 transition-all duration-300 z-20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              className="w-full bg-black/80 backdrop-blur-md text-white py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <Eye className="h-3.5 w-3.5" /> Quick View
            </button>
          </div>
        </div>
      </Link>

      <div className="flex flex-col items-center w-full grow px-2">
        {/* Category Name */}
        {product.categoryName && (
          <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 mb-1.5 font-semibold">
            {product.categoryName}
          </span>
        )}

        {/* Title */}
        <h3 className="text-[13px] font-normal leading-snug line-clamp-2 min-h-[40px] mb-2 text-[#222] hover:text-[#94c94d] transition-colors">
          <Link href={`/products/${product.slug}`}>
            {product.title || product.name}
          </Link>
        </h3>

        {/* Star Ratings */}
        <div className="flex items-center gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="h-3 w-3 fill-black text-black" />
          ))}
        </div>

        {/* Pricing */}
        <div className="flex flex-col items-center gap-0.5 mb-4 px-2">
          {hasDiscount && (
            <span className="text-[14px] text-gray-400 line-through font-normal">
              {formatPrice(Number(product.compareAtPrice))}
            </span>
          )}
          <div className="flex items-center gap-1">
            <span
              className={`text-[16px] ${hasDiscount ? 'text-red-600 font-bold' : 'font-bold'}`}
              style={!hasDiscount ? { color: 'var(--price-color, #111111)' } : {}}
            >
              {hasVariants && <span className="font-medium">From </span>}
              {formatPrice(Number(displayPrice))}
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full mt-auto">
          {hasVariants ? (
            <Link
              href={`/products/${product.slug}`}
              className="relative flex items-center justify-center w-full py-2 bg-white border border-[#94c94d] text-[#94c94d] rounded-md font-semibold text-[13px] transition-colors duration-300 overflow-hidden group"
            >
              {/* Wave effect on hover - must be before text */}
              <span className="absolute inset-0 bg-[#94c94d] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" aria-hidden="true"></span>
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">Choose options</span>
            </Link>
          ) : (
            <div className="flex items-center w-full border border-gray-300 rounded-md h-9 overflow-hidden">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (quantity > 0) {
                    setQuantity(q => q - 1);
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
                className="w-10 h-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 border-r border-gray-300"
              >
                <Minus className="h-3 w-3 text-black" />
              </button>
              <div className="flex-1 h-full flex items-center justify-center text-[13px] font-bold text-[#111]">
                {quantity}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setQuantity(q => q + 1);
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
                className="w-10 h-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 border-l border-gray-300"
              >
                <Plus className="h-3 w-3 text-black" />
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
