"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { toggleWishlistAction, checkWishlistStatusAction } from "@/actions/wishlist"

export function WishlistButton({ productId }: { productId: string }) {
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check initial status
    checkWishlistStatusAction([productId]).then(res => {
      if (res[productId]) setInWishlist(true);
    });
  }, [productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();

    setLoading(true);
    try {
      const res = await toggleWishlistAction(productId);
      if (res.error) {
        // Redirect to login or show toast
        alert("Please login to use wishlist");
        return;
      }
      setInWishlist(res.added);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full p-2 transition-colors ${inWishlist ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
    >
      <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
    </button>
  )
}
