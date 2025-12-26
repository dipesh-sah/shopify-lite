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

  return (
    <section className="bg-[#111827] text-white py-16 md:py-24">
      <div className="container max-w-7xl px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-semibold mb-12 text-white">Shop our top categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug}`}
              className="group relative overflow-hidden rounded-xl bg-white transition-all duration-300 hover:shadow-2xl flex flex-col h-full"
            >
              {/* Image Container */}
              <div className="aspect-square w-full overflow-hidden relative bg-gray-100">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-gray-300 text-5xl font-bold">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Name Overlay (White Bar) */}
              <div className="bg-white p-4 py-5 flex items-center justify-between mt-auto">
                <h3 className="text-[#111] font-semibold text-sm md:text-base pr-2">
                  {category.name}
                </h3>
                <ArrowRight className="h-4 w-4 text-[#111] flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
