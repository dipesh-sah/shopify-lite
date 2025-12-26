/**
 * Blog Tags Data Access Layer
 */

import { query, queryOne, insert, execute, transaction } from '@/lib/db-blog';
import { serializeDate } from '../utils';
import type { BlogTagEntity } from './schemas';
import { generateUniqueTagSlug } from './slugs';

function mapTagFromDb(tag: any): any {
  if (!tag) return null;
  return {
    ...tag,
    created_at: serializeDate(tag.created_at),
    updated_at: serializeDate(tag.updated_at),
  };
}

/**
 * Get all blog tags with usage counts
 */
export async function getAllTags(): Promise<BlogTagEntity[]> {
  const sql = `
    SELECT * FROM blog_tags
    ORDER BY usage_count DESC, name ASC
  `;

  const tags = await query<BlogTagEntity>(sql);
  return tags.map(mapTagFromDb);
}

/**
 * Get tag by ID
 */
export async function getTagById(id: number): Promise<BlogTagEntity | null> {
  const sql = `SELECT * FROM blog_tags WHERE id = ?`;
  const tag = await queryOne<BlogTagEntity>(sql, [id]);
  return mapTagFromDb(tag);
}

/**
 * Get tag by slug
 */
export async function getTagBySlug(slug: string): Promise<BlogTagEntity | null> {
  const sql = `SELECT * FROM blog_tags WHERE slug = ?`;
  const tag = await queryOne<BlogTagEntity>(sql, [slug]);
  return mapTagFromDb(tag);
}

/**
 * Create new blog tag
 */
export async function createTag(data: {
  name: string;
  slug?: string;
}): Promise<number> {
  // Generate unique slug if not provided
  const slug = data.slug || await generateUniqueTagSlug(data.name);

  const sql = `INSERT INTO blog_tags (name, slug) VALUES (?, ?)`;

  return await insert(sql, [data.name, slug]);
}

/**
 * Update blog tag
 */
export async function updateTag(
  id: number,
  data: {
    name?: string;
    slug?: string;
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
    const uniqueSlug = await generateUniqueTagSlug(data.slug, id);
    updates.push('slug = ?');
    params.push(uniqueSlug);
  }

  if (updates.length === 0) {
    return false;
  }

  params.push(id);
  const sql = `UPDATE blog_tags SET ${updates.join(', ')} WHERE id = ?`;

  const affectedRows = await execute(sql, params);
  return affectedRows > 0;
}

/**
 * Delete blog tag (removes all associations)
 */
export async function deleteTag(id: number): Promise<boolean> {
  // First delete all associations
  await execute(`DELETE FROM blog_post_tags WHERE tag_id = ?`, [id]);

  // Then delete the tag
  const sql = `DELETE FROM blog_tags WHERE id = ?`;
  const affectedRows = await execute(sql, [id]);
  return affectedRows > 0;
}

/**
 * Get or create tags by names (bulk operation)
 * Returns array of tag IDs
 */
export async function getOrCreateTags(names: string[]): Promise<number[]> {
  if (names.length === 0) return [];

  const tagIds: number[] = [];

  for (const name of names) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    // Check if tag exists
    const slug = await generateUniqueTagSlug(trimmedName);
    const existing = await queryOne<BlogTagEntity>(
      `SELECT id FROM blog_tags WHERE slug = ?`,
      [slug]
    );

    if (existing) {
      tagIds.push(existing.id);
    } else {
      // Create new tag
      const id = await createTag({ name: trimmedName, slug });
      tagIds.push(id);
    }
  }

  return tagIds;
}

/**
 * Associate tags with a blog post
 */
export async function associateTagsWithPost(
  postId: number,
  tagIds: number[]
): Promise<void> {
  if (tagIds.length === 0) return;

  return await transaction(async (connection) => {
    // First, remove existing associations
    await connection.execute(
      `DELETE FROM blog_post_tags WHERE post_id = ?`,
      [postId]
    );

    // Then add new associations
    const values = tagIds.map(() => '(?, ?)').join(', ');
    const params: any[] = [];
    tagIds.forEach(tagId => {
      params.push(postId, tagId);
    });

    await connection.execute(
      `INSERT INTO blog_post_tags (post_id, tag_id) VALUES ${values}`,
      params
    );

    // Update usage counts for all affected tags
    for (const tagId of tagIds) {
      await updateTagUsageCount(tagId, connection);
    }
  });
}

/**
 * Get tags for a specific blog post
 */
export async function getPostTags(postId: number): Promise<BlogTagEntity[]> {
  const sql = `
    SELECT t.*
    FROM blog_tags t
    INNER JOIN blog_post_tags bpt ON t.id = bpt.tag_id
    WHERE bpt.post_id = ?
    ORDER BY t.name ASC
  `;

  const tags = await query<BlogTagEntity>(sql, [postId]);
  return tags.map(mapTagFromDb);
}

/**
 * Update tag usage count
 */
export async function updateTagUsageCount(
  tagId: number,
  connection?: any
): Promise<void> {
  const sql = `
    UPDATE blog_tags
    SET usage_count = (
      SELECT COUNT(DISTINCT bpt.post_id)
      FROM blog_post_tags bpt
      INNER JOIN blog_posts bp ON bpt.post_id = bp.id
      WHERE bpt.tag_id = ? 
        AND bp.status = 'published' 
        AND bp.deleted_at IS NULL
    )
    WHERE id = ?
  `;

  if (connection) {
    await connection.execute(sql, [tagId, tagId]);
  } else {
    await execute(sql, [tagId, tagId]);
  }
}

/**
 * Get most popular tags
 */
export async function getPopularTags(limit: number = 10): Promise<BlogTagEntity[]> {
  const sql = `
    SELECT * FROM blog_tags
    WHERE usage_count > 0
    ORDER BY usage_count DESC
    LIMIT ?
  `;

  const tags = await query<BlogTagEntity>(sql, [limit]);
  return tags.map(mapTagFromDb);
}

/**
 * Remove tag association from post
 */
export async function removeTagFromPost(
  postId: number,
  tagId: number
): Promise<void> {
  await execute(
    `DELETE FROM blog_post_tags WHERE post_id = ? AND tag_id = ?`,
    [postId, tagId]
  );

  // Update tag usage count
  await updateTagUsageCount(tagId);
}
