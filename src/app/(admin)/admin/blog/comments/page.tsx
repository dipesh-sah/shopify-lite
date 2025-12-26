/**
 * Admin Blog Comments Moderation Page
 * Route: /admin/blog/comments
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Trash2, MessageSquare, ArrowLeft, AlertCircle, Clock, CheckCircle, ShieldAlert } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CommentStatus = 'pending' | 'approved' | 'spam' | 'all';

export default function AdminBlogCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CommentStatus>('pending');
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, spam: 0 });

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`;
      const response = await fetch(`/api/admin/blog/comments?limit=100${statusParam}`);
      const result = await response.json();

      if (result.success) {
        setComments(result.data.comments);
        setCounts(prev => ({
          ...prev,
          pending: result.data.pendingCount || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/blog/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update comment status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment and all its replies?')) return;
    try {
      const response = await fetch(`/api/admin/blog/comments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Comment Moderation</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and moderate blog post comments
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex">
          {[
            { id: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600', count: counts.pending },
            { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
            { id: 'spam', label: 'Spam', icon: ShieldAlert, color: 'text-red-600' },
            { id: 'all', label: 'All', icon: MessageSquare, color: 'text-gray-600' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as CommentStatus)}
              className={cn(
                "flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-2",
                statusFilter === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/30 dark:bg-blue-900/10"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              )}
            >
              <tab.icon className={cn("w-4 h-4", statusFilter === tab.id ? "text-blue-600" : tab.color)} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 rounded-full text-[10px] font-black">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <Loading variant="centered" size="lg" text="Loading comments..." />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-800">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No comments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'pending'
                ? "Great! You're all caught up. No pending comments to review."
                : `No ${statusFilter} comments found in your blog.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg">
                      {comment.author_name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {comment.author_name}
                        {comment.user_id && (
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] uppercase font-black">User</span>
                        )}
                      </h4>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{comment.author_email}</span>
                        <span>•</span>
                        <span>{format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right lg:block hidden mr-4">
                      <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5 text-left">On Article</div>
                      <Link
                        href={`/blog/${comment.post_slug}`}
                        target="_blank"
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        {comment.post_title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      {comment.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(comment.id, 'approved')}
                          className="h-9 px-3 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/40"
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                      {comment.status !== 'spam' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(comment.id, 'spam')}
                          className="h-9 px-3 text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" /> Spam
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(comment.id)}
                        className="h-9 px-3 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/40"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {comment.content}
                </div>

                <div className="mt-3 lg:hidden">
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Article:</div>
                  <Link
                    href={`/blog/${comment.post_slug}`}
                    target="_blank"
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {comment.post_title}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mt-12">
        <div className="flex gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-xl">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1 text-lg">
              Comment Moderation Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 mt-2 list-disc list-inside">
              <li>Pending comments are not visible to users on your blog.</li>
              <li>Approving a comment will make it immediately visible on the related article.</li>
              <li>Marking as spam helps keep your comment section clean.</li>
              <li>Deleting a comment will also permanently remove all its replies.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
