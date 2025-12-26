/**
 * Blog Categories Data Access Layer
 */

import { query, queryOne, insert, execute } from '@/lib/db-blog';
import { serializeDate } from '../utils';
import type { BlogCategoryEntity } from './schemas';
import { generateUniqueCategorySlug } from './slugs';

function mapCategoryFromDb(category: any): any {
  if (!category) return null;
  return {
    ...category,
    created_at: serializeDate(category.created_at),
    updated_at: serializeDate(category.updated_at),
  };
}

/**
 * Get all blog categories with post counts
 */
export async function getAllCategories(): Promise<BlogCategoryEntity[]> {
  const sql = `
    SELECT * FROM blog_categories
    ORDER BY name ASC
  `;

  const categories = await query<BlogCategoryEntity>(sql);
  return categories.map(mapCategoryFromDb);
}

/**
 * Get category by ID
 */
export async function getCategoryById(
  id: number
): Promise<BlogCategoryEntity | null> {
  const sql = `SELECT * FROM blog_categories WHERE id = ?`;
  const category = await queryOne<BlogCategoryEntity>(sql, [id]);
  return mapCategoryFromDb(category);
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  slug: string
): Promise<BlogCategoryEntity | null> {
  const sql = `SELECT * FROM blog_categories WHERE slug = ?`;
  const category = await queryOne<BlogCategoryEntity>(sql, [slug]);
  return mapCategoryFromDb(category);
}

/**
 * Create new blog category
 */
export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}): Promise<number> {
  // Generate unique slug if not provided
  const slug = data.slug || await generateUniqueCategorySlug(data.name);

  const sql = `
    INSERT INTO blog_categories (name, slug, description, image)
    VALUES (?, ?, ?, ?)
  `;

  return await insert(sql, [
    data.name,
    slug,
    data.description || null,
    data.image || null,
  ]);
}

/**
 * Update blog category
 */
export async function updateCategory(
  id: number,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
  }
): Promise<boolean> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.slug !== undefined) {
    // Ensure slug is unique
    const uniqueSlug = await generateUniqueCategorySlug(data.slug, id);
    updates.push('slug = ?');
    params.push(uniqueSlug);
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }

  if (data.image !== undefined) {
    updates.push('image = ?');
    params.push(data.image);
  }

  if (updates.length === 0) {
    return false;
  }

  params.push(id);
  const sql = `UPDATE blog_categories SET ${updates.join(', ')} WHERE id = ?`;

  const affectedRows = await execute(sql, params);
  return affectedRows > 0;
}

/**
 * Delete blog category (only if no posts are associated)
 */
export async function deleteCategory(id: number): Promise<boolean> {
  // Check if category has posts
  const checkSql = `
    SELECT COUNT(*) as count 
    FROM blog_posts 
    WHERE category_id = ? AND deleted_at IS NULL
  `;
  const result = await queryOne<{ count: number }>(checkSql, [id]);

  if (result && result.count > 0) {
    throw new Error('Cannot delete category with associated posts');
  }

  const sql = `DELETE FROM blog_categories WHERE id = ?`;
  const affectedRows = await execute(sql, [id]);
  return affectedRows > 0;
}

/**
 * Update category post count (call after post create/delete/update)
 */
export async function updateCategoryPostCount(categoryId: number): Promise<void> {
  const sql = `
    UPDATE blog_categories
    SET post_count = (
      SELECT COUNT(*) 
      FROM blog_posts 
      WHERE category_id = ? 
        AND status = 'published' 
        AND deleted_at IS NULL
    )
    WHERE id = ?
  `;

  await execute(sql, [categoryId, categoryId]);
}

/**
 * Get categories with post counts (for admin)
 */
export async function getCategoriesWithCounts(): Promise<BlogCategoryEntity[]> {
  const sql = `
    SELECT 
      c.*,
      COUNT(bp.id) as post_count
    FROM blog_categories c
    LEFT JOIN blog_posts bp ON c.id = bp.category_id 
      AND bp.status = 'published' 
      AND bp.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY c.name ASC
  `;

  const categories = await query<BlogCategoryEntity>(sql);
  return categories.map(mapCategoryFromDb);
}
