import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: string
  name: string
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
  addItem: (product: Product, quantity?: number, variantId?: string) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  total: () => number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (product, quantity = 1, variantId) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id && item.variantId === variantId)

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
      },
      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter((item) => {
            if (item.product.id !== productId) return true;
            // If deleting, check variant Match
            // If item has variantId and we passed one, compare them.
            // If item has no variantId (base product) and we passed undefined, compare them.
            return item.variantId !== variantId;
          })
        })
      },
      updateQuantity: (productId, quantity, variantId) => {
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        })
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
