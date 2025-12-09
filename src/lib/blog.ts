export type PostStatus = 'draft' | 'published';

export async function createBlogPost(data: any): Promise<any> { throw new Error('Not implemented'); }
export async function getBlogPosts(status?: PostStatus): Promise<any[]> { return []; }
export async function getBlogPost(id: string): Promise<any> { return null; }
export async function getBlogPostBySlug(slug: string): Promise<any> { return null; }
export async function updateBlogPost(id: string, data: any) { }
export async function deleteBlogPost(id: string) { }
export async function incrementPostViews(id: string) { }

export async function createBlogCategory(data: any): Promise<any> { throw new Error('Not implemented'); }
export async function getBlogCategories(): Promise<any[]> { return []; }
export async function updateBlogCategory(id: string, data: any) { }
export async function deleteBlogCategory(id: string) { }

export async function createBlogComment(data: any): Promise<any> { throw new Error('Not implemented'); }
export async function getBlogComments(postId: string, onlyApproved: boolean = true): Promise<any[]> { return []; }
export async function updateCommentApproval(id: string, isApproved: boolean) { }
export async function deleteBlogComment(id: string) { }
