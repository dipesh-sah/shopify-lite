'use client';

import { useState, useEffect } from 'react';
import { getReviewsAction, createReviewAction } from '@/actions/reviews';
import { Star, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/components/ui/Toast';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await getReviewsAction(productId); // No second arg needed
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    if (!user) {
      showToast('Please sign in to write a review', 'error');
      return;
    }

    // Append missing fields from client state/context
    formData.append('productId', productId);
    formData.append('rating', rating.toString());
    formData.append('name', user.displayName || 'Anonymous');
    formData.append('email', user.email || 'anonymous@example.com');

    try {
      const result = await createReviewAction(formData);

      if (result.success) {
        showToast('Review submitted successfully!', 'success');
        setShowForm(false);
        setRating(5);
        loadReviews();
      } else {
        showToast(result.error || 'Failed to submit review', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('An unexpected error occurred', 'error');
    }
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="py-12 border-t mt-12">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">
              Based on {reviews.length} reviews
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90"
        >
          Write a Review
        </button>
      </div>

      {showForm && (
        <form action={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-8 border">
          <h3 className="font-semibold mb-4">Write your review</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              name="title"
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Summarize your experience"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Review</label>
            <textarea
              name="content"
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="Tell us more about what you liked or disliked"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 rounded border hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="font-medium">{review.author_name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                </span>
              </div>
              <div className="flex text-yellow-400 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <h4 className="font-semibold mb-1">{review.title}</h4>
              <p className="text-gray-600">{review.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
