'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Variant {
  id: string
  sku: string
  inventoryQuantity: number
  price: number
  options: Record<string, string>
  mediaIds?: string[]
}

interface VariantSelectorProps {
  variants: Variant[]
  attributeGroups: any[]
  onVariantSelect: (variant: Variant, selectedOptions: Record<string, string>) => void
  basePrice?: number
  children?: React.ReactNode
}

export function VariantSelector({
  variants,
  attributeGroups,
  onVariantSelect,
  basePrice = 0,
  children
}: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    // Default to first variant's options if available
    return variants.length > 0 ? variants[0].options : {}
  })

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

  // Notify parent when selected variant changes
  useEffect(() => {
    if (selectedVariant) {
      onVariantSelect(selectedVariant, selectedOptions)
    }
  }, [selectedVariant, onVariantSelect]) // Dependencies need to be stable

  const handleOptionChange = (attributeId: string, value: string) => {
    const newOptions = { ...selectedOptions, [attributeId]: value }
    setSelectedOptions(newOptions)
  }

  const handleAddToCart = () => {
    if (selectedVariant) {
      onVariantSelect(selectedVariant, selectedOptions)
    }
  }

  const isOutOfStock = selectedVariant && selectedVariant.inventoryQuantity <= 0
  const priceDelta = selectedVariant && basePrice ? selectedVariant.price - basePrice : 0

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
                return optionMatches && v.options?.[group.id] === option && v.inventoryQuantity > 0
              })

              return (
                <button
                  key={option}
                  onClick={() => handleOptionChange(group.id, option)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 border rounded-lg transition-colors ${isSelected
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
          {priceDelta !== 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Price adjustment: </span>
              <span className="font-medium">{priceDelta > 0 ? '+' : ''}{priceDelta.toFixed(2)}</span>
            </div>
          )}
          <div>
            <span className="text-sm text-muted-foreground">Stock: </span>
            <span className={`font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
              {isOutOfStock ? 'Out of Stock' : `${selectedVariant.inventoryQuantity} available`}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
