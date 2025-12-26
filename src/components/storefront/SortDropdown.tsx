"use client"

import React from "react"
import { ChevronDown } from "lucide-react"

interface SortDropdownProps {
  currentSort: string
  onSortChange: (sort: string) => void
  productCount: number
}

const sortOptions = [
  { label: "Best selling", value: "relevance" },
  { label: "Alphabetically, A-Z", value: "title-asc" },
  { label: "Alphabetically, Z-A", value: "title-desc" },
  { label: "Price, low to high", value: "price-asc" },
  { label: "Price, high to low", value: "price-desc" },
  { label: "Date, old to new", value: "created_at-asc" },
  { label: "Date, new to old", value: "created_at-desc" },
]

export function SortDropdown({ currentSort, onSortChange, productCount }: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const currentLabel = sortOptions.find(opt => opt.value === currentSort)?.label || "Best selling"

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-8">
      <div className="flex items-center gap-4">
        {/* Placeholder for small screen filter toggle if needed */}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-[#94c94d] transition-colors"
            >
              {currentLabel}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-md shadow-lg z-50 overflow-hidden">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${currentSort === option.value ? "text-[#94c94d] font-semibold bg-gray-50" : "text-gray-700"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400">
          {productCount} products
        </div>
      </div>
    </div>
  )
}
