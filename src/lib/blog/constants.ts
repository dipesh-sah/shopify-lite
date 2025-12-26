/**
 * Blog system constants and configuration
 */

// Pagination
export const DEFAULT_POSTS_PER_PAGE = 12;
export const DEFAULT_ADMIN_POSTS_PER_PAGE = 20;
export const MAX_POSTS_PER_PAGE = 100;

// Reading time calculation
export const WORDS_PER_MINUTE = 200;

// Content limits
export const MAX_TITLE_LENGTH = 255;
export const MAX_SLUG_LENGTH = 300;
export const MAX_EXCERPT_LENGTH = 500;
export const MAX_CONTENT_LENGTH = 1000000; // 1MB
export const MAX_COMMENT_LENGTH = 2000;

// Post statuses
export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

// Comment statuses
export const COMMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SPAM: 'spam',
  REJECTED: 'rejected',
} as const;

export type CommentStatus = typeof COMMENT_STATUS[keyof typeof COMMENT_STATUS];

// User roles
export const USER_ROLE = {
  CUSTOMER: 'customer',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

// Sort options
export const SORT_OPTIONS = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  POPULAR: 'popular',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

// SEO defaults
export const DEFAULT_META_DESCRIPTION = 'Read our latest blog posts and stay updated with the latest news and insights.';
export const DEFAULT_OG_IMAGE = '/images/blog-og-default.png';

// View tracking
export const VIEW_DEDUPLICATION_HOURS = 24;

// Comment moderation
export const REQUIRE_COMMENT_APPROVAL = process.env.COMMENTS_REQUIRE_APPROVAL === 'true';
export const ENABLE_COMMENTS = process.env.ENABLE_COMMENTS !== 'false'; // Default: enabled

// Popular posts
export const POPULAR_POSTS_DAYS = 7; // Last 7 days
export const POPULAR_POSTS_LIMIT = 5;

// Related posts
export const RELATED_POSTS_LIMIT = 5;

// Tags
export const MAX_TAGS_PER_POST = 10;
export const POPULAR_TAGS_LIMIT = 20;

// API rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// Search
export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 200;

// URLs
export const BLOG_BASE_URL = '/blog';
export const ADMIN_BLOG_BASE_URL = '/admin/blog';
