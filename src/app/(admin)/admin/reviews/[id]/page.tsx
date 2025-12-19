import { EditReviewForm } from '@/components/admin/EditReviewForm'
import { getReviewAction } from '@/actions/reviews'
import { notFound } from 'next/navigation'

export default async function AdminReviewEditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const review = await getReviewAction(Number(params.id))

  if (!review) {
    notFound()
  }

  // Ensure all required fields are present for the form
  const safeReview = {
    ...review,
    created_at: new Date(review.created_at), // Ensure date object if needed, though form uses strings mostly
    // We cast to any or ensure types match exactly
  }

  return (
    <div className="p-6">
      <EditReviewForm review={safeReview as any} />
    </div>
  )
}
