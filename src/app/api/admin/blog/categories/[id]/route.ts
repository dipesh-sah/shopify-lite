/**
 * Admin Blog Category By ID API  
 * PUT /api/admin/blog/categories/[id] - Update category
 * DELETE /api/admin/blog/categories/[id] - Delete category
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateBlogCategorySchema } from '@/lib/blog/schemas';
import { updateCategory, deleteCategory } from '@/lib/blog/categories';
import { requireRole } from '@/lib/blog/auth';
import { ZodError } from 'zod';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(request, ['admin']);

    const categoryId = parseInt(id);
    const body = await request.json();
    const validated = updateBlogCategorySchema.parse(body);

    const updated = await updateCategory(categoryId, validated);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
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
          error: 'Invalid category data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
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

    const categoryId = parseInt(id);
    const deleted = await deleteCategory(categoryId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Category not found or has associated posts' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (error.message.includes('Cannot delete category')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
