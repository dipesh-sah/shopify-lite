import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface CategoryGridProps {
  categories: any[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null

  return (
    <section className="bg-muted/30 py-16 mb-16">
      <div className="container">
        <h2 className="text-2xl font-bold mb-8 text-white">Shop by categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug || category.id}`}
              className="group relative aspect-square overflow-hidden rounded-lg bg-background"
            >
              {category.image_url ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${category.image_url})` }}
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/50" />
              <div className="absolute bottom-4 left-4 text-white font-medium">
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
