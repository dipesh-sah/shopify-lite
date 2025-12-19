
import { NextResponse } from 'next/server';
import { getReview, updateReview, deleteReview } from '@/lib/reviews';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  is_verified: z.boolean().optional(),
  author_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const review = await getReview(id);
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to get review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const validated = updateSchema.parse(body);

    await updateReview(id, validated);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('Failed to update review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    await deleteReview(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
