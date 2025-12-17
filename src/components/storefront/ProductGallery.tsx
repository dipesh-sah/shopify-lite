'use client'

import { useState } from "react"
import { Package, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductImage {
  id?: string
  url: string
  altText?: string
}

interface ProductGalleryProps {
  images: (string | ProductImage)[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Helper to get URL string safely
  const getImageUrl = (img: string | ProductImage) => {
    return typeof img === 'string' ? img : img.url
  }

  // Helper to get Alt text safely
  const getAltText = (img: string | ProductImage, index: number) => {
    if (typeof img === 'string') return `${productName} ${index + 1}`
    return img.altText || `${productName} ${index + 1}`
  }

  const hasImages = images && images.length > 0
  const selectedImage = hasImages ? images[selectedIndex] : null

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (!hasImages) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-xl border bg-muted flex items-center justify-center">
        <Package className="h-32 w-32 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted group">
        <img
          src={getImageUrl(selectedImage!)}
          alt={getAltText(selectedImage!, selectedIndex)}
          className="h-full w-full object-cover transition-transform duration-500"
        />

        {/* Navigation Arrows (only if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); handlePrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all",
                selectedIndex === index ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground/50"
              )}
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={getImageUrl(img)}
                alt={getAltText(img, index)}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
