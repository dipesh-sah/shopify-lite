'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { createReviewAction } from '@/actions/reviews'

export function ReviewForm({ productId, onReviewSubmit }: { productId: string, onReviewSubmit?: () => void }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    if (rating === 0) return alert('Please select a rating')

    setIsSubmitting(true)
    formData.append('productId', productId)
    formData.append('rating', rating.toString())

    try {
      await createReviewAction(formData)
      setIsSuccess(true)
      setRating(0)
      if (onReviewSubmit) {
        onReviewSubmit()
      }
    } catch (err) {
      alert('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center text-green-800">
        <h3 className="font-medium text-lg mb-2">Thank you!</h3>
        <p>Your review has been submitted successfully.</p>
        <Button variant="link" onClick={() => setIsSuccess(false)} className="mt-2 text-green-800">
          Write another review
        </Button>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4 border rounded-lg p-6 bg-gray-50/50">
      <h3 className="font-medium text-lg">Write a Review</h3>

      {/* Rating Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`h-6 w-6 transition-colors ${star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
                  }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            name="name"
            required
            className="w-full h-10 px-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full h-10 px-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <input
          name="title"
          required
          className="w-full h-10 px-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Great product!"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Review</label>
        <textarea
          name="content"
          required
          rows={4}
          className="w-full p-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-black/5 resize-y"
          placeholder="Share your thoughts..."
        />
      </div>

      <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full sm:w-auto">
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
