import { ProductCard } from "./ProductCard"
import Link from "next/link"

interface ProductGridProps {
  title: string
  products: any[]
  viewAllLink?: string
}

export function ProductGrid({ title, products, viewAllLink }: ProductGridProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="container max-w-7xl px-4 md:px-8 py-16">
      <h2 className="text-2xl font-normal text-[#222] mb-12">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      {viewAllLink && (
        <div className="flex justify-center mt-12">
          <Link
            href={viewAllLink}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-md transition-colors duration-200"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  )
}
