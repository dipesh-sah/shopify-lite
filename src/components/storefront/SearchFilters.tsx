"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface SearchFiltersProps {
  categories: { id: string; name: string }[]
  totalResults: number
}

export function SearchFilters({ categories, totalResults }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get('sort') || 'relevance'
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentInStock = searchParams.get('inStock') === 'true'

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    const query = searchParams.get('q')
    if (query) params.set('q', query)
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = currentMinPrice || currentMaxPrice || currentCategory || currentInStock

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {totalResults} {totalResults === 1 ? 'result' : 'results'}
        </span>

        {/* Active Filters */}
        {hasActiveFilters && (
          <>
            {currentCategory && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                Category: {categories.find(c => c.id === currentCategory)?.name}
                <button onClick={() => updateFilters('category', '')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {currentMinPrice && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                Min: ${currentMinPrice}
                <button onClick={() => updateFilters('minPrice', '')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {currentMaxPrice && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                Max: ${currentMaxPrice}
                <button onClick={() => updateFilters('maxPrice', '')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {currentInStock && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                In Stock
                <button onClick={() => updateFilters('inStock', '')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Sort Dropdown */}
        <Select value={currentSort} onValueChange={(value) => updateFilters('sort', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="title-asc">Name: A to Z</SelectItem>
            <SelectItem value="title-desc">Name: Z to A</SelectItem>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your search results
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={currentMinPrice}
                    onChange={(e) => updateFilters('minPrice', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={currentMaxPrice}
                    onChange={(e) => updateFilters('maxPrice', e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={currentCategory} onValueChange={(value) => updateFilters('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Availability */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={currentInStock}
                  onCheckedChange={(checked) => updateFilters('inStock', checked ? 'true' : '')}
                />
                <label
                  htmlFor="inStock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  In Stock Only
                </label>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
