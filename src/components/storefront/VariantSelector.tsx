'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'

interface Variant {
  id: string
  sku: string
  stock: number
  priceDelta: number
  options: Record<string, string>
  mediaIds?: string[]
}

interface VariantSelectorProps {
  variants: Variant[]
  attributeGroups: any[]
  onVariantSelect: (variant: Variant, selectedOptions: Record<string, string>) => void
  children?: React.ReactNode
}

export function VariantSelector({
  variants,
  attributeGroups,
  onVariantSelect,
  children
}: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  // Find matching variant based on selected options
  const selectedVariant = useMemo(() => {
    if (!variants.length) return null
    if (attributeGroups.length === 0) return variants[0] // No attributes, return first variant

    return variants.find(v => {
      return Object.entries(selectedOptions).every(
        ([key, value]) => v.options?.[key] === value
      )
    })
  }, [selectedOptions, variants, attributeGroups])

  const handleOptionChange = (attributeId: string, value: string) => {
    const newOptions = { ...selectedOptions, [attributeId]: value }
    setSelectedOptions(newOptions)
  }

  const handleAddToCart = () => {
    if (selectedVariant) {
      onVariantSelect(selectedVariant, selectedOptions)
    }
  }

  const isOutOfStock = selectedVariant && selectedVariant.stock <= 0

  return (
    <div className="space-y-4">
      {/* Attribute Selectors */}
      {attributeGroups.map((group) => (
        <div key={group.id}>
          <label className="block text-sm font-medium mb-2">
            {group.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {group.options?.map((option: string) => {
              const isSelected = selectedOptions[group.id] === option
              const isAvailable = variants.some(v => {
                const optionMatches = Object.entries(selectedOptions).every(
                  ([key, val]) => key === group.id ? true : v.options?.[key] === val
                )
                return optionMatches && v.options?.[group.id] === option && v.stock > 0
              })

              return (
                <button
                  key={option}
                  onClick={() => handleOptionChange(group.id, option)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isAvailable
                      ? 'border-border hover:border-primary cursor-pointer'
                      : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Variant Details */}
      {selectedVariant && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">SKU: </span>
            <span className="font-medium">{selectedVariant.sku}</span>
          </div>
          {selectedVariant.priceDelta !== 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Price adjustment: </span>
              <span className="font-medium">{selectedVariant.priceDelta > 0 ? '+' : ''}{selectedVariant.priceDelta.toFixed(2)}</span>
            </div>
          )}
          <div>
            <span className="text-sm text-muted-foreground">Stock: </span>
            <span className={`font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
              {isOutOfStock ? 'Out of Stock' : `${selectedVariant.stock} available`}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <div>
        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant || isOutOfStock || false}
          className="w-full"
          size="lg"
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>

      {children}
    </div>
  )
}
