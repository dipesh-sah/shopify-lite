"use client"

import React, { useState, useEffect } from "react"
import { ProductCard } from "./ProductCard"
import Loading from "@/components/ui/Loading"
import { ProductSidebar } from "./ProductSidebar"
import { SortDropdown } from "./SortDropdown"

const PRODUCTS_PER_PAGE = 20

interface ShopClientProps {
  initialCategoryId?: string
  initialTitle?: string
}

export function ShopClient({ initialCategoryId, initialTitle = "All Products" }: ShopClientProps) {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filter and Sort State
  const [filters, setFilters] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    inStock: undefined as boolean | undefined,
    category: initialCategoryId,
  })
  const [sortBy, setSortBy] = useState("relevance")

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/shop/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadProducts = async (pageNum: number, currentFilters = filters, currentSort = sortBy) => {
    if (loading && pageNum !== 1) return

    setLoading(true)
    try {
      const [sortField, sortOrder] = currentSort.includes('-') ? currentSort.split('-') : [currentSort, 'desc']

      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: PRODUCTS_PER_PAGE.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
      })

      if (currentFilters.minPrice !== undefined) queryParams.append('minPrice', currentFilters.minPrice.toString())
      if (currentFilters.maxPrice !== undefined) queryParams.append('maxPrice', currentFilters.maxPrice.toString())
      if (currentFilters.inStock !== undefined) queryParams.append('inStock', currentFilters.inStock.toString())
      if (currentFilters.category !== undefined) queryParams.append('category', currentFilters.category)

      const response = await fetch(`/api/shop/products?${queryParams.toString()}`)
      const data = await response.json()

      if (data.products) {
        setProducts(prev => pageNum === 1 ? data.products : [...prev, ...data.products])
        setHasMore(data.hasMore)
        setTotalCount(data.totalCount)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadProducts(1)
  }, [])

  // Refetch products when filters or sort change
  useEffect(() => {
    setPage(1)
    loadProducts(1, filters, sortBy)
  }, [filters, sortBy])

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setPage(prev => prev + 1)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore])

  useEffect(() => {
    if (page > 1) {
      loadProducts(page)
    }
  }, [page])

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
  }

  return (
    <div className="container max-w-7xl px-4 md:px-8 py-16">
      <h1 className="text-4xl font-normal text-gray-900 mb-12">{initialTitle}</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <ProductSidebar
          collections={categories}
          currentFilters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Product Listing Section */}
        <div className="flex-1">
          <SortDropdown
            currentSort={sortBy}
            onSortChange={handleSortChange}
            productCount={totalCount}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loading variant="inline" size="md" />
            </div>
          )}

          {!hasMore && products.length > 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You've reached the end of the catalog</p>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
