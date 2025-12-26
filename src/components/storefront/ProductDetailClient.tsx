'use client'

import { Star, Package, Truck, Shield, Share2, Heart, ArrowRightLeft, Check, AlertCircle, ZoomIn, X, ChevronLeft, ChevronRight, Tag, Box } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/store/cart"
import { useWishlist } from "@/store/wishlist"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { refreshProductReviewsAction } from "@/actions/reviews"
import { ReviewForm } from "@/components/storefront/ReviewForm"
import { getRelatedProductsAction } from "@/actions/products"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, FreeMode, Autoplay } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'

interface ProductDetailClientProps {
  product: any
  initialReviews: any[]
  initialStats: { totalReviews: number; averageRating: string | number }
  metafields?: any[]
}

export function ProductDetailClient({ product, initialReviews, initialStats, metafields = [] }: ProductDetailClientProps) {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<any[]>(initialReviews)
  const [reviewStats, setReviewStats] = useState(initialStats)
  const [activeTab, setActiveTab] = useState('description')
  const [showImageModal, setShowImageModal] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)
  const navigationPrevRef = useRef<HTMLButtonElement>(null)
  const navigationNextRef = useRef<HTMLButtonElement>(null)

  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const inWishlist = isInWishlist(product.id)

  const images = product.images || []
  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const currentStock = selectedVariant ? selectedVariant.inventoryQuantity : product.quantity
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > currentPrice
  const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice - currentPrice) / product.compareAtPrice) * 100) : 0

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }

    // Load related products
    getRelatedProductsAction(product.id, 4).then(setRelatedProducts)

    // Sticky bar on scroll
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [product])

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

    // Reset quantity to 1 after adding to cart
    setQuantity(1)
    useCart.getState().openCart()
  }

  const handleBuyNow = () => {
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

    // Reset quantity before navigating to checkout
    setQuantity(1)

    // Use router.push instead of window.location.href to avoid full page reload
    router.push('/checkout')
  }

  const refreshReviews = async () => {
    const data = await refreshProductReviewsAction(product.id)
    if (data) {
      setReviews(data.reviews)
      setReviewStats(data.stats)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Add to Cart Bar - Bottom */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t shadow-lg transition-transform duration-300",
        showStickyBar ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {images[0] && (
              <img src={typeof images[0] === 'string' ? images[0] : images[0].url} alt={product.title} className="w-12 h-12 object-cover rounded-lg" />
            )}
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">{product.title}</h3>
              <p className="text-base font-bold text-[#f14b4b]">
                ${Number(currentPrice).toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={currentStock <= 0}
            className="bg-[#90c63e] hover:bg-[#81b238] text-white px-8 h-10 text-xs font-bold rounded-sm shadow-md"
          >
            {currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <span>/</span>
            {product.categoryName && (
              <>
                <Link href={`/collections/${product.categoryId}`} className="hover:text-indigo-600 transition-colors">{product.categoryName}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image Gallery with Swiper - Sticky on Desktop */}
          <div className="lg:sticky lg:top-8 lg:h-fit space-y-4">
            {/* Main Swiper */}
            <div className="relative group">
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
                className="rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl touch-manipulation"
                style={{ touchAction: 'pan-y pinch-zoom' }}
              >
                {images.map((img: any, idx: number) => (
                  <SwiperSlide key={idx}>
                    <div className="aspect-square flex items-center justify-center touch-manipulation">
                      <img
                        src={typeof img === 'string' ? img : img.url}
                        alt={`${product.title} ${idx + 1}`}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        style={{ touchAction: 'none' }}
                        draggable={false}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Custom Navigation Buttons */}
              <button
                ref={navigationPrevRef}
                className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                ref={navigationNextRef}
                className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>

              {/* Zoom Button */}
              <button
                onClick={() => setShowImageModal(true)}
                className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-4 right-4 bg-[#ff4d8d] text-white px-3 py-1 rounded-sm font-bold text-[10px] uppercase z-10">
                  Sale {discountPercent}% off
                </div>
              )}
            </div>

            {/* Thumbnail Swiper */}
            {images.length > 1 && (
              <Swiper
                onSwiper={setThumbsSwiper}
                modules={[FreeMode, Thumbs]}
                spaceBetween={12}
                slidesPerView={3}
                freeMode={true}
                watchSlidesProgress={true}
                className="thumbs-swiper"
                breakpoints={{
                  640: { slidesPerView: 4 },
                  768: { slidesPerView: 5 },
                }}
              >
                {images.map((img: any, idx: number) => (
                  <SwiperSlide key={idx}>
                    <button
                      onClick={() => {
                        setSelectedImage(idx)
                        mainSwiper?.slideTo(idx)
                      }}
                      className={cn(
                        "w-full aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                        selectedImage === idx
                          ? "border-indigo-600 shadow-lg scale-105"
                          : "border-gray-200 hover:border-indigo-300"
                      )}
                    >
                      <img
                        src={typeof img === 'string' ? img : img.url}
                        alt={`${product.title} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Badge */}
            <div className="inline-flex items-center px-4 py-1.5 bg-[#f0f0ff] rounded-full">
              <span className="text-[10px] font-bold text-[#8a8aff] uppercase tracking-widest">
                {product.vendor || 'Home Sweet Home'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
              {product.title}
            </h1>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < Math.round(Number(reviewStats.averageRating))
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    )}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">({reviewStats.totalReviews} reviews)</span>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                currentStock > 0 ? "bg-[#e1f9f0] text-[#00b06b]" : "bg-red-100 text-red-700"
              )}>
                {currentStock > 0 ? (
                  <>
                    <Check className="w-3 h-3" />
                    In Stock ({currentStock})
                  </>
                ) : 'Out of Stock'}
              </div>
            </div>

            {/* Price Row */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    ${Number(product.compareAtPrice).toFixed(2)} USD
                  </span>
                )}
                <span className="text-xl font-bold text-[#f14b4b]">
                  ${Number(currentPrice).toFixed(2)} USD
                </span>
                {hasDiscount && (
                  <span className="bg-[#f14b4b] text-white px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase">
                    Sale {discountPercent}% off
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                <Link href="/shipping-policy" className="underline hover:text-gray-900 transition-colors">Shipping</Link> calculated at checkout.
              </p>
            </div>

            <Separator />

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && !(product.variants.length === 1 && product.variants[0].title === 'Default Title') && (
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all border",
                        selectedVariant?.id === variant.id
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-900 border-gray-200 hover:border-gray-400"
                      )}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Quantity</label>
              <div className="flex items-center bg-white border border-gray-300 rounded-sm w-fit h-8 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className={cn(
                    "px-3 transition-colors h-full flex items-center border-r border-gray-300",
                    quantity <= 1
                      ? "bg-gray-100 cursor-not-allowed opacity-50"
                      : "hover:bg-gray-50 cursor-pointer"
                  )}
                >
                  <span className="text-gray-400">−</span>
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value === '') {
                      setQuantity(1)
                      return
                    }
                    const parsed = parseInt(value, 10)
                    const maxQuantity = currentStock > 0 ? currentStock : 999
                    setQuantity(Math.min(parsed, maxQuantity))
                  }}
                  className="w-10 text-center text-xs font-medium text-gray-800 border-none focus:ring-0 focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const maxQuantity = currentStock > 0 ? currentStock : 999
                    setQuantity(Math.min(quantity + 1, maxQuantity))
                  }}
                  disabled={quantity >= currentStock}
                  className={cn(
                    "px-3 transition-colors h-full flex items-center border-l border-gray-300",
                    quantity >= currentStock
                      ? "bg-gray-100 cursor-not-allowed opacity-50"
                      : "hover:bg-gray-50 cursor-pointer"
                  )}
                >
                  <span className="text-gray-400">+</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                variant="outline"
                className="w-full h-11 text-xs font-semibold border-[#90c63e] text-[#90c63e] hover:bg-[#90c63e]/5 rounded-sm transition-all"
              >
                {currentStock > 0 ? 'Add to cart' : 'Out of Stock'}
              </Button>
              {currentStock > 0 && (
                <Button
                  onClick={handleBuyNow}
                  className="w-full h-11 text-xs font-bold bg-[#90c63e] hover:bg-[#81b238] text-white rounded-sm transition-all shadow-sm"
                >
                  Buy it now
                </Button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => inWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Heart className={cn("w-3.5 h-3.5", inWishlist && "fill-pink-500 text-pink-500")} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
              <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>

            {/* Product Details */}
            <div className="space-y-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-[#111827] flex items-center gap-2">
                <Box className="w-5 h-5 text-[#2563eb]" />
                Product Details
              </h3>
              <div className="grid grid-cols-2 gap-y-6 text-sm">
                {product.sku && (
                  <div>
                    <span className="text-gray-400 block mb-1">SKU:</span>
                    <p className="font-bold text-gray-800 uppercase">{product.sku}</p>
                  </div>
                )}
                {product.productType && (
                  <div>
                    <span className="text-gray-400 block mb-1">Type:</span>
                    <p className="font-bold text-gray-800">{product.productType}</p>
                  </div>
                )}
                {product.categoryName && (
                  <div>
                    <span className="text-gray-400 block mb-1">Category:</span>
                    <p className="font-bold text-gray-800">{product.categoryName}</p>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-[#f3f4ff] text-[#2563eb] rounded-full text-xs font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-[#f7f7ff] rounded-3xl">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#f43f5e] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Quality Guarantee</span>
              </div>
            </div>

            {/* Tabs Section - Moved inside right column */}
            <div className="pt-10">
              <div className="flex justify-start gap-8 border-b border-gray-200">
                {['Description', 'Specifications', 'Reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={cn(
                      "pb-4 px-1 text-sm font-bold transition-all relative",
                      activeTab === tab.toLowerCase()
                        ? "text-[#2563eb]"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase() && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#2563eb]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                {activeTab === 'description' && (
                  <div className="prose prose-sm max-w-none">
                    <div
                      className="text-gray-600 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{ __html: product.description || "No description available." }}
                    />
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden text-sm">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-900 w-1/3">Brand</td>
                          <td className="px-4 py-3 text-gray-600">{product.vendor || 'N/A'}</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-900">SKU</td>
                          <td className="px-4 py-3 text-gray-600">{product.sku || 'N/A'}</td>
                        </tr>
                        {product.productType && (
                          <tr className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">Product Type</td>
                            <td className="px-4 py-3 text-gray-600">{product.productType}</td>
                          </tr>
                        )}
                        <tr className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-900">Availability</td>
                          <td className="px-4 py-3 text-gray-600">
                            {currentStock > 0 ? `In Stock (${currentStock} available)` : 'Out of Stock'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900">Excellent</span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-[#ffb400] text-[#ffb400]" />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">Based on {reviewStats.totalReviews}+ reviews</span>
                      </div>
                    </div>
                    <ReviewForm productId={product.id} onReviewSubmit={refreshReviews} />
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No reviews yet.</p>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-3 h-3",
                                      i < review.rating ? "fill-[#ffb400] text-[#ffb400]" : "fill-gray-200 text-gray-200"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-xs mb-1">{review.title}</h4>
                            <p className="text-gray-600 text-[11px] mb-2">{(review as any).content || (review as any).comment || '—'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">— {review.userName || (review as any).author_name || 'Anonymous'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information Accordion */}
            <div className="pt-10 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Product Information</h2>
              <div className="divide-y border-t border-b overflow-hidden">
                {metafields.filter(m => m.namespace === 'custom' && m.key.startsWith('faq_q')).length > 0 ? (
                  metafields.filter(m => m.namespace === 'custom' && m.key.startsWith('faq_q')).map((m, idx) => {
                    const keyNum = m.key.replace('faq_q', '');
                    const answerMeta = metafields.find(am => am.namespace === 'custom' && am.key === `faq_a${keyNum}`);
                    return (
                      <details key={idx} className="group py-4">
                        <summary className="flex items-center justify-between cursor-pointer list-none">
                          <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors uppercase tracking-wider">
                            {m.value}
                          </span>
                          <div className="transition-transform group-open:rotate-180">
                            <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                          </div>
                        </summary>
                        <div className="mt-3 text-xs text-gray-600 leading-relaxed px-1">
                          {answerMeta?.value || "Details coming soon..."}
                        </div>
                      </details>
                    );
                  })
                ) : (
                  [
                    { q: "How Are The Products Delivered?", a: "We use reliable shipping carriers to ensure your products reach you safely and on time." },
                    { q: "How Do I Personalise My Product?", a: "You can select variants or contact our support for specific customization requests." },
                    { q: "Damage Guarantees & Policy", a: "We offer a 30-day guarantee for any damaged or defective items received." }
                  ].map((item, idx) => (
                    <details key={idx} className="group py-4">
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors uppercase tracking-wider">
                          {item.q}
                        </span>
                        <div className="transition-transform group-open:rotate-180">
                          <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                        </div>
                      </summary>
                      <div className="mt-3 text-xs text-gray-600 leading-relaxed px-1">
                        {item.a}
                      </div>
                    </details>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        {reviews.length > 0 && (
          <div className="container mx-auto px-4 mt-24">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Customer reviews</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < Math.round(Number(reviewStats.averageRating))
                          ? "fill-[#ffb400] text-[#ffb400]"
                          : "fill-gray-200 text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {Number(reviewStats.averageRating).toFixed(1)} out of 5
                </span>
                <span className="text-sm text-gray-400">Based on {reviewStats.totalReviews}+ reviews</span>
              </div>
            </div>

            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="reviews-swiper pb-12"
            >
              {reviews.map((review, idx) => (
                <SwiperSlide key={idx}>
                  <div className="bg-[#f7f7f7] rounded-3xl p-8 space-y-4 h-full">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-[#ffb400] text-[#ffb400]' : 'fill-gray-300 text-gray-300'}`} />
                      ))}
                    </div>
                    <h4 className="font-bold text-gray-900">{review.title || "Highly Recommended"}</h4>
                    <p className="text-sm text-gray-600 line-clamp-4 italic">
                      "{(review as any).content || (review as any).comment || 'Great product!'}"
                    </p>
                    <p className="text-xs font-bold text-gray-800">— {review.userName || (review as any).author_name || 'Verified Buyer'}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
        {/* Other Industry Favorites (Related Products) */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Other Industry Favorites
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {relatedProducts.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          {images[selectedImage] && (
            <img
              src={typeof images[selectedImage] === 'string' ? images[selectedImage] : images[selectedImage].url}
              alt={product.title}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
    </div>
  )
}
