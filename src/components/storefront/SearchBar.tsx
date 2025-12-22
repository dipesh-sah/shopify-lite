"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounce search and fetch results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
        const data = await response.json()
        setResults(data.products || [])
        setIsOpen(true)
        setIsLoading(false)
      } catch (error) {
        console.error('Search error:', error)
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setSearchQuery("")
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Desktop Search */}
      <form onSubmit={handleSubmit} className="hidden md:flex items-center relative w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 w-full"
            onFocus={() => searchQuery && setIsOpen(true)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg max-h-[500px] overflow-y-auto z-50">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="p-2">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="w-12 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                            alt={product.title || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.title || product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(product.displayPrice || product.price).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="border-t p-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    className="flex items-center justify-center gap-2 p-2 text-sm text-primary hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    View all results
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No products found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </form>

      {/* Mobile Search */}
      <div className="md:hidden">
        {!isExpanded ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(true)}
            className="h-9 w-9"
          >
            <Search className="h-5 w-5" />
          </Button>
        ) : (
          <div className="fixed inset-0 bg-background z-50 p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsExpanded(false)
                  setSearchQuery("")
                  setResults([])
                }}
              >
                Cancel
              </Button>
            </form>

            {/* Mobile Results */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <>
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-accent rounded-md transition-colors border"
                      onClick={() => {
                        setIsExpanded(false)
                        setSearchQuery("")
                      }}
                    >
                      <div className="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                            alt={product.title || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.title || product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(product.displayPrice || product.price).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    className="flex items-center justify-center gap-2 p-3 text-primary hover:bg-accent rounded-md transition-colors border"
                    onClick={() => {
                      setIsExpanded(false)
                      setSearchQuery("")
                    }}
                  >
                    View all results
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : searchQuery ? (
                <div className="p-4 text-center text-muted-foreground border rounded-md">
                  No products found
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
