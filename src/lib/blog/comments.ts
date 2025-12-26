/**
 * Blog Comments Data Access Layer
 */

import { query, queryOne, insert, execute } from '@/lib/db-blog';
import { serializeDate } from '../utils';
import type { BlogCommentEntity } from './schemas';

function mapCommentFromDb(comment: any): any {
  if (!comment) return null;
  return {
    ...comment,
    created_at: serializeDate(comment.created_at),
    updated_at: serializeDate(comment.updated_at),
  };
}

/**
 * Get comments for a specific post (nested structure)
 */
export async function getPostComments(postId: number): Promise<BlogCommentEntity[]> {
  const sql = `
    SELECT 
      c.*,
      u.name as user_name
    FROM blog_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? AND c.status = 'approved'
    ORDER BY c.created_at ASC
  `;

  const commentsRaw = await query<BlogCommentEntity>(sql, [postId]);
  const comments = commentsRaw.map(mapCommentFromDb);

  // Build nested comment tree
  return buildCommentTree(comments);
}

/**
 * Build nested comment tree from flat array
 */
function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map<number, any>();
  const rootComments: any[] = [];

  // Create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Build tree structure
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id)!;

    if (comment.parent_id === null) {
      rootComments.push(commentNode);
    } else {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentNode);
      } else {
        // Parent not found (shouldn't happen), add as root
        rootComments.push(commentNode);
      }
    }
  });

  return rootComments;
}

/**
 * Get comment by ID
 */
export async function getCommentById(id: number): Promise<BlogCommentEntity | null> {
  const sql = `SELECT * FROM blog_comments WHERE id = ?`;
  const comment = await queryOne<BlogCommentEntity>(sql, [id]);
  return mapCommentFromDb(comment);
}

/**
 * Create new comment
 */
export async function createComment(data: {
  post_id: number;
  parent_id?: number;
  user_id?: number;
  author_name: string;
  author_email: string;
  content: string;
}): Promise<number> {
  const sql = `
    INSERT INTO blog_comments (
      post_id, parent_id, user_id, author_name, author_email, content, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  return await insert(sql, [
    data.post_id,
    data.parent_id || null,
    data.user_id || null,
    data.author_name,
    data.author_email,
    data.content,
  ]);
}

/**
 * Reply to a comment
 */
export async function replyToComment(data: {
  parent_id: number;
  post_id: number;
  user_id?: number;
  author_name: string;
  author_email: string;
  content: string;
}): Promise<number> {
  // Verify parent comment exists
  const parent = await getCommentById(data.parent_id);
  if (!parent) {
    throw new Error('Parent comment not found');
  }

  return createComment(data);
}

/**
 * Update comment status (for moderation)
 */
export async function updateCommentStatus(
  id: number,
  status: 'pending' | 'approved' | 'spam' | 'rejected'
): Promise<boolean> {
  const sql = `UPDATE blog_comments SET status = ? WHERE id = ?`;
  const affectedRows = await execute(sql, [status, id]);
  return affectedRows > 0;
}

/**
 * Delete comment (also deletes all replies)
 */
export async function deleteComment(id: number): Promise<boolean> {
  const sql = `DELETE FROM blog_comments WHERE id = ? OR parent_id = ?`;
  const affectedRows = await execute(sql, [id, id]);
  return affectedRows > 0;
}

/**
 * Get all comments (admin - for moderation)
 */
export async function getAllComments(options: {
  status?: 'pending' | 'approved' | 'spam' | 'rejected';
  postId?: number;
  page?: number;
  limit?: number;
}): Promise<{ comments: BlogCommentEntity[]; total: number }> {
  const { status, postId, page = 1, limit = 50 } = options;

  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }

  if (postId) {
    conditions.push('c.post_id = ?');
    params.push(postId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM blog_comments c ${whereClause}`;
  const countResult = await queryOne<{ total: number }>(countSql, params);
  const total = countResult?.total || 0;

  // Get comments
  const offset = (page - 1) * limit;
  const sql = `
    SELECT 
      c.*,
      p.title as post_title,
      p.slug as post_slug
    FROM blog_comments c
    LEFT JOIN blog_posts p ON c.post_id = p.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const commentsRaw = await query<BlogCommentEntity>(sql, [...params, limit, offset]);
  const comments = commentsRaw.map(mapCommentFromDb);

  return { comments, total };
}

/**
 * Get pending comments count (for admin dashboard)
 */
export async function getPendingCommentsCount(): Promise<number> {
  const sql = `SELECT COUNT(*) as count FROM blog_comments WHERE status = 'pending'`;
  const result = await queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

/**
 * Bulk approve comments
 */
export async function bulkApproveComments(commentIds: number[]): Promise<number> {
  if (commentIds.length === 0) return 0;

  const placeholders = commentIds.map(() => '?').join(', ');
  const sql = `UPDATE blog_comments SET status = 'approved' WHERE id IN (${placeholders})`;

  return await execute(sql, commentIds);
}

/**
 * Bulk mark comments as spam
 */
export async function bulkMarkAsSpam(commentIds: number[]): Promise<number> {
  if (commentIds.length === 0) return 0;

  const placeholders = commentIds.map(() => '?').join(', ');
  const sql = `UPDATE blog_comments SET status = 'spam' WHERE id IN (${placeholders})`;

  return await execute(sql, commentIds);
}

/**
 * Bulk delete comments
 */
export async function bulkDeleteComments(commentIds: number[]): Promise<number> {
  if (commentIds.length === 0) return 0;

  const placeholders = commentIds.map(() => '?').join(', ');
  const sql = `DELETE FROM blog_comments WHERE id IN (${placeholders}) OR parent_id IN (${placeholders})`;

  return await execute(sql, [...commentIds, ...commentIds]);
}

/**
 * Get comment count for a post
 */
export async function getPostCommentCount(postId: number): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count 
    FROM blog_comments 
    WHERE post_id = ? AND status = 'approved'
  `;
  const result = await queryOne<{ count: number }>(sql, [postId]);
  return result?.count || 0;
}
