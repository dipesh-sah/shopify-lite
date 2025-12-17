"use client"

import { Users } from "lucide-react"
import Link from "next/link"

interface TopCustomersProps {
  customers: { email: string; name: string; orders: number; totalSpent: number }[]
}

export function TopCustomers({ customers }: TopCustomersProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm h-full flex flex-col">
      <div className="p-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold">Top Customers</h3>
        </div>
        <Link href="/admin/customers" className="text-sm text-primary hover:underline">View All</Link>
      </div>
      <div className="flex-1 overflow-auto">
        {customers.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No customers found.
          </div>
        ) : (
          <div className="divide-y">
            {customers.map((customer, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{customer.name}</span>
                  <span className="text-xs text-muted-foreground">{customer.email}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">${customer.totalSpent.toFixed(2)}</div>
                  <span className="text-xs text-muted-foreground">{customer.orders} orders</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
