"use client"

import React, { useState, useEffect } from "react"
import { ProductCard } from "./ProductCard"
import { Loader2 } from "lucide-react"

const PRODUCTS_PER_PAGE = 20

export function ShopClient() {
  const [products, setProducts] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadProducts = async (pageNum: number) => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/shop/products?page=${pageNum}&limit=${PRODUCTS_PER_PAGE}`)
      const data = await response.json()

      if (data.products && data.products.length > 0) {
        setProducts(prev => pageNum === 1 ? data.products : [...prev, ...data.products])
        setHasMore(data.products.length === PRODUCTS_PER_PAGE)
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
    loadProducts(1)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // Load more when user is 300px from bottom
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

  return (
    <div className="container max-w-7xl px-4 md:px-8 py-16">
      <h1 className="text-3xl font-bold text-[#222] mb-12">All Products</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You've reached the end of the catalog</p>
        </div>
      )}

      {/* No products found */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  )
}
