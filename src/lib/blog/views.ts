/**
 * Blog Views/Analytics Data Access Layer
 */

import { query, queryOne, execute, insert } from '@/lib/db-blog';
import { serializeDate } from '../utils';
import type { BlogViewEntity } from './schemas';
import { incrementViewCount } from './posts';

/**
 * Track a blog post view
 */
export async function trackView(data: {
  post_id: number;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
}): Promise<number> {
  // Check if this IP has already viewed this post recently (last 24 hours)
  if (data.ip_address) {
    const recentView = await queryOne<BlogViewEntity>(
      `SELECT id FROM blog_views 
       WHERE post_id = ? AND ip_address = ? 
       AND viewed_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [data.post_id, data.ip_address]
    );

    // Don't count duplicate views from same IP within 24 hours
    if (recentView) {
      return recentView.id;
    }
  }

  const sql = `
    INSERT INTO blog_views (post_id, user_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?)
  `;

  const viewId = await insert(sql, [
    data.post_id,
    data.user_id || null,
    data.ip_address || null,
    data.user_agent || null,
  ]);

  // Increment post view count
  await incrementViewCount(data.post_id);

  return viewId;
}

/**
 * Get total view count for a post
 */
export async function getPostViewCount(postId: number): Promise<number> {
  const sql = `SELECT COUNT(*) as count FROM blog_views WHERE post_id = ?`;
  const result = await queryOne<{ count: number }>(sql, [postId]);
  return result?.count || 0;
}

/**
 * Get unique view count for a post (by IP)
 */
export async function getUniqueViewCount(postId: number): Promise<number> {
  const sql = `
    SELECT COUNT(DISTINCT ip_address) as count 
    FROM blog_views 
    WHERE post_id = ? AND ip_address IS NOT NULL
  `;
  const result = await queryOne<{ count: number }>(sql, [postId]);
  return result?.count || 0;
}

/**
 * Get view analytics for a post
 */
export async function getPostViewAnalytics(postId: number): Promise<{
  total_views: number;
  unique_views: number;
  views_last_7_days: number;
  views_last_30_days: number;
}> {
  const [total, unique, last7Days, last30Days] = await Promise.all([
    getPostViewCount(postId),
    getUniqueViewCount(postId),
    queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM blog_views 
       WHERE post_id = ? AND viewed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [postId]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM blog_views 
       WHERE post_id = ? AND viewed_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [postId]
    ),
  ]);

  return {
    total_views: total,
    unique_views: unique,
    views_last_7_days: last7Days?.count || 0,
    views_last_30_days: last30Days?.count || 0,
  };
}

/**
 * Get popular posts by views in time period
 */
export async function getPopularPosts(
  limit: number = 10,
  days?: number
): Promise<Array<{ post_id: number; title: string; slug: string; view_count: number }>> {
  const whereConditions = ["p.status = 'published'", "p.deleted_at IS NULL"];
  const params: any[] = [];

  if (days) {
    whereConditions.push('bv.viewed_at > DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(days);
  }

  const sql = `
    SELECT 
      p.id as post_id,
      p.title,
      p.slug,
      COUNT(bv.id) as view_count
    FROM blog_posts p
    INNER JOIN blog_views bv ON p.id = bv.post_id
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY p.id
    ORDER BY view_count DESC
    LIMIT ?
  `;

  params.push(limit);

  return await query(sql, params);
}

/**
 * Get views by date for a post (for charts)
 */
export async function getViewsByDate(
  postId: number,
  days: number = 30
): Promise<Array<{ date: string; views: number }>> {
  const sql = `
    SELECT 
      DATE(viewed_at) as date,
      COUNT(*) as views
    FROM blog_views
    WHERE post_id = ? 
      AND viewed_at > DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(viewed_at)
    ORDER BY date ASC
  `;

  const rows = await query(sql, [postId, days]);
  return rows.map((r: any) => ({
    ...r,
    date: serializeDate(r.date)
  }));
}

/**
 * Clean up old view records (optional - for data retention)
 */
export async function cleanupOldViews(daysToKeep: number = 365): Promise<number> {
  const sql = `
    DELETE FROM blog_views 
    WHERE viewed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;

  const { execute } = await import('../db-blog');
  return await execute(sql, [daysToKeep]);
}
