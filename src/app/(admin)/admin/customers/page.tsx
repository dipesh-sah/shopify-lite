import Link from "next/link"
import { getCustomers } from "@/lib/firestore"
import { Mail, Package, DollarSign, Calendar, TrendingUp, Users } from "lucide-react"

export default async function AdminCustomersPage() {
  const customers = await getCustomers()

  // Calculate metrics
  const totalCustomers = customers.length
  const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0)
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const repeatCustomers = customers.filter(c => c.totalOrders > 1).length
  const newCustomers = customers.filter(c => c.totalOrders === 1).length

  // Sort customers by revenue
  const sortedCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)
  const topCustomers = sortedCustomers.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground mt-1">Manage and view all your customers</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-3xl font-bold mt-1">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold mt-1">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-3xl font-bold mt-1">${averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Repeat Customers</h3>
            <span className="text-2xl font-bold text-primary">{repeatCustomers}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {repeatCustomers > 0 ? `${((repeatCustomers / totalCustomers) * 100).toFixed(1)}% of total customers` : 'No repeat customers yet'}
          </p>
          <div className="mt-4 w-full bg-muted h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full"
              style={{ width: totalCustomers > 0 ? `${(repeatCustomers / totalCustomers) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">New Customers</h3>
            <span className="text-2xl font-bold text-green-600">{newCustomers}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {newCustomers > 0 ? `${((newCustomers / totalCustomers) * 100).toFixed(1)}% of total customers` : 'No new customers yet'}
          </p>
          <div className="mt-4 w-full bg-muted h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-600 h-full"
              style={{ width: totalCustomers > 0 ? `${(newCustomers / totalCustomers) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Top Customers</h2>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rank</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Orders</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Spent</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Avg Order</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {topCustomers.map((customer, index) => (
                  <tr key={customer.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-bold">#{index + 1}</td>
                    <td className="p-4 align-middle">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {customer.email || customer.userId || 'Guest'}
                      </Link>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="p-4 align-middle font-semibold text-green-600">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="p-4 align-middle">
                      ${(customer.totalSpent / customer.totalOrders).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Customers Table */}
      <div className="rounded-md border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">All Customers</h2>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Orders</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Spent</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Avg Order</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Last Order</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-24 text-center">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">
                      {customer.email || customer.userId || 'Guest'}
                    </td>
                    <td className="p-4 align-middle text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {customer.email || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="p-4 align-middle font-semibold">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="p-4 align-middle text-sm">
                      ${(customer.totalSpent / customer.totalOrders).toFixed(2)}
                    </td>
                    <td className="p-4 align-middle text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {customer.lastOrderDate?.toDate
                          ? customer.lastOrderDate.toDate().toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
