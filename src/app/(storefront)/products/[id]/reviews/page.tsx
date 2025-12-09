'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createReviewAction, getProductReviewsAction } from '@/actions/reviews'
import { getProductAction } from '@/actions/products'
import { showToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/ui/Spinner'
import { Star } from 'lucide-react'

export default function ProductReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const [product, setProduct] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
  })

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      try {
        const prod = await getProductAction(resolvedParams.id)
        setProduct(prod)

        const revs = await getProductReviewsAction(resolvedParams.id, true)
        setReviews(revs)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params])

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()

    if (!user || !product) {
      showToast('Please sign in to leave a review', 'error')
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Please fill in all fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      await createReviewAction({
        productId: product.id,
        userId: user.uid,
        userName: user.email?.split('@')[0] || 'Anonymous',
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        isApproved: true, // Auto-approve for now (can be changed to require moderation)
      })

      showToast('Review submitted successfully!', 'success')
      setFormData({ rating: 5, title: '', content: '' })
      setShowForm(false)

      // Reload reviews
      const revs = await getProductReviewsAction(product.id, true)
      setReviews(revs)
    } catch (error) {
      console.error('Failed to submit review:', error)
      showToast('Failed to submit review', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div className="container px-4 py-8">
      {/* Product Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i < Math.floor(Number(avgRating))
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
                  }`}
              />
            ))}
          </div>
          <span className="font-semibold text-lg">{avgRating} out of 5</span>
          <span className="text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      {/* Write Review Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="mb-8"
        >
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="border rounded-lg p-6 mb-8 bg-muted/30">
          <h2 className="text-xl font-semibold mb-4">Share Your Review</h2>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: r }))}
                    className="focus:outline-none transition"
                  >
                    <Star
                      className={`h-8 w-8 cursor-pointer ${r <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your review"
                className="w-full px-3 py-2 border rounded-md bg-background"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your experience with this product"
                className="w-full px-3 py-2 border rounded-md bg-background min-h-32"
                maxLength={1000}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <><Spinner className="h-4 w-4 mr-2" />Submitting...</>
                ) : (
                  'Submit Review'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ rating: 5, title: '', content: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{review.title}</h3>
                  <p className="text-sm text-muted-foreground">By {review.userName}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                        }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed">{review.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
