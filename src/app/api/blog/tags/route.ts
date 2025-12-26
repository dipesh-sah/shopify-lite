/**
 * Blog Tags API
 * GET /api/blog/tags - Get all blog tags
 */

import { NextResponse } from 'next/server';
import { getAllTags, getPopularTags } from '@/lib/blog/tags';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const tags = popular
      ? await getPopularTags(limit)
      : await getAllTags();

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('Error fetching blog tags:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tags',
      },
      { status: 500 }
    );
  }
}
