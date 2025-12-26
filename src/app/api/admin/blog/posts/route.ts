/**
 * Admin Blog Posts API
 * GET /api/admin/blog/posts - List all posts (admin)
 * POST /api/admin/blog/posts - Create new post
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogPostSchema } from '@/lib/blog/schemas';
import { createPost, getAllPosts } from '@/lib/blog/posts';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // Require admin or editor role
    await requireRole(request, ['admin', 'editor']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as 'draft' | 'published' | undefined;

    const { posts, total } = await getAllPosts({
      page,
      limit,
      status,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);

    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin or editor role
    const user = await requireRole(request, ['admin', 'editor']);

    const body = await request.json();

    // Validate input
    const validated = blogPostSchema.parse(body);

    // Create post
    const postId = await createPost({
      ...validated,
      author_id: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: postId,
        message: 'Blog post created successfully',
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);

    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid post data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Database errors - provide helpful messages
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database tables not found. Please run the blog migration first.',
          hint: 'Run: mysql -u root -p your_database < migrations/20251223_blog_system.sql',
          details: error.message
        },
        { status: 500 }
      );
    }

    if (error.code) {
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.sqlMessage || error.message}`,
          code: error.code,
          sql: error.sql
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create post',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
