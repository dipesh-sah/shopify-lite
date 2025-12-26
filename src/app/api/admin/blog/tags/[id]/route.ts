/**
 * Admin Blog Tag By ID API
 * PUT /api/admin/blog/tags/[id] - Update tag
 * DELETE /api/admin/blog/tags/[id] - Delete tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBlogTagSchema } from '@/lib/blog/schemas';
import { updateTag, deleteTag } from '@/lib/blog/tags';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(request, ['admin']);

    const tagId = parseInt(id);
    const body = await request.json();
    const validated = updateBlogTagSchema.parse(body);

    const updated = await updateTag(tagId, validated);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tag updated successfully',
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
          error: 'Invalid tag data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update tag' },
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
    await requireRole(request, ['admin']);

    const tagId = parseInt(id);
    const deleted = await deleteTag(tagId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
