"use client"

import { Trash2 } from "lucide-react"

interface DeleteButtonProps {
  productId: string
}

export default function DeleteButton({ productId }: DeleteButtonProps) {
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const res = await fetch("/api/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      const data = await res.json()

      if (res.ok) {
        alert("Product deleted successfully!")
        // optionally: refresh the page or refetch data
        location.reload()
      } else {
        alert(data.error || "Failed to delete product")
      }
    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-500 hover:text-red-700 p-1"
      title="Delete product"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
