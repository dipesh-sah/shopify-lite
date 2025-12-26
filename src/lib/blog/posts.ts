/**
 * Blog Posts Data Access Layer
 */

import { query, queryOne, execute, transaction, buildPaginationClause } from '@/lib/db-blog';
import { serializeDate } from '../utils';
import type { BlogPostWithRelations } from './schemas';
import { generateUniquePostSlug } from './slugs';
import { calculateReadingTime, generateExcerpt } from './utils';
import { getPostTags } from './tags';
import { updateCategoryPostCount } from './categories';

function mapPostFromDb(post: any): any {
  if (!post) return null;
  return {
    ...post,
    created_at: serializeDate(post.created_at),
    updated_at: serializeDate(post.updated_at),
    published_at: serializeDate(post.published_at),
    deleted_at: serializeDate(post.deleted_at),
  };
}


/**
 * Get published blog posts with pagination and filters
 */
export async function getPublishedPosts(options: {
  page?: number;
  limit?: number;
  categoryId?: number;
  tagId?: number;
  sort?: 'latest' | 'oldest' | 'popular';
}): Promise<{ posts: BlogPostWithRelations[]; total: number }> {
  const { page = 1, limit = 12, categoryId, tagId, sort = 'latest' } = options;

  // Build WHERE conditions
  const conditions: string[] = ['p.status = ?', 'p.deleted_at IS NULL'];
  const params: any[] = ['published'];

  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }

  if (tagId) {
    conditions.push('EXISTS (SELECT 1 FROM blog_post_tags bpt WHERE bpt.post_id = p.id AND bpt.tag_id = ?)');
    params.push(tagId);
  }

  const whereClause = conditions.join(' AND ');

  // Build ORDER BY clause
  let orderBy = 'p.created_at DESC';
  if (sort === 'oldest') orderBy = 'p.created_at ASC';
  if (sort === 'popular') orderBy = 'p.view_count DESC, p.created_at DESC';

  // Get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM blog_posts p
    WHERE ${whereClause}
  `;
  const countResult = await queryOne<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  // Get posts with pagination
  const { clause: limitClause, params: limitParams } = buildPaginationClause(page, limit);

  const sql = `
    SELECT 
      p.*,
      u.name as author_name,
      u.email as author_email,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    ${limitClause}
  `;

  const postsRaw = await query<BlogPostWithRelations>(sql, [...params, ...limitParams]);
  const posts = postsRaw.map(mapPostFromDb);

  // Fetch tags for each post
  for (const post of posts) {
    post.tags = await getPostTags(post.id);
  }

  return { posts, total };
}

/**
 * Get single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPostWithRelations | null> {
  const sql = `
    SELECT 
      p.*,
      u.name as author_name,
      u.email as author_email,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.deleted_at IS NULL
  `;

  const postRaw = await queryOne<BlogPostWithRelations>(sql, [slug]);
  const post = mapPostFromDb(postRaw);

  if (post) {
    post.tags = await getPostTags(post.id);
  }

  return post;
}

/**
 * Get post by ID (for admin)
 */
export async function getPostById(id: number): Promise<BlogPostWithRelations | null> {
  const sql = `
    SELECT 
      p.*,
      u.name as author_name,
      u.email as author_email,
      c.id as category_id,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;

  const postRaw = await queryOne<BlogPostWithRelations>(sql, [id]);
  const post = mapPostFromDb(postRaw);

  if (post) {
    post.tags = await getPostTags(post.id);
  }

  return post;
}

/**
 * Search blog posts using FULLTEXT search
 */
