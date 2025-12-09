import { getSubcategoryBySlug, getProductsBySubcategory } from "@/lib/firestore"
import { ProductCard } from "@/components/storefront/ProductCard"
import { notFound } from "next/navigation"

export default async function SubcategoryPage({ params }: { params: Promise<{ subcategorySlug: string }> }) {
  const resolvedParams = await params
  const subcategory = await getSubcategoryBySlug(resolvedParams.subcategorySlug)

  if (!subcategory) {
    notFound()
  }

  const products = await getProductsBySubcategory(subcategory.id)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{subcategory.name}</h1>
        {subcategory.description && (
          <p className="text-muted-foreground">
            {subcategory.description}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found in this subcategory</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
