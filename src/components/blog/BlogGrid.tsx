/**
 * Blog Grid Component
 * Responsive grid container for blog posts
 */

import type { BlogPostWithRelations } from '@/lib/blog/schemas';
import BlogCard from './BlogCard';

interface BlogGridProps {
  posts: BlogPostWithRelations[];
}

export default function BlogGrid({ posts }: BlogGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
