'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { getActiveCategories } from "@/lib/firestore"
import { ArrowRight } from "lucide-react"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getActiveCategories()
        setCategories(cats)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [])

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Shop by Category</h1>
      <p className="text-muted-foreground mb-8">Browse our collection of products organized by category</p>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No categories available yet.</p>
          <Link href="/products" className="text-primary hover:underline">
            View all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="group relative overflow-hidden rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                  <span className="text-sm font-medium">Shop now</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
