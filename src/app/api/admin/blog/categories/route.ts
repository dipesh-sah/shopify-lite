/**
 * Admin Blog Categories API
 * GET /api/admin/blog/categories - List all categories
 * POST /api/admin/blog/categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server';
import { blogCategorySchema } from '@/lib/blog/schemas';
import { getAllCategories, createCategory } from '@/lib/blog/categories';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'editor']);

    const categories = await getAllCategories();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    const body = await request.json();
    const validated = blogCategorySchema.parse(body);

    const categoryId = await createCategory(validated);

    return NextResponse.json({
      success: true,
      data: {
        id: categoryId,
        message: 'Category created successfully',
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
          error: 'Invalid category data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
