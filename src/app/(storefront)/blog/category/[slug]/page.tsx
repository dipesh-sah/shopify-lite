/**
 * Blog Category Archive Page
 * Route: /blog/category/[slug]
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/lib/blog/categories';
import { getPublishedPosts } from '@/lib/blog/posts';
import BlogCard from '@/components/blog/BlogCard';
import { ArrowLeft, Hash } from 'lucide-react';
import Link from 'next/link';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} | Blog`,
    description: category.description || `Read articles about ${category.name}`,
  };
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { posts } = await getPublishedPosts({
    categoryId: category.id,
    limit: 50,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs & Title */}
      <div className="mb-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center">
            <Hash className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
              {category.description || `Browsing all articles in the ${category.name} category.`}
            </p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No articles yet</h2>
          <p className="text-gray-600 dark:text-gray-400">
            We haven&apos;t published any articles in this category. Stay tuned!

          </p>
          <Link
            href="/blog"
            className="inline-block mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            Explore Other Categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
