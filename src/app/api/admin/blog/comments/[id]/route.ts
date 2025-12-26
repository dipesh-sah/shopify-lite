/**
 * Admin Single Comment Moderation API
 * PUT /api/admin/blog/comments/[id] - Update comment status
 * DELETE /api/admin/blog/comments/[id] - Delete comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCommentStatusSchema } from '@/lib/blog/schemas';
import { updateCommentStatus, deleteComment } from '@/lib/blog/comments';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(request, ['admin', 'editor']);

    const commentId = parseInt(id);
    const body = await request.json();
    const validated = updateCommentStatusSchema.parse(body);

    const updated = await updateCommentStatus(commentId, validated.status);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Comment ${validated.status} successfully`,
    });
  } catch (error: any) {
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
          error: 'Invalid status',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
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
    await requireRole(request, ['admin', 'editor']);

    const commentId = parseInt(id);
    const deleted = await deleteComment(commentId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
