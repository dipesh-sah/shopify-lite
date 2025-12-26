/**
 * Public Blog Posts API
 * GET /api/blog/posts - List blog posts with filters and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogPostFilterSchema } from '@/lib/blog/schemas';
import { getPublishedPosts } from '@/lib/blog/posts';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const params = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '12',
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      status: searchParams.get('status') as 'draft' | 'published' | undefined,
      sort: searchParams.get('sort') || 'latest',
      search: searchParams.get('search') || undefined,
    };

    const validated = blogPostFilterSchema.parse(params);

    // Get posts
    const { posts, total } = await getPublishedPosts({
      page: validated.page,
      limit: validated.limit,
      categoryId: validated.category,
      tagId: validated.tag,
      sort: validated.sort,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validated.limit);
    const hasMore = validated.page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog posts',
      },
      { status: 500 }
    );
  }
}
