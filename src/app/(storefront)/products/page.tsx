'use client'

import { useState, useEffect } from "react"
import { getProductsAction } from "@/actions/products"
import { ProductCard } from "@/components/storefront/ProductCard"
import { getActiveCollectionsAction } from "@/actions/collections"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load all products
        const allProducts = await getProductsAction()
        setProducts(allProducts)

        // Load active categories
        const cats = await getActiveCollectionsAction()
        setCategories(cats)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    // read query params (category or subcategory)
    try {
      const params = new URLSearchParams(window.location.search)
      const cat = params.get('category')
      const sub = params.get('subcategory')
      if (sub) setSelectedSubcategory(sub)
      else if (cat) setSelectedCategory(cat)
    } catch (err) {
      // noop on server or if window not available
    }
  }, [])

  const filteredProducts = selectedSubcategory
    ? products.filter(p => p.subcategoryId === selectedSubcategory)
    : selectedCategory
      ? products.filter(p => p.categoryId === selectedCategory)
      : products

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">All Products</h1>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full border transition-colors ${selectedCategory === ""
                ? "bg-black text-white border-black"
                : "border-gray-300 hover:border-black"
                }`}
            >
              All Products
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full border transition-colors ${selectedCategory === cat.id
                  ? "bg-black text-white border-black"
                  : "border-gray-300 hover:border-black"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No products found in this category.
          </p>
        ) : (
          filteredProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  )
}
