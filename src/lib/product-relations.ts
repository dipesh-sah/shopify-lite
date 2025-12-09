// Stubs for product relations to replace Firebase
export type RelationType = 'cross-sell' | 'upsell' | 'related';

export async function addProductRelation(data: any) {
  return 'mock-relation-id';
}

export async function getProductRelations(productId: string, relationType?: RelationType) {
  return [];
}

export async function getCrossSellProducts(productId: string) {
  return [];
}

export async function getUpsellProducts(productId: string) {
  return [];
}

export async function getRelatedProducts(productId: string) {
  return [];
}

export async function removeProductRelation(relationId: string) {
  // no-op
}

export async function updateRelationPriority(relationId: string, priority: number) {
  // no-op
}
