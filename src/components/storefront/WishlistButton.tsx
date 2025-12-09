'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { addToWishlist, removeFromWishlist, isInWishlist } from '@/lib/wishlists';

interface WishlistButtonProps {
  productId: string;
  customerId: string;
  variantId?: string;
}

export default function WishlistButton({ productId, customerId, variantId }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleWishlist() {
    if (!customerId) {
      alert('Please login to add to wishlist');
      return;
    }

    setLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(customerId, productId);
        setInWishlist(false);
      } else {
        await addToWishlist(customerId, productId, variantId);
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Error updating wishlist');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${inWishlist
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } disabled:opacity-50`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
    </button>
  );
}
