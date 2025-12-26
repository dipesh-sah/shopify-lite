/**
 * Blog Search API
 * GET /api/blog/search - Search blog posts using FULLTEXT search
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchQuerySchema } from '@/lib/blog/schemas';
import { searchPosts } from '@/lib/blog/posts';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    };

    const validated = searchQuerySchema.parse(params);

    // Perform search
    const { posts, total } = await searchPosts(validated.q, {
      page: validated.page,
      limit: validated.limit,
      categoryId: validated.category,
      tagId: validated.tag,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validated.limit);
    const hasMore = validated.page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        query: validated.q,
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
    console.error('Error searching blog posts:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
      },
      { status: 500 }
    );
  }
}
