/**
 * Blog Categories API
 * GET /api/blog/categories - Get all blog categories
 */

import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/blog/categories';

export async function GET() {
  try {
    const categories = await getAllCategories();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching blog categories:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
