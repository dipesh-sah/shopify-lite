/**
 * Featured Post Component
 * Hero section for the most popular/featured blog post
 */

import Link from 'next/link';
import Image from 'next/image';
import type { BlogPostWithRelations } from '@/lib/blog/schemas';


interface FeaturedPostProps {
  post: BlogPostWithRelations;
}

export default function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 overflow-hidden">
      {/* Background Image with Overlay */}
      {post.featured_image && (
        <div className="absolute inset-0">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <span className="inline-block px-4 py-1 bg-yellow-400 text-gray-900 text-sm font-semibold rounded-full mb-4">
            ⭐ Featured Post
          </span>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            <Link
              href={`/blog/${post.slug}`}
              className="hover:text-yellow-300 transition-colors"
            >
              {post.title}
            </Link>
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-100 mb-8 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta & CTA */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-4 text-gray-200">
              {post.author_name && (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {post.author_name}
                </span>
              )}

              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.reading_time} min read
              </span>

              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.view_count} views
              </span>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-yellow-400 hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
            >
              Read Article
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
