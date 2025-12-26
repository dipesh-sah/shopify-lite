/**
 * Single Blog Post API
 * GET /api/blog/posts/[slug] - Get single blog post by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/blog/posts';
import { trackView } from '@/lib/blog/views';
import { getClientIp, getUserAgent } from '@/lib/blog/utils';
import { getPostComments } from '@/lib/blog/comments';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get post
    const post = await getPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 }
      );
    }

    // Only show published posts to public
    if (post.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
        },
        { status: 404 }
      );
    }

    // Track view (async, don't await)
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    trackView({
      post_id: post.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    }).catch(err => {
      console.error('Error tracking view:', err);
    });

    // Get comments
    const comments = await getPostComments(post.id);

    return NextResponse.json({
      success: true,
      data: {
        post,
        comments,
      },
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog post',
      },
      { status: 500 }
    );
  }
}
