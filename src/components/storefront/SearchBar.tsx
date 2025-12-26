"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
        if (!searchQuery) setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchQuery])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded])

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
      setIsExpanded(false)
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
      <div className={`flex items-center transition-all duration-300 ease-in-out ${isExpanded ? 'w-[300px] opacity-100' : 'w-10 opacity-100'}`}>
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 text-white hover:text-white/80 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center relative w-full h-9">
            <div className="relative flex-1 h-full">
              <Input
                ref={inputRef}
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 w-full h-full rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/30 transition-all text-sm"
                onFocus={() => searchQuery && setIsOpen(true)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full right-0 mt-3 bg-[#1f2937] border border-white/10 rounded-xl shadow-2xl w-[400px] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {isLoading ? (
            <div className="p-4 text-center text-white/50">Searching...</div>
          ) : (
            <>
              <div className="p-2 max-h-[350px] overflow-y-auto">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-lg transition-colors group"
                    onClick={() => {
                      setIsOpen(false)
                      setIsExpanded(false)
                    }}
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-md flex-shrink-0 overflow-hidden border border-white/5">
                      {product.images?.[0] ? (
                        <img
                          src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="h-5 w-5 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{product.title}</p>
                      <p className="text-xs text-white/50">
                        ${Number(product.displayPrice || product.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t border-white/10 p-2 bg-white/5">
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="flex items-center justify-center gap-2 p-2 text-sm font-medium text-white hover:text-white/80 transition-colors"
                  onClick={() => {
                    setIsOpen(false)
                    setIsExpanded(false)
                  }}
                >
                  View all results
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
