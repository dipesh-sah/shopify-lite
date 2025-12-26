/**
 * Zod validation schemas for blog system
 */

import { z } from 'zod';

// ============================================
// Blog Post Schemas
// ============================================

export const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(300, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional(),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  featured_image: z.string().url('Invalid image URL').optional(),
  category_id: z.number().int().positive().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.number().int().positive()).optional(),
  published_at: z.string().datetime().optional(),
});

export const updateBlogPostSchema = blogPostSchema.partial();

export const blogPostFilterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('12'),
  category: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  tag: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  status: z.enum(['draft', 'published']).optional(),
  sort: z.enum(['latest', 'oldest', 'popular']).default('latest'),
  search: z.string().optional(),
});

// ============================================
// Category Schemas
// ============================================

export const blogCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional(),
  description: z.string().optional(),
  image: z.string().url('Invalid image URL').optional(),
});

export const updateBlogCategorySchema = blogCategorySchema.partial();

// ============================================
// Tag Schemas
// ============================================

export const blogTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(60, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional(),
});

export const updateBlogTagSchema = blogTagSchema.partial();

// ============================================
// Comment Schemas
// ============================================

export const blogCommentSchema = z.object({
  post_id: z.number().int().positive('Invalid post ID'),
  parent_id: z.number().int().positive().optional(),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment too long'),
  author_name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  author_email: z.string().email('Invalid email address').max(255, 'Email too long'),
});

export const updateCommentStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'spam', 'rejected']),
});

// ============================================
// Search & Filter Schemas
// ============================================

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  category: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  tag: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('10'),
});

// ============================================
// TypeScript Types from Schemas
// ============================================

export type BlogPost = z.infer<typeof blogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
export type BlogPostFilter = z.infer<typeof blogPostFilterSchema>;

export type BlogCategory = z.infer<typeof blogCategorySchema>;
export type UpdateBlogCategory = z.infer<typeof updateBlogCategorySchema>;

export type BlogTag = z.infer<typeof blogTagSchema>;
export type UpdateBlogTag = z.infer<typeof updateBlogTagSchema>;

export type BlogComment = z.infer<typeof blogCommentSchema>;
export type UpdateCommentStatus = z.infer<typeof updateCommentStatusSchema>;

export type SearchQuery = z.infer<typeof searchQuerySchema>;

// ============================================
// Database Entity Types
// ============================================

export interface BlogPostEntity {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author_id: number;
  category_id: number | null;
  status: 'draft' | 'published';
  reading_time: number;
  view_count: number;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface BlogCategoryEntity {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  post_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogTagEntity {
  id: number;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogCommentEntity {
  id: number;
  post_id: number;
  parent_id: number | null;
  user_id: number | null;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogViewEntity {
  id: number;
  post_id: number;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string | null;
}

// ============================================
// Extended Types with Relations
// ============================================

export interface BlogPostWithRelations extends BlogPostEntity {
  author_name?: string;
  author_email?: string;
  category_name?: string;
  category_slug?: string;
  tags?: BlogTagEntity[];
  comment_count?: number;
}
