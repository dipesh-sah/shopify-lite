import { useEffect, useState } from "react"
import { getRelatedProductsAction } from "@/actions/products"
import { ProductCard } from "@/components/storefront/ProductCard"

interface RelatedProductsProps {
  categoryId?: string
  currentProductId: string
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRelated() {
      try {
        // Use optimized related products function
        const related = await getRelatedProductsAction(currentProductId, 4)
        setProducts(related)
      } catch (err) {
        console.error("Failed to load related products", err)
      } finally {
        setLoading(false)
      }
    }
    loadRelated()
  }, [currentProductId])

  if (loading || products.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Related products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
