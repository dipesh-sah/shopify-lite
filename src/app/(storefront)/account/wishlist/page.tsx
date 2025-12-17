
"use client"

import { useState, useEffect } from "react"
import { getWishlistAction } from "@/actions/wishlist"
import { ProductCard } from "@/components/storefront/ProductCard"

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const items = await getWishlistAction();
        // Map to product card format
        const mapped = items.map((item: any) => ({
          id: item.productId,
          name: item.title,
          price: item.price,
          images: item.image ? [{ url: item.image }] : [],
          description: '',
          tags: []
        }));
        setProducts(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [])

  if (loading) return <div className="p-8 text-center">Loading wishlist...</div>

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      {products.length === 0 ? (
        <p className="text-muted-foreground">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
