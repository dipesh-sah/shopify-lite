'use client'

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/storefront/ProductCard"

export function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    // 1. Get recent IDs from localStorage
    const recent = JSON.parse(localStorage.getItem('recently_viewed') || '[]')

    // 2. Filter out current product
    const otherRecent = recent.filter((p: any) => p.id !== currentProductId)

    if (otherRecent.length > 0) {
      setProducts(otherRecent.slice(0, 4))
    }
  }, [currentProductId])

  // Helper to add current product to history (called by parent or effect)
  // This component just displays them. The page itself should add to history.

  if (products.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
