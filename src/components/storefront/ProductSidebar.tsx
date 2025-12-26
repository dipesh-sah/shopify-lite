"use client"

import React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ProductSidebarProps {
  collections: any[]
  currentFilters: {
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    category?: string
  }
  onFilterChange: (filters: any) => void
}

export function ProductSidebar({ collections, currentFilters, onFilterChange }: ProductSidebarProps) {
  const [openSections, setOpenSections] = React.useState({
    availability: true,
    price: true,
  })

  // Group collections by parent if needed, but for now just list them
  // In the image, they are listed as heading and then items
  // Let's assume some are main categories

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section as keyof typeof openSections]: !prev[section as keyof typeof openSections] }))
  }

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onFilterChange({ ...currentFilters, [field]: numValue })
  }

  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-6">Filter:</h2>

        {/* Availability */}
        <div className="border-t border-gray-100 py-6">
          <button
            onClick={() => toggleSection('availability')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-gray-900">Availability</span>
            {openSections.availability ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {openSections.availability && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentFilters.inStock === true}
                  onChange={(e) => onFilterChange({ ...currentFilters, inStock: e.target.checked ? true : undefined })}
                  className="h-4 w-4 rounded border-gray-300 text-[#94c94d] focus:ring-[#94c94d]"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">In stock</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group opacity-50">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 rounded border-gray-300 text-gray-300"
                />
                <span className="text-sm text-gray-400">Out of stock</span>
              </label>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="border-t border-gray-100 py-6">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-gray-900">Price</span>
            {openSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {openSections.price && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-gray-500">The highest price is $499.95</p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="From"
                    value={currentFilters.minPrice ?? ''}
                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#94c94d]"
                  />
                </div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="To"
                    value={currentFilters.maxPrice ?? ''}
                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#94c94d]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collections */}
        <div className="border-t border-gray-100 py-6">
          <div className="space-y-8">
            {collections.filter(c => !c.categoryId).map(parent => (
              <div key={parent.id} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">{parent.name}</h3>
                <ul className="space-y-2">
                  {collections.filter(c => c.categoryId === parent.id).map(child => (
                    <li key={child.id}>
                      <button
                        onClick={() => onFilterChange({ ...currentFilters, category: child.id })}
                        className={`text-sm text-left hover:text-[#94c94d] transition-colors ${currentFilters.category === child.id ? 'text-[#94c94d] font-medium' : 'text-gray-600'}`}
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                  {/* If no subcategories, just show the parent if it's hit */}
                  {collections.filter(c => c.categoryId === parent.id).length === 0 && (
                    <li>
                      <button
                        onClick={() => onFilterChange({ ...currentFilters, category: parent.id })}
                        className={`text-sm text-left hover:text-[#94c94d] transition-colors ${currentFilters.category === parent.id ? 'text-[#94c94d] font-medium' : 'text-gray-600'}`}
                      >
                        {parent.name}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
