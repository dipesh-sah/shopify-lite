/**
 * Blog Comment Form Component
 * Client-side component for submitting comments
 */

'use client';

import React, { useState } from 'react';
import Loading from '@/components/ui/Loading';

interface CommentFormProps {
  postId: number;
  onCommentSubmitted?: () => void;
}

export default function CommentForm({ postId, onCommentSubmitted }: CommentFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    authorName: '',
    authorEmail: '',
    content: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          ...form,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit comment');

      setForm({ authorName: '', authorEmail: '', content: '' });
      alert('Comment submitted for approval!');
      if (onCommentSubmitted) onCommentSubmitted();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Error submitting comment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Leave a Comment</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
          <input
            type="text"
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            placeholder="John Doe"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={form.authorEmail}
            onChange={(e) => setForm({ ...form, authorEmail: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            placeholder="john@example.com"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
          rows={5}
          placeholder="Share your thoughts..."
          required
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
      >
        {loading ? (
          <>
            <Loading variant="inline" size="sm" />
            Submitting...
          </>
        ) : (
          'Post Comment'
        )}
      </button>
    </form>
  );
}
