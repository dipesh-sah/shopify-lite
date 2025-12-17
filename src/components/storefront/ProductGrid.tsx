import { ProductCard } from "./ProductCard"

interface ProductGridProps {
  title: string
  products: any[]
}

export function ProductGrid({ title, products }: ProductGridProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="container mb-16">
      <h2 className="text-2xl font-bold mb-8">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
