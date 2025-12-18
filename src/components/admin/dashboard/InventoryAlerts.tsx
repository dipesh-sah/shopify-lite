"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface InventoryAlertsProps {
  products: { id: number; title: string; stock: number }[]
}

export function InventoryAlerts({ products }: InventoryAlertsProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm h-full flex flex-col">
      <div className="p-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold">Low Stock Alerts</h3>
        </div>
        <Link href="/admin/products" className="text-sm text-primary hover:underline">View All</Link>
      </div>
      <div className="flex-1 overflow-auto">
        {products.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No low stock items.
          </div>
        ) : (
          <div className="divide-y">
            {products.map((product) => (
              <Link key={product.id} href={`/admin/products/${product.id}`} className="block hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between p-4">
                  <span className="font-medium text-sm line-clamp-1 flex-1 pr-4">{product.title}</span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {product.stock} left
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
