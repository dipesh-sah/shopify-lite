'use client';

import { useState, useEffect } from 'react';
import { getWishlistAction } from '@/actions/wishlists';
import { getProductAction } from '@/actions/products';
import { ProductCard } from '@/components/storefront/ProductCard';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // TODO: Get actual customer ID from auth context
  const customerId = 'demo-customer';

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    setLoading(true);
    try {
      const items = await getWishlistAction(customerId);

      // Fetch product details
      const productPromises = items.map((item: any) => getProductAction(item.productId));
      const products = await Promise.all(productPromises);

      setWishlistItems(products.filter(p => p !== null));
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <a
            href="/products"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Continue Shopping
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
