import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistItem {
  id: string
  title: string
  slug: string
  price: number
  image?: string
  addedAt: Date
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (product: any) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get()

        // Check if already in wishlist
        if (items.some(item => item.id === product.id)) {
          return
        }

        const wishlistItem: WishlistItem = {
          id: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          image: product.images?.[0]?.url || product.images?.[0],
          addedAt: new Date()
        }

        set({ items: [...items, wishlistItem] })
      },

      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },

      isInWishlist: (productId) => {
        return get().items.some(item => item.id === productId)
      },

      clearWishlist: () => {
        set({ items: [] })
      }
    }),
    {
      name: 'wishlist-storage',
    }
  )
)
