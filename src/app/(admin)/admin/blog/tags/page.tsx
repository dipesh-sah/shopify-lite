/**
 * Admin Blog Tags Management Page
 * Route: /admin/blog/tags
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Hash, ArrowLeft, Save } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminBlogTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [currentTag, setCurrentTag] = useState({
    id: null as number | null,
    name: '',
    slug: '',
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog/tags');
      const result = await response.json();
      if (result.success) {
        setTags(result.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'create' | 'edit', tag?: any) => {
    setModalMode(mode);
    if (mode === 'edit' && tag) {
      setCurrentTag({
        id: tag.id,
        name: tag.name || '',
        slug: tag.slug || '',
      });
    } else {
      setCurrentTag({
        id: null,
        name: '',
        slug: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = modalMode === 'create'
        ? '/api/admin/blog/tags'
        : `/api/admin/blog/tags/${currentTag.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentTag.name,
          slug: currentTag.slug || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchTags();
      } else {
        alert(result.error || 'Failed to save tag');
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('An error occurred while saving the tag');
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all posts.')) return;
    try {
      const response = await fetch(`/api/admin/blog/tags/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTags();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog/posts" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blog Tags</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage tags to organize your content
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenModal('create')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Tag
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <Loading variant="centered" size="lg" text="Loading tags..." />
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">No tags found. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {tag.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md">
                      {tag.slug}
                    </code>
                    <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Used in <span className="font-bold text-gray-700 dark:text-gray-300">{tag.usage_count || 0}</span> posts
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal('edit', tag)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {!loading && tags.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tags</div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">{tags.length}</div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Popular</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
              {tags.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))[0]?.name || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Create New Tag' : 'Edit Tag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
              <Input
                required
                value={currentTag.name}
                onChange={(e) => setCurrentTag({ ...currentTag, name: e.target.value })}
                placeholder="Tag name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug (Optional)</label>
              <Input
                value={currentTag.slug}
                onChange={(e) => setCurrentTag({ ...currentTag, slug: e.target.value })}
                placeholder="tag-slug"
              />
              <p className="text-[10px] text-gray-500">Auto-generated from name if left empty.</p>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {saving ? (
                  <>
                    <Loading variant="inline" size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {modalMode === 'create' ? 'Create' : 'Update'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
