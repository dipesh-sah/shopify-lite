
import { NextResponse } from 'next/server';
import { getPublicReviews, getReviewStats } from '@/lib/reviews';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get('productId'));
    const limit = Number(searchParams.get('limit')) || 10;
    const offset = Number(searchParams.get('offset')) || 0;

    if (!productId || isNaN(productId)) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const [reviews, stats] = await Promise.all([
      getPublicReviews(productId, limit, offset),
      getReviewStats(productId)
    ]);

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error('Failed to fetch public reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
