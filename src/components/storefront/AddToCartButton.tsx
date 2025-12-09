'use client'

import { useCart, type Product } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Check } from "lucide-react"
import { useState } from "react"

interface AddToCartButtonProps {
  product: Product
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      onClick={handleAddToCart}
      className="w-full h-12 text-base font-semibold"
      size="lg"
    >
      {added ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