export async function searchPosts(
  searchQuery: string,
  options: {
    page?: number;
    limit?: number;
    categoryId?: number;
    tagId?: number;
  }
): Promise<{ posts: BlogPostWithRelations[]; total: number }> {
  const { page = 1, limit = 10, categoryId, tagId } = options;

  // Build WHERE conditions
  const conditions: string[] = [
    'MATCH(p.title, p.content) AGAINST(? IN NATURAL LANGUAGE MODE)',
    'p.status = ?',
    'p.deleted_at IS NULL'
  ];
  const params: any[] = [searchQuery, 'published'];

  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }

  if (tagId) {
    conditions.push('EXISTS (SELECT 1 FROM blog_post_tags bpt WHERE bpt.post_id = p.id AND bpt.tag_id = ?)');
    params.push(tagId);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM blog_posts p
    WHERE ${whereClause}
  `;
  const countResult = await queryOne<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  // Get posts with pagination
  const { clause: limitClause, params: limitParams } = buildPaginationClause(page, limit);

  const sql = `
    SELECT 
      p.*,
      u.name as author_name,
      u.email as author_email,
      c.name as category_name,
      c.slug as category_slug,
      MATCH(p.title, p.content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE ${whereClause}
    ORDER BY relevance DESC, p.created_at DESC
    ${limitClause}
  `;

  const postsRaw = await query<BlogPostWithRelations>(sql, [searchQuery, ...params, ...limitParams]);
  const posts = postsRaw.map(mapPostFromDb);

  // Fetch tags for each post
  for (const post of posts) {
    post.tags = await getPostTags(post.id);
  }

  return { posts, total };
}

/**
 * Create new blog post
 */
export async function createPost(data: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id: number;
  category_id?: number;
  status?: 'draft' | 'published';
  tags?: number[];
  published_at?: string;
}): Promise<number> {
  return await transaction(async (connection) => {
    // Generate slug if not provided
    const slug = data.slug || await generateUniquePostSlug(data.title);

    // Calculate reading time
    const reading_time = calculateReadingTime(data.content);

    // Generate excerpt if not provided
    const excerpt = data.excerpt || generateExcerpt(data.content);

    // Set published_at if status is published and not provided
    const published_at = data.status === 'published'
      ? (data.published_at || new Date().toISOString())
      : null;

    const sql = `
      INSERT INTO blog_posts (
        title, slug, content, excerpt, featured_image,
        author_id, category_id, status, reading_time, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(sql, [
      data.title,
      slug,
      data.content,
      excerpt,
      data.featured_image || null,
      data.author_id,
      data.category_id || null,
      data.status || 'draft',
      reading_time,
      published_at,
    ]);

    const postId = (result as any).insertId;

    // Associate tags if provided
    if (data.tags && data.tags.length > 0) {
      const values = data.tags.map(() => '(?, ?)').join(', ');
      const tagParams: any[] = [];
      data.tags.forEach(tagId => {
        tagParams.push(postId, tagId);
      });

      await connection.execute(
        `INSERT INTO blog_post_tags (post_id, tag_id) VALUES ${values}`,
        tagParams
      );
    }

    return postId;
  });
}

/**
 * Update blog post
 */
export async function updatePost(
  id: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featured_image?: string;
    category_id?: number;
    status?: 'draft' | 'published';
    tags?: number[];
    published_at?: string;
  }
): Promise<boolean> {
  return await transaction(async (connection) => {
    const updates: string[] = [];
    const params: any[] = [];

    // Get current post data
    const [currentRows] = await connection.execute(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );
    const currentPost = (currentRows as any[])[0];
    if (!currentPost) return false;

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.slug !== undefined) {
      const uniqueSlug = await generateUniquePostSlug(data.slug, id);
      updates.push('slug = ?');
      params.push(uniqueSlug);
    }

    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(data.content);

      // Recalculate reading time
      const reading_time = calculateReadingTime(data.content);
      updates.push('reading_time = ?');
      params.push(reading_time);

      // Regenerate excerpt if not explicitly provided
      if (data.excerpt === undefined) {
        const excerpt = generateExcerpt(data.content);
        updates.push('excerpt = ?');
        params.push(excerpt);
      }
    }

    if (data.excerpt !== undefined) {
      updates.push('excerpt = ?');
      params.push(data.excerpt);
    }

    if (data.featured_image !== undefined) {
      updates.push('featured_image = ?');
      params.push(data.featured_image);
    }

    if (data.category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(data.category_id);

      // Update post count for old and new categories
      if (currentPost.category_id) {
        await updateCategoryPostCount(currentPost.category_id);
      }
      if (data.category_id) {
        await updateCategoryPostCount(data.category_id);
      }
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);

      // Set published_at when changing from draft to published
      if (data.status === 'published' && currentPost.status === 'draft') {
        updates.push('published_at = ?');
        params.push(data.published_at || new Date().toISOString());
      }
    }

    if (data.published_at !== undefined) {
      updates.push('published_at = ?');
      params.push(data.published_at);
    }

    if (updates.length > 0) {
      params.push(id);
      const sql = `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`;
      await connection.execute(sql, params);
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      // Remove existing associations
      await connection.execute('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);

      // Add new associations
      if (data.tags.length > 0) {
        const values = data.tags.map(() => '(?, ?)').join(', ');
        const tagParams: any[] = [];
        data.tags.forEach(tagId => {
          tagParams.push(id, tagId);
        });

        await connection.execute(
          `INSERT INTO blog_post_tags (post_id, tag_id) VALUES ${values}`,
          tagParams
        );
      }
    }

    return true;
  });
}

