/**
 * Admin Edit Blog Post Page
 * Route: /admin/blog/posts/[id]/edit
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Image as ImageIcon } from 'lucide-react';
import Loading from "@/components/ui/Loading"
import { showToast } from "@/components/ui/Toast"
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ImagePicker } from '@/components/admin/ImagePicker';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category_id: '',
    status: 'draft',
    tags: [] as number[],
  });

  useEffect(() => {
    fetchCategories();
    fetchTags();
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories');
      const result = await response.json();
      if (result.success) setCategories(result.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/blog/tags');
      const result = await response.json();
      if (result.success) setAvailableTags(result.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/posts/${id}`);
      const result = await response.json();

      if (result.success) {
        const post = result.data;
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          featured_image: post.featured_image || '',
          category_id: post.category_id?.toString() || '',
          status: post.status || 'draft',
          tags: post.tags?.map((t: any) => t.id) || [],
        });
      } else {
        setError(result.error || 'Failed to fetch post');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug || undefined,
          content: formData.content,
          excerpt: formData.excerpt || undefined,
          featured_image: formData.featured_image || undefined,
          category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
          status: formData.status,
          tags: formData.tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update post');
      }

      alert('Blog post updated successfully!');
      router.push('/admin/blog/posts');
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="lg" variant="centered" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog/posts"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update your blog post content and settings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/blog/${formData.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Live
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Updating..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Post
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Slug */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/blog/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="url-slug"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                className="min-h-[400px]"
              />
            </div>

            {/* Excerpt */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brief summary..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Publish</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Featured Image</h3>
              <ImagePicker
                images={formData.featured_image ? [formData.featured_image] : []}
                onChange={(urls) => setFormData({ ...formData, featured_image: urls[0] || "" })}
                maxImages={1}
                multiple={false}
                single={true}
              />
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Category</h3>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Uncategorized</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>

              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                {availableTags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`tag-${tag.id}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.tags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                    />
                    <label htmlFor={`tag-${tag.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>

              <Link
                href="/admin/blog/tags"
                className="text-sm text-blue-600 hover:underline"
              >
                + Manage tags
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
