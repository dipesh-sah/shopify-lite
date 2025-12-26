'use client'

import { useState, useEffect } from "react"
import { AdminReviewList } from "@/components/admin/AdminReviewList"
import { getAllAdminReviewsAction } from "@/actions/reviews"
import Loading from "@/components/ui/Loading"


export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadReviews = async () => {
    try {
      const r = await getAllAdminReviewsAction()
      setReviews(r)
    } catch (err) {
      console.error('Failed to load reviews', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {loading ? (
          <div className="text-center py-8">
            <Loading variant="centered" size="md" text="Loading reviews..." />
          </div>
        ) : (
          <AdminReviewList reviews={reviews} onUpdate={loadReviews} />
        )}
      </div>
    </div>
  )
}
