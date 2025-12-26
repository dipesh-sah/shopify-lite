import { notFound } from 'next/navigation';

import { format } from 'date-fns';
import { Eye, Calendar, User, Tag, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getPostBySlug, incrementViewCount, getRelatedPosts } from '@/lib/blog/posts';
import { getPostComments } from '@/lib/blog/comments';
import CommentForm from '@/components/blog/CommentForm';
import BlogCard from '@/components/blog/BlogCard';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// SEO Metadata
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      images: post.featured_image ? [post.featured_image] : [],
      type: 'article',
      publishedTime: (post.published_at || post.created_at).toString(),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Increment view count (Server-side)
  await incrementViewCount(post.id);

  const comments = await getPostComments(post.id);
  const relatedPosts = await getRelatedPosts(post.id, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-12 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Articles
          </Link>

          <div className="space-y-4">
            {post.category_name && (
              <Link
                href={`/blog/category/${post.category_slug}`}
                className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full uppercase tracking-wider hover:bg-blue-200 transition-colors"
              >
                {post.category_name}
              </Link>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{post.author_name || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(post.published_at || post.created_at), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{post.view_count || 0} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {post.featured_image && (
            <div className="w-full aspect-video relative">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            <div
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2 pt-8 border-t border-gray-100 dark:border-gray-700">
                {post.tags.map((tag: any) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                Related Stories
              </h2>
              <Link
                href="/blog"
                className="group flex items-center text-sm font-bold text-blue-600 dark:text-blue-400"
              >
                View all <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.slice(0, 2).map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <section className="mt-20 space-y-12">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">
              Discussion
            </h2>
            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-bold">
              {comments.length}
            </span>
          </div>

          <CommentForm postId={post.id} />

          <div className="space-y-8">
            {comments.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {comment.author_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 dark:text-white">{comment.author_name}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(comment.created_at), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
