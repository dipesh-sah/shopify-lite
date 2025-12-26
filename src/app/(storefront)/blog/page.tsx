/**
 * Blog Home Page
 * Route: /blog
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog/posts';
import { getAllCategories } from '@/lib/blog/categories';
import { getPopularTags } from '@/lib/blog/tags';
import { getPopularPosts } from '@/lib/blog/views';
import BlogGrid from '@/components/blog/BlogGrid';

import FeaturedPost from '@/components/blog/FeaturedPost';
import BlogSkeleton from '@/components/blog/BlogSkeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Latest Articles and Insights',
  description: 'Read our latest blog posts and stay updated with industry news, tips, and insights.',
  openGraph: {
    title: 'Blog | Latest Articles and Insights',
    description: 'Read our latest blog posts and stay updated with industry news, tips, and insights.',
    type: 'website',
  },
};

export const revalidate = 60; // ISR: Revalidate every 60 seconds

async function BlogContent({ page = 1 }: { page?: number }) {
  const [
    { posts, total },
    categories,
    popularTags,
    featuredPosts,
  ] = await Promise.all([
    getPublishedPosts({ page, limit: 12, sort: 'latest' }),
    getAllCategories(),
    getPopularTags(10),
    getPopularPosts(1, 7), // Most viewed in last 7 days
  ]);

  const featuredPost = featuredPosts[0] ? await import('@/lib/blog/posts').then(m => m.getPostBySlug(featuredPosts[0].slug)) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Featured Post */}
      {featuredPost && page === 1 && (
        <FeaturedPost post={featuredPost} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Latest Posts
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {total} {total === 1 ? 'post' : 'posts'}
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No blog posts found.
                </p>
              </div>
            ) : (
              <>
                <BlogGrid posts={posts} />

                {/* Pagination */}
                {total > 12 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={`/blog?page=${page - 1}`}
                        className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        Previous
                      </Link>
                    )}

                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                      Page {page}
                    </span>

                    {page * 12 < total && (
                      <Link
                        href={`/blog?page=${page + 1}`}
                        className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Categories
              </h3>
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/blog/category/${category.slug}`}
                      className="flex justify-between items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {category.post_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1');

  return (
    <Suspense fallback={<BlogSkeleton count={12} />}>
      <BlogContent page={page} />
    </Suspense>
  );
}
