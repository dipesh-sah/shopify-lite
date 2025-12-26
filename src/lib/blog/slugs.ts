/**
 * Slug generation and management utilities
 */

import { query } from '@/lib/db-blog';

/**
 * Generate URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Ensure slug is unique by checking database and adding suffix if needed
 */
export async function ensureUniqueSlug(
  slug: string,
  tableName: 'blog_posts' | 'blog_categories' | 'blog_tags',
  excludeId?: number
): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const sql = excludeId
      ? `SELECT id FROM ${tableName} WHERE slug = ? AND id != ?`
      : `SELECT id FROM ${tableName} WHERE slug = ?`;

    const params = excludeId ? [uniqueSlug, excludeId] : [uniqueSlug];
    const existing = await query(sql, params);

    if (existing.length === 0) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}

/**
 * Generate unique slug for blog post
 */
export async function generateUniquePostSlug(
  title: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = generateSlug(title);
  return ensureUniqueSlug(baseSlug, 'blog_posts', excludeId);
}

/**
 * Generate unique slug for category
 */
export async function generateUniqueCategorySlug(
  name: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = generateSlug(name);
  return ensureUniqueSlug(baseSlug, 'blog_categories', excludeId);
}

/**
 * Generate unique slug for tag
 */
export async function generateUniqueTagSlug(
  name: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = generateSlug(name);
  return ensureUniqueSlug(baseSlug, 'blog_tags', excludeId);
}
