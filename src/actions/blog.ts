"use server"

import { getPublishedPosts } from "@/lib/blog/posts"

export async function getFeaturedPostsAction(limit = 4) {
  try {
    const { posts } = await getPublishedPosts({
      limit,
      sort: 'latest'
    })
    return posts
  } catch (error) {
    console.error("Error fetching featured posts:", error)
    return []
  }
}
