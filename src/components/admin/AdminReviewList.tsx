'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star, Check, X, Trash2 } from 'lucide-react'
import { updateReviewStatusAction, deleteReviewAction } from '@/actions/reviews'
import { showToast } from '@/components/ui/Toast'

interface Review {
  id: string
  productId: string
  productName?: string
  productImage?: string
  customerName: string
  rating: number
  title?: string
  content?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export function AdminReviewList({ reviews, onUpdate }: { reviews: Review[], onUpdate: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected') => {
    setLoading(reviewId)
    try {
      await updateReviewStatusAction(reviewId, status)
      showToast(`Review ${status}`, 'success')
      onUpdate()
    } catch (err) {
      showToast('Failed to update status', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setLoading(reviewId)
    try {
      await deleteReviewAction(reviewId)
      showToast('Review deleted', 'success')
      onUpdate()
    } catch (err) {
      showToast('Failed to delete review', 'error')
    } finally {
      setLoading(null)
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
        No reviews found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4 bg-card">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${review.status === 'approved' ? 'bg-green-100 text-green-800' :
                  review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                {review.status.toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
              {review.productName && (
                <span className="text-sm font-medium text-foreground border-l pl-3 ml-1">
                  Product: {review.productName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {review.status !== 'approved' && (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleStatusUpdate(review.id, 'approved')} disabled={loading === review.id}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {review.status !== 'rejected' && (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleStatusUpdate(review.id, 'rejected')} disabled={loading === review.id}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDelete(review.id)} disabled={loading === review.id}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="font-medium text-sm">{review.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">by {review.customerName}</p>
          </div>

          {review.content && (
            <p className="text-sm text-foreground bg-muted/30 p-2 rounded">
              {review.content}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
