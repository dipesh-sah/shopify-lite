// Stubs for pages to replace Firebase
export type PageStatus = 'draft' | 'published';

export async function createPage(data: any) {
  return 'mock-page-id';
}

export async function getPages(status?: PageStatus) {
  return [];
}

export async function getPage(id: string) {
  return null;
}

export async function getPageBySlug(slug: string) {
  return null;
}

export async function updatePage(id: string, data: any) {
  // no-op
}

export async function deletePage(id: string) {
  // no-op
}
