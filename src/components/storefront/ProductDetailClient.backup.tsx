'use client'

import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { VariantSelector } from "@/components/storefront/VariantSelector"
import { Star, Package, Truck, Shield, Share2, Heart, ArrowRightLeft, Check, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useCart } from "@/store/cart"
import Link from "next/link"
import { ProductGallery } from "@/components/storefront/ProductGallery"
import { ProductStickyBar } from "@/components/storefront/ProductStickyBar"
import { RelatedProducts } from "@/components/storefront/RelatedProducts"
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed"
import { ReviewList } from "@/components/storefront/ReviewList"
import { ReviewForm } from "@/components/storefront/ReviewForm"
import { refreshProductReviewsAction } from "@/actions/reviews"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ProductDetailClientProps {
  product: any
  initialReviews: any[]
  initialStats: { totalReviews: number; averageRating: string | number }
}

export function ProductDetailClient({ product, initialReviews, initialStats }: ProductDetailClientProps) {
  const [attributeGroups, setAttributeGroups] = useState<any[]>([])
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<any[]>(initialReviews)
  const [reviewStats, setReviewStats] = useState(initialStats)

  const { addItem } = useCart()

  // Initialize Attribute Groups and Recently Viewed
  useEffect(() => {
    // Derive attribute groups from variants
    if (product.variants && product.variants.length > 0) {
      const derivedGroups: any[] = [];
      const optionKeys = new Set<string>();

      product.variants.forEach((v: any) => {
        if (v.options) {
          Object.keys(v.options).forEach(k => optionKeys.add(k));
        }
      });

      optionKeys.forEach(key => {
        const values = new Set<string>();
        product.variants.forEach((v: any) => {
          if (v.options && v.options[key]) {
            values.add(v.options[key]);
          }
        });
        if (values.size > 0) {
          derivedGroups.push({
            id: key,
            name: key,
            options: Array.from(values)
          });
        }
      });

      setAttributeGroups(derivedGroups);
      setSelectedVariant(product.variants[0]);
    }

    // Add to recently viewed
    const recent = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
    const filtered = recent.filter((p: any) => p.id !== product.id)
    const newHistory = [product, ...filtered].slice(0, 10)
    localStorage.setItem('recently_viewed', JSON.stringify(newHistory))
  }, [product])

  const currentPrice = selectedVariant ? selectedVariant.price : product.price
  const currentCompareAtPrice = product.compareAtPrice
  const currentStock = selectedVariant ? selectedVariant.inventoryQuantity : product.quantity
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku

  const hasDiscount = currentCompareAtPrice && currentCompareAtPrice > currentPrice
  const discountPercent = hasDiscount
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : 0

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.title,
      description: product.description || '',
      price: product.price,
      images: product.images || [],
      categoryId: product.categoryId || ''
    }, quantity, selectedVariant?.id)
    useCart.getState().openCart()
  }

  const refreshReviews = async () => {
    const data = await refreshProductReviewsAction(product.id)
    if (data) {
      setReviews(data.reviews)
      setReviewStats(data.stats)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProductStickyBar
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        onVariantSelect={(v) => setSelectedVariant(v)}
      />

      {/* Breadcrumb */}
      <div className="border-b bg-muted/20">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            {product.categoryName && (
              <>
                <Link href={`/collections/${product.categoryId}`} className="hover:text-foreground">{product.categoryName}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground font-medium">{product.title}</span>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-6">
            <ProductGallery images={product.images || []} productName={product.title} />
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              {product.vendor && (
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {product.vendor}
                </div>
              )}

              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{product.title}</h1>

              <div className="flex items-center gap-4">
                <div className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                  currentStock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.round(Number(reviewStats.averageRating)) ? "fill-current text-yellow-500" : "fill-none text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground ml-1 text-slate-500">({reviewStats.totalReviews} reviews)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-4xl font-bold">${Number(currentPrice).toFixed(2)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${Number(currentCompareAtPrice).toFixed(2)}
                    </span>
                    <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                      SAVE {discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              {product.variants && product.variants.length > 0 && (
                <VariantSelector
                  variants={product.variants}
                  attributeGroups={attributeGroups}
                  onVariantSelect={(variant, options) => setSelectedVariant(variant)}
                  basePrice={product.price}
                />
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center w-32 border rounded-md">
                  <button
                    className="px-3 py-2 hover:bg-muted transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >-</button>
                  <input
                    className="w-full text-center border-none focus:ring-0 p-0 text-sm"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button
                    className="px-3 py-2 hover:bg-muted transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >+</button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <Button
                  size="lg"
                  className="flex-1 bg-black hover:bg-black/90 text-white h-12 text-base"
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                >
                  {currentStock > 0 ? `Add to cart - $${(Number(currentPrice) * quantity).toFixed(2)}` : 'Out of Stock'}
                </Button>
                {currentStock > 0 && (
                  <Button size="lg" variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base">
                    Buy it now
                  </Button>
                )}
                <Button size="icon" variant="outline" className="h-12 w-12 flex-shrink-0">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="outline" className="h-12 w-12 flex-shrink-0">
                  <ArrowRightLeft className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">SKU:</span> {currentSku || 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Category:</span> {product.categoryName || 'Uncategorized'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-b py-6 text-center text-sm mt-4 bg-muted/10 rounded-lg">
                <div className="flex flex-col items-center gap-2 p-2">
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="font-medium">Free shipping over $50</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border-l border-r">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="font-medium">Secure checkout</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2">
                  <Check className="h-6 w-6 text-primary" />
                  <span className="font-medium">Satisfaction guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <Tabs defaultValue="description" className="w-full">
            <div className="border-b mb-8">
              <div className="flex justify-center">
                <TabsList className="bg-transparent h-auto p-0 space-x-8">
                  <TabsTrigger
                    value="description"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none pb-4 text-xl font-medium"
                  >
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="additional"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none pb-4 text-xl font-medium"
                  >
                    Additional Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none pb-4 text-xl font-medium"
                  >
                    Reviews ({reviewStats.totalReviews})
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="max-w-5xl mx-auto">
              <TabsContent value="description" className="space-y-4">
                <div className="prose max-w-none text-muted-foreground leading-relaxed">
                  {product.description || "No description available."}
                </div>
              </TabsContent>
              <TabsContent value="additional">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y">
                      <tr className="bg-muted/30">
                        <th className="px-6 py-4 font-medium w-1/3">Brand</th>
                        <td className="px-6 py-4">{product.vendor || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th className="px-6 py-4 font-medium">SKU</th>
                        <td className="px-6 py-4">{currentSku || 'N/A'}</td>
                      </tr>
                      <tr className="bg-muted/30">
                        <th className="px-6 py-4 font-medium">Weight</th>
                        <td className="px-6 py-4">{product.weight ? `${product.weight} ${product.weightUnit}` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <th className="px-6 py-4 font-medium">Dimensions</th>
                        <td className="px-6 py-4">N/A</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="reviews">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <ReviewForm productId={product.id} onReviewSubmit={refreshReviews} />
                  </div>
                  <div className="lg:col-span-2">
                    <ReviewList reviews={reviews} />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="mt-24 border-t pt-16">
          <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
        </div>

        <div className="mt-20 border-t pt-16">
          <RecentlyViewed currentProductId={product.id} />
        </div>
      </div>
    </div >
  )
}
