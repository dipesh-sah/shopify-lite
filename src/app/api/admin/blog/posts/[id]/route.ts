/**
 * Admin Single Blog Post API
 * GET /api/admin/blog/posts/[id] - Get post by ID
 * PUT /api/admin/blog/posts/[id] - Update post
 * DELETE /api/admin/blog/posts/[id] - Delete post
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBlogPostSchema } from '@/lib/blog/schemas';
import { getPostById, updatePost, deletePost } from '@/lib/blog/posts';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(request, ['admin', 'editor']);

    const postId = parseInt(id);
    const post = await getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Error fetching post:', error);

    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole(request, ['admin', 'editor']);
    const postId = parseInt(id);

    // Check if post exists and user owns it (if editor)
    const existingPost = await getPostById(postId);

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Editors can only edit their own posts
    if (user.role === 'editor' && existingPost.author_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateBlogPostSchema.parse(body);

    await updatePost(postId, validated);

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating post:', error);

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

    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(request, ['admin']); // Only admins can delete

    const postId = parseInt(id);
    const deleted = await deletePost(postId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);

    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
