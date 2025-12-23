"use client"

import * as React from "react"
import Image from "next/image"
import { Star, X, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCart } from "@/store/cart"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'

interface QuickViewModalProps {
  product: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = React.useState(0)
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null)
  const [quantity, setQuantity] = React.useState(1)
  const [thumbsSwiper, setThumbsSwiper] = React.useState<SwiperType | null>(null)
  const [mainSwiper, setMainSwiper] = React.useState<SwiperType | null>(null)
  const navigationPrevRef = React.useRef<HTMLButtonElement>(null)
  const navigationNextRef = React.useRef<HTMLButtonElement>(null)
  const { addItem, openCart } = useCart()

  const images = product.images || []
  const variants = product.variants || []
  const hasVariants = variants.length > 1 || (variants.length === 1 && variants[0].title !== 'Default Title')

  React.useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariant(variants[0])
    }
  }, [product])

  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const compareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice
  const hasDiscount = compareAtPrice && compareAtPrice > currentPrice

  const handleAddToCart = () => {
    const itemName = (selectedVariant && selectedVariant.title !== 'Default Title')
      ? `${product.title} - ${selectedVariant.title}`
      : product.title;

    addItem({
      id: product.id,
      name: itemName,
      slug: product.slug,
      description: product.description || '',
      price: currentPrice,
      images: product.images || [],
      categoryId: product.categoryId || ''
    }, quantity, selectedVariant?.id)

    onOpenChange(false)
    openCart()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-2xl">
        <div className="grid md:grid-cols-2 h-full max-h-[90vh]">
          {/* Left: Image Gallery */}
          <div className="bg-zinc-50 flex flex-col p-6 space-y-4 overflow-hidden border-r">
            {/* Main Swiper */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-zinc-100 group">
              <Swiper
                onSwiper={setMainSwiper}
                modules={[Navigation, Pagination, Thumbs, FreeMode]}
                spaceBetween={10}
                navigation={{
                  prevEl: navigationPrevRef.current,
                  nextEl: navigationNextRef.current,
                }}
                onBeforeInit={(swiper: any) => {
                  swiper.params.navigation.prevEl = navigationPrevRef.current
                  swiper.params.navigation.nextEl = navigationNextRef.current
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                onSlideChange={(swiper) => setSelectedImage(swiper.activeIndex)}
                className="h-full w-full"
              >
                {images.map((img: any, idx: number) => (
                  <SwiperSlide key={idx}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={typeof img === 'string' ? img : img.url}
                        alt={`${product.title} ${idx + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-4"
                        priority
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Navigation Buttons */}
              <button
                ref={navigationPrevRef}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                ref={navigationNextRef}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm">
                  SALE
                </div>
              )}
            </div>

            {/* Thumbnail Swiper */}
            {images.length > 1 && (
              <Swiper
                onSwiper={setThumbsSwiper}
                modules={[FreeMode, Thumbs]}
                spaceBetween={8}
                slidesPerView={3}
                freeMode={true}
                watchSlidesProgress={true}
                className="thumbs-swiper"
              >
                {images.map((img: any, idx: number) => (
                  <SwiperSlide key={idx}>
                    <button
                      onClick={() => {
                        setSelectedImage(idx)
                        mainSwiper?.slideTo(idx)
                      }}
                      className={cn(
                        "relative w-full aspect-square rounded-md overflow-hidden border-2 transition-all bg-white",
                        selectedImage === idx ? "border-black scale-95 shadow-inner" : "border-transparent hover:border-zinc-300"
                      )}
                    >
                      <Image
                        src={typeof img === 'string' ? img : img.url}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Right: Info */}
          <div className="p-8 flex flex-col h-full overflow-y-auto">
            {product.vendor && (
              <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold mb-2">
                {product.vendor}
              </span>
            )}

            <h2 className="text-2xl font-bold text-zinc-900 mb-4">{product.title}</h2>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-bold text-zinc-900">
                ${Number(currentPrice).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-zinc-400 line-through">
                  ${Number(compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            <div className="h-px bg-zinc-100 w-full mb-6" />

            {/* Variants */}
            {hasVariants && (
              <div className="space-y-4 mb-6">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pick Option</label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
                        selectedVariant?.id === v.id
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-md scale-105"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-4 mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quantity</label>
              <div className="flex items-center w-32 bg-zinc-50 border border-zinc-200 rounded-lg h-10 overflow-hidden px-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-8 flex items-center justify-center hover:bg-zinc-200 rounded-md transition-colors text-zinc-500"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-sm">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-8 flex items-center justify-center hover:bg-zinc-200 rounded-md transition-colors text-zinc-500"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-12 rounded-xl font-bold shadow-lg shadow-zinc-200 transition-all active:scale-[0.98]"
              >
                Add to Cart
              </Button>

              <Link
                href={`/products/${product.slug}`}
                className="flex items-center justify-center w-full text-zinc-500 hover:text-zinc-900 text-sm font-semibold transition-colors group"
              >
                View Full Details <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
