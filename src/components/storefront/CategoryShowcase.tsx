"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"


interface Category {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
}

interface CategoryShowcaseProps {
  categories: Category[]
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (!categories || categories.length === 0) return null

  { console.log(categories) }
  return (
    <section className="bg-[#2a2a2a] text-white py-16">
      <div className="container max-w-7xl px-4 md:px-8">
        <h2 className="text-2xl font-semibold mb-12">Shop our top categories</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug}`}
              className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Image Container */}

              <div className="aspect-[3/4] w-full overflow-hidden relative bg-gradient-to-br from-gray-700 to-gray-900">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={400}
                    height={533}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-white text-5xl font-bold opacity-30">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Name Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-4 flex items-center justify-between">
                <h3 className="text-[#222] font-medium text-sm">
                  {category.name}
                </h3>
                <ArrowRight className="h-4 w-4 text-[#222] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
