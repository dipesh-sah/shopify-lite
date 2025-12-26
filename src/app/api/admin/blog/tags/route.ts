/**
 * Admin Blog Tags API
 * GET /api/admin/blog/tags - List all tags
 * POST /api/admin/blog/tags - Create tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogTagSchema } from '@/lib/blog/schemas';
import { getAllTags, createTag } from '@/lib/blog/tags';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'editor']);

    const tags = await getAllTags();

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    const body = await request.json();
    const validated = blogTagSchema.parse(body);

    const tagId = await createTag(validated);

    return NextResponse.json({
      success: true,
      data: {
        id: tagId,
        message: 'Tag created successfully',
      },
    }, { status: 201 });
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
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
