import Link from "next/link"
import { type Product } from "@/store/cart"
import { ShoppingCart } from "lucide-react"

interface ProductCardProps {
  product: any
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  return (
    <div className="group relative rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md flex flex-col">
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-square w-full overflow-hidden rounded-md bg-muted mb-4 relative">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPercent}%
            </div>
          )}

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1">
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.slice(0, 2).map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-semibold text-lg group-hover:underline">
          <Link href={`/products/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-lg">${Number(product.price).toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${Number(product.compareAtPrice).toFixed(2)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.id}`}
            className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </Link>
        </div>

        {/* Stock indicator */}
        {product.stock > 0 && product.stock <= product.lowStockThreshold && (
          <p className="text-xs text-orange-600 mt-2">
            Only {product.stock} left!
          </p>
        )}
      </div>
    </div>
  )
}
