"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getProductsAction } from "@/actions/products"

interface ProductSelectorProps {
  onSelect: (product: any) => void
}

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setProducts([]);
        return;
      }
      setLoading(true)
      try {
        const res = await getProductsAction({ search: query, limit: 10 })
        setProducts(res.products || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-9"
        />
      </div>

      {showResults && (query.length > 0 || products.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}
          {!loading && products.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No products found.</div>
          )}
          {!loading && products.map((product) => (
            <div
              key={product.id}
              className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
              onClick={() => {
                onSelect(product)
                setShowResults(false)
                setQuery("")
              }}
            >
              <div className="h-8 w-8 rounded bg-muted mr-3 overflow-hidden flex-shrink-0">
                {product.images && product.images[0] && (
                  <img src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-medium text-sm line-clamp-1">{product.title}</span>
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${product.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                  </span>
                  <span className="text-xs font-bold">${Number(product.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && query.length < 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Type at least 2 characters...</div>
          )}
        </div>
      )}
    </div>
  )
}
