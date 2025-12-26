/**
 * Blog Card Component
 * Displays a blog post preview card
 */

import Link from 'next/link';
import Image from 'next/image';
import type { BlogPostWithRelations } from '@/lib/blog/schemas';
import { formatRelativeTime } from '@/lib/blog/utils';

interface BlogCardProps {
  post: BlogPostWithRelations;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Featured Image */}
      {post.featured_image && (
        <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
          <div className="relative h-48 w-full">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        {/* Category Badge */}
        {post.category_name && (
          <Link
            href={`/blog/category/${post.category_slug}`}
            className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full mb-3 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {post.category_name}
          </Link>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.reading_time} min read
            </span>

            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.view_count}
            </span>
          </div>

          <time className="text-sm text-gray-500 dark:text-gray-400" dateTime={post.published_at?.toString()}>
            {formatRelativeTime(post.published_at || post.created_at)}
          </time>
        </div>
      </div>
    </article>
  );
}
