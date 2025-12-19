
import { NextResponse } from 'next/server';
import { getReviews, createReview } from '@/lib/reviews';
import { z } from 'zod';

const createSchema = z.object({
  product_id: z.number().or(z.string().transform(v => Number(v))),
  title: z.string().min(1, "Title is required"),
  rating: z.number().min(1).max(5),
  content: z.string().min(1, "Content is required"),
  author_name: z.string().min(1, "Author name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  is_verified: z.boolean().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const productId = searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined;
    const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined;

    // Optional: Add Admin Auth check here

    const result = await getReviews({ page, limit, search, status, productId, rating });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Optional: Add Admin Auth check here

    const body = await request.json();
    const validated = createSchema.parse(body);

    const id = await createReview({
      ...validated,
      status: validated.status || 'inactive',
      is_verified: validated.is_verified || false
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
