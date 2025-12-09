'use client';

// import { getRelatedProducts, getCrossSellProducts, getUpsellProducts } from '@/lib/product-relations';
// import { getProduct } from '@/lib/firestore';
import { ProductCard } from './ProductCard';

interface ProductRecommendationsProps {
  productId: string;
  type: 'related' | 'cross-sell' | 'upsell';
  title?: string;
}

export default function ProductRecommendations({ productId, type, title }: ProductRecommendationsProps) {
  // Recommendations temporarily disabled during Migration
  return null;
}
