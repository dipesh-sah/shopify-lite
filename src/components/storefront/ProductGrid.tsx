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
      <h2 className="text-2xl md:text-3xl font-semibold text-[#111] mb-12">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-12">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      {viewAllLink && (
        <div className="flex justify-center mt-16">
          <Link
            href={viewAllLink}
            className="bg-[#94c94d] hover:bg-[#84b93d] text-white font-bold px-10 py-3 rounded-md transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            View all
          </Link>
        </div>
      )}
    </section>
  )
}
