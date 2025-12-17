'use client'

import { Star } from "lucide-react"

interface Review {
  id: string
  customerName: string
  rating: number
  title?: string
  content?: string
  createdAt: string
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No reviews yet. Be the first to write one!
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-8 last:border-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="font-medium">{review.title}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{review.customerName}</span>
            <span>•</span>
            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
          {review.content && (
            <p className="text-muted-foreground leading-relaxed">
              {review.content}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
