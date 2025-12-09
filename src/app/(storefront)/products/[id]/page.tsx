'use client'

import { notFound } from "next/navigation"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { VariantSelector } from "@/components/storefront/VariantSelector"
import { Star, Package, Truck, Shield, ArrowLeft, Share2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getProductAction } from "@/actions/products"
import { getAttributeGroupsAction } from "@/actions/attributes"
import { useCart } from "@/store/cart"
import Link from "next/link"

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [attributeGroups, setAttributeGroups] = useState<any[]>([])
  const { addItem } = useCart()

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      const data = await getProductAction(resolvedParams.id)
      if (!data) {
        notFound()
      }
      setProduct(data)

      // Load attribute groups
      try {
        const groups = await getAttributeGroupsAction()
        setAttributeGroups(groups)
      } catch (err) {
        console.error('Failed to load attribute groups:', err)
      }

      setLoading(false)
    }
    loadData()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return notFound()
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-foreground">Products</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square w-full overflow-hidden rounded-xl border bg-muted relative group">
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-32 w-32 text-muted-foreground" />
                </div>
              )}

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  {discountPercent}% OFF
                </div>
              )}

              {/* Share Button */}
              <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.slice(0, 5).map((img: string, index: number) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-primary cursor-pointer transition-colors">
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h1>

              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}

              {/* Rating (placeholder) */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(4.8 • 124 reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">${Number(product.price).toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-2xl text-muted-foreground line-through">
                    ${Number(product.compareAtPrice).toFixed(2)}
                  </span>
                )}
              </div>
              {product.costPrice && (
                <p className="text-sm text-muted-foreground">
                  Cost: ${Number(product.costPrice).toFixed(2)}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div className="rounded-lg border p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {product.stock > 0 ? (
                    <>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-700">In Stock</span>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <span className="font-medium text-red-700">Out of Stock</span>
                    </>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stock > 0 ? `${product.stock} units available` : 'Notify when available'}
                </span>
              </div>

              {product.stock > 0 && product.stock <= (product.lowStockThreshold || 5) && (
                <p className="mt-2 text-sm text-orange-600 font-medium">
                  ⚠️ Only {product.stock} left - Order soon!
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              {product.variants && product.variants.length > 0 ? (
                <VariantSelector
                  variants={product.variants}
                  attributeGroups={attributeGroups}
                  onVariantSelect={(variant: any, selectedOptions: Record<string, string>) => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      description: product.description || '',
                      price: product.price,
                      images: product.images || [],
                      categoryId: product.categoryId || ''
                    }, 1, variant.id)
                  }}
                />
              ) : (
                <>
                  <AddToCartButton product={product as any} />
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                      <Truck className="h-5 w-5 text-primary" />
                      <span className="font-medium">Free Shipping</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="font-medium">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-medium">Easy Returns</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Product Details */}
            <div className="rounded-lg border">
              <div className="border-b p-4 bg-muted/50">
                <h3 className="font-semibold">Product Details</h3>
              </div>
              <div className="divide-y">
                {product.categoryId && (
                  <div className="flex justify-between p-4">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{product.categoryId}</span>
                  </div>
                )}
                {product.barcode && (
                  <div className="flex justify-between p-4">
                    <span className="text-muted-foreground">Barcode</span>
                    <span className="font-medium">{product.barcode}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between p-4">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{product.weight} kg</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between p-4">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-medium">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Info (if available) */}
            {(product.seoTitle || product.seoDescription) && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <h3 className="font-semibold mb-2">Additional Information</h3>
                {product.seoTitle && (
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>SEO Title:</strong> {product.seoTitle}
                  </p>
                )}
                {product.seoDescription && (
                  <p className="text-sm text-muted-foreground">
                    <strong>SEO Description:</strong> {product.seoDescription}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Sections */}
        <div className="mt-16 space-y-8">
          {/* Specifications */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-2xl font-bold mb-6">Specifications</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Product Name</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">${Number(product.price).toFixed(2)}</span>
                </div>
                {product.compareAtPrice && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="font-medium line-through">${Number(product.compareAtPrice).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-medium">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                {product.sku && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-medium">{product.sku}</span>
                  </div>
                )}
                {product.categoryId && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{product.categoryId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section (Placeholder) */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review this product!</p>
              <Link href={`/products/${product.id}/reviews`} className="text-primary hover:underline font-medium">
                View all reviews →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
