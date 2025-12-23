'use client'

import { Star, Package, Truck, Shield, Share2, Heart, ArrowRightLeft, Check, AlertCircle, ZoomIn, X, ChevronLeft, ChevronRight, Tag, Box } from "lucide-react"
import { useEffect, useState, useRef } from "react"
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
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules'
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
}

export function ProductDetailClient({ product, initialReviews, initialStats }: ProductDetailClientProps) {
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
    window.location.href = '/checkout'
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
              <h3 className="font-semibold text-sm">{product.title}</h3>
              <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ${Number(currentPrice).toFixed(2)}
              </p>
            </div>
          </div>
          <Button onClick={handleAddToCart} disabled={currentStock <= 0} className="bg-primary hover:bg-primary/90 text-white px-8">
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
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery with Swiper */}
          <div className="space-y-4">
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
                className="rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl"
              >
                {images.map((img: any, idx: number) => (
                  <SwiperSlide key={idx}>
                    <div className="aspect-square flex items-center justify-center">
                      <img
                        src={typeof img === 'string' ? img : img.url}
                        alt={`${product.title} ${idx + 1}`}
                        className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
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
                <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg z-10">
                  SAVE {discountPercent}%
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
            {/* Vendor */}
            {product.vendor && (
              <div className="inline-block px-4 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full">
                <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {product.vendor}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">{product.title}</h1>

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
                <span className="ml-2 text-sm text-gray-600">({reviewStats.totalReviews} reviews)</span>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                currentStock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}>
                {currentStock > 0 ? `✓ In Stock (${currentStock})` : 'Out of Stock'}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-extrabold text-primary">
                ${Number(currentPrice).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-gray-400 line-through">
                  ${Number(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            <Separator />

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && !(product.variants.length === 1 && product.variants[0].title === 'Default Title') && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Select Options</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        "px-6 py-3 rounded-xl font-medium transition-all",
                        selectedVariant?.id === variant.id
                          ? "bg-primary text-white shadow-lg scale-105"
                          : "bg-white border-2 border-gray-200 hover:border-primary/30 text-gray-700"
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
              <label className="font-semibold text-gray-900">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-5 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-xl font-bold">−</span>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center font-semibold text-lg border-none focus:ring-0"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-5 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  Total: <span className="font-bold text-gray-900">${(Number(currentPrice) * quantity).toFixed(2)}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all"
              >
                {currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              {currentStock > 0 && (
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-14 text-lg font-semibold bg-destructive hover:bg-destructive/90 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Buy Now
                </Button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => inWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
                className={cn(
                  "flex-1 h-12 border-2 transition-all",
                  inWishlist
                    ? "border-pink-500 text-pink-500 bg-pink-50 hover:bg-pink-100"
                    : "hover:border-indigo-600 hover:text-indigo-600"
                )}
              >
                <Heart className={cn("w-5 h-5 mr-2", inWishlist && "fill-pink-500")} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
              <Button variant="outline" className="flex-1 h-12 border-2 hover:border-indigo-600 hover:text-indigo-600">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>

            {/* Product Details */}
            <div className="space-y-3 p-6 bg-white rounded-2xl border-2 border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-600" />
                Product Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.sku && (
                  <div>
                    <span className="text-gray-600">SKU:</span>
                    <p className="font-semibold text-gray-900">{product.sku}</p>
                  </div>
                )}
                {product.barcode && (
                  <div>
                    <span className="text-gray-600">Barcode:</span>
                    <p className="font-semibold text-gray-900">{product.barcode}</p>
                  </div>
                )}
                {product.productType && (
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-semibold text-gray-900">{product.productType}</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="text-gray-600">Weight:</span>
                    <p className="font-semibold text-gray-900">{product.weight} {product.weightUnit}</p>
                  </div>
                )}
                {product.categoryName && (
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-semibold text-gray-900">{product.categoryName}</p>
                  </div>
                )}
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="pt-3 border-t">
                  <span className="text-gray-600 text-sm flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />
                    Tags:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Quality Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-20">
          <div className="flex justify-center gap-8 border-b-2 border-gray-200">
            {['description', 'specifications', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 px-6 text-lg font-semibold capitalize transition-all relative",
                  activeTab === tab
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 max-w-4xl mx-auto">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <div
                  className="text-gray-700 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: product.description || "No description available." }}
                />
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900 w-1/3">Brand</td>
                      <td className="px-6 py-4 text-gray-700">{product.vendor || 'N/A'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">SKU</td>
                      <td className="px-6 py-4 text-gray-700">{product.sku || 'N/A'}</td>
                    </tr>
                    {product.barcode && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">Barcode</td>
                        <td className="px-6 py-4 text-gray-700">{product.barcode}</td>
                      </tr>
                    )}
                    {product.productType && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">Product Type</td>
                        <td className="px-6 py-4 text-gray-700">{product.productType}</td>
                      </tr>
                    )}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">Weight</td>
                      <td className="px-6 py-4 text-gray-700">
                        {product.weight ? `${product.weight} ${product.weightUnit}` : 'N/A'}
                      </td>
                    </tr>
                    {product.categoryName && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">Category</td>
                        <td className="px-6 py-4 text-gray-700">{product.categoryName}</td>
                      </tr>
                    )}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">Availability</td>
                      <td className="px-6 py-4 text-gray-700">
                        {currentStock > 0 ? `In Stock (${currentStock} available)` : 'Out of Stock'}
                      </td>
                    </tr>
                    {product.productNumber && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">Product Number</td>
                        <td className="px-6 py-4 text-gray-700">{product.productNumber}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8">
                  <ReviewForm productId={product.id} onReviewSubmit={refreshReviews} />
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      <p className="text-sm text-gray-600">— {review.userName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
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
