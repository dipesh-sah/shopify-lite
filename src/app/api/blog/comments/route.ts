/**
 * Blog Comments API
 * POST /api/blog/comments - Create a new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogCommentSchema } from '@/lib/blog/schemas';
import { createComment } from '@/lib/blog/comments';
import { getCurrentUser } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = blogCommentSchema.parse(body);

    // Get current user if authenticated
    const user = await getCurrentUser(request);

    // Create comment
    const commentId = await createComment({
      post_id: validated.post_id,
      parent_id: validated.parent_id,
      user_id: user?.id,
      author_name: user?.name || validated.author_name,
      author_email: user?.email || validated.author_email,
      content: validated.content,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: commentId,
        message: 'Comment submitted successfully. It will appear after approval.',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid comment data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create comment',
      },
      { status: 500 }
    );
  }
}