/**
 * Soft delete blog post
 */
export async function deletePost(id: number): Promise<boolean> {
  const sql = `UPDATE blog_posts SET deleted_at = NOW() WHERE id = ?`;
  const affectedRows = await execute(sql, [id]);

  // Update category post count
  const post = await getPostById(id);
  if (post?.category_id) {
    await updateCategoryPostCount(post.category_id);
  }

  return affectedRows > 0;
}

/**
 * Permanently delete blog post
 */
export async function permanentlyDeletePost(id: number): Promise<boolean> {
  return await transaction(async (connection) => {
    // Delete associations first
    await connection.execute('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);
    await connection.execute('DELETE FROM blog_comments WHERE post_id = ?', [id]);
    await connection.execute('DELETE FROM blog_views WHERE post_id = ?', [id]);

    // Delete post
    await connection.execute('DELETE FROM blog_posts WHERE id = ?', [id]);

    return true;
  });
}

/**
 * Increment view count atomically
 */
export async function incrementViewCount(postId: number): Promise<void> {
  const sql = `UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?`;
  await execute(sql, [postId]);
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(
  postId: number,
  limit: number = 5
): Promise<BlogPostWithRelations[]> {
  const post = await getPostById(postId);
  if (!post) return [];

  const sql = `
    SELECT DISTINCT
      p.*,
      u.name as author_name,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    LEFT JOIN blog_post_tags bpt ON p.id = bpt.post_id
    WHERE p.id != ?
      AND p.status = 'published'
      AND p.deleted_at IS NULL
      AND (
        p.category_id = ?
        OR bpt.tag_id IN (
          SELECT tag_id FROM blog_post_tags WHERE post_id = ?
        )
      )
    ORDER BY 
      (p.category_id = ?) DESC,
      p.created_at DESC
    LIMIT ?
  `;

  const relatedPostsRaw = await query<BlogPostWithRelations>(sql, [
    postId,
    post.category_id || 0,
    postId,
    post.category_id || 0,
    limit,
  ]);
  const relatedPosts = relatedPostsRaw.map(mapPostFromDb);

  // Fetch tags for each post
  for (const relatedPost of relatedPosts) {
    relatedPost.tags = await getPostTags(relatedPost.id);
  }

  return relatedPosts;
}

/**
 * Get popular posts (most viewed)
 */
export async function getPopularPosts(
  limit: number = 10,
  days?: number
): Promise<BlogPostWithRelations[]> {
  let whereClause = 'p.status = ? AND p.deleted_at IS NULL';
  const params: any[] = ['published'];

  if (days) {
    whereClause += ' AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
    params.push(days);
  }

  const sql = `
    SELECT 
      p.*,
      u.name as author_name,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE ${whereClause}
    ORDER BY p.view_count DESC, p.created_at DESC
    LIMIT ?
  `;

  params.push(limit);
  const postsRaw = await query<BlogPostWithRelations>(sql, params);
  const posts = postsRaw.map(mapPostFromDb);

  for (const post of posts) {
    post.tags = await getPostTags(post.id);
  }

  return posts;
}

/**
 * Get all posts (admin)
 */
export async function getAllPosts(options: {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published';
  authorId?: number;
}): Promise<{ posts: BlogPostWithRelations[]; total: number }> {
  const { page = 1, limit = 20, status, authorId } = options;

  const conditions: string[] = ['p.deleted_at IS NULL'];
  const params: any[] = [];

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  if (authorId) {
    conditions.push('p.author_id = ?');
    params.push(authorId);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM blog_posts p WHERE ${whereClause}`;
  const countResult = await queryOne<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  // Get posts
  const { clause: limitClause, params: limitParams } = buildPaginationClause(page, limit);

  const sql = `
    SELECT 
      p.*,
      u.name as author_name,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE ${whereClause}
    ORDER BY p.created_at DESC
    ${limitClause}
  `;

  const postsRaw = await query<BlogPostWithRelations>(sql, [...params, ...limitParams]);
  const posts = postsRaw.map(mapPostFromDb);

  for (const post of posts) {
    post.tags = await getPostTags(post.id);
  }

  return { posts, total };
}
