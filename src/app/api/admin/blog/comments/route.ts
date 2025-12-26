/**
 * Admin Blog Comments Moderation API
 * GET /api/admin/blog/comments - List all comments with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllComments, getPendingCommentsCount } from '@/lib/blog/comments';
import { requireRole } from '@/lib/blog/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'editor']);

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as 'pending' | 'approved' | 'spam' | 'rejected' | undefined;
    const postId = searchParams.get('postId') ? parseInt(searchParams.get('postId')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { comments, total } = await getAllComments({
      status,
      postId,
      page,
      limit,
    });

    const pendingCount = await getPendingCommentsCount();

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pendingCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
