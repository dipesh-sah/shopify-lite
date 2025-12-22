'use client'

import { useWishlist } from "@/store/wishlist"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <Heart className="w-12 h-12 text-pink-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Wishlist is Empty
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Start adding products you love to your wishlist!
            </p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              My Wishlist
            </h1>
            <p className="text-gray-600">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={clearWishlist}
              className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <Link href={`/products/${item.slug}`}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:scale-105">
                  {/* Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      ${Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  removeItem(item.id)
                }}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-red-50 transition-all group-hover:scale-110"
              >
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link href="/products">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
