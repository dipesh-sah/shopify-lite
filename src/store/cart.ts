import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  addToCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
  syncCartAction
} from '@/actions/cart'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  categoryId: string
}

export interface CartItem {
  product: Product
  quantity: number
  variantId?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, variantId?: string) => Promise<void>
  removeItem: (productId: string, variantId?: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>
  clearCart: () => void
  total: () => number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  syncWithServer: () => Promise<void>
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),


      syncWithServer: async () => {
        const localItems = get().items;
        const serverCart = await syncCartAction(localItems);

        if (serverCart && serverCart.items) {
          // Map server items back to local format
          // Server returns items with nested product object
          const mergedItems = serverCart.items.map((i: any) => ({
            product: {
              id: i.productId?.toString() || i.product?.id,
              name: i.product?.name || i.title || 'Product',
              slug: i.product?.slug || i.slug || i.productId?.toString(),
              price: Number(i.product?.price || 0),
              images: i.product?.images || (i.image ? [i.image] : []),
              description: i.product?.description || '',
              categoryId: i.product?.categoryId || ''
            },
            quantity: i.quantity,
            variantId: i.variantId ? i.variantId.toString() : undefined
          }));

          set({ items: mergedItems });
        }
      },

      addItem: async (product, quantity = 1, variantId) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id && item.variantId === variantId)

        // Optimistic Update
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id && item.variantId === variantId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          set({ items: [...items, { product, quantity, variantId }] })
        }

        // Server Call
        await addToCartAction(product, quantity, variantId);
      },

      removeItem: async (productId, variantId) => {
        set({
          items: get().items.filter((item) => {
            if (item.product.id !== productId) return true;
            return item.variantId !== variantId;
          })
        })

        await removeFromCartAction(productId, variantId);
      },

      updateQuantity: async (productId, quantity, variantId) => {
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        })

        await updateCartQuantityAction(productId, quantity, variantId);
      },

      clearCart: () => set({ items: [] }),
      total: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.product.price) * item.quantity,
          0
        )
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
