'use client'

import { useState, useEffect } from "react"
import { getProductsAction } from "@/actions/products"
import { ProductCard } from "@/components/storefront/ProductCard"
import { getActiveCollectionsAction } from "@/actions/collections"
import Loading from "@/components/ui/Loading"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  const [loading, setLoading] = useState(true)

  // New Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [inStock, setInStock] = useState(false)

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const filters: any = { limit: 100 }
        if (debouncedSearch) filters.search = debouncedSearch;
        if (selectedCategory) filters.category = selectedCategory;
        if (minPrice) filters.minPrice = Number(minPrice);
        if (maxPrice) filters.maxPrice = Number(maxPrice);
        if (inStock) filters.inStock = true;

        const result = await getProductsAction(filters)
        setProducts(result.products || [])

        // Only load categories once
        if (categories.length === 0) {
          const cats = await getActiveCollectionsAction()
          setCategories(cats)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [debouncedSearch, selectedCategory, selectedSubcategory, minPrice, maxPrice, inStock])

  // Initial params load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const cat = params.get('category')
      const sub = params.get('subcategory')
      const search = params.get('q')
      if (sub) setSelectedSubcategory(sub)
      else if (cat) setSelectedCategory(cat)
      if (search) setSearchQuery(search)
    } catch (err) { }
  }, [])

  return (
    <div className="container px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">All Products</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8 flex-shrink-0">
          {/* Search */}
          <div>
            <h3 className="font-semibold mb-3">Search</h3>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full text-left text-sm ${selectedCategory === "" ? "font-bold text-black" : "text-gray-600 hover:text-black"}`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`block w-full text-left text-sm ${selectedCategory === cat.id ? "font-bold text-black" : "text-gray-600 hover:text-black"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <h3 className="font-semibold mb-3">Price Range</h3>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-semibold mb-3">Availability</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loading variant="centered" size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-12">
                  No products found matching your criteria.
                </p>
              ) : (
                products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
