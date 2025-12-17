"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  MapPin,
  Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { deleteCustomerAction } from "@/actions/customers"
import { showToast } from "@/components/ui/Toast"

interface CustomerAddress {
  city: string
  country: string
  provinceCode?: string
  countryCode?: string
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  acceptsMarketing: boolean
  totalOrders: number
  totalSpent: number
  defaultAddress?: CustomerAddress
}

interface CustomersTableProps {
  customers: Customer[]
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.firstName?.toLowerCase().includes(query) ||
      customer.lastName?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
  })

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(c => c !== id))
    } else {
      setSelectedCustomers([...selectedCustomers, id])
    }
  }

  const formatLocation = (address?: CustomerAddress) => {
    if (!address) return "—"
    const parts = [
      address.city,
      address.provinceCode,
      address.country === "United States" ? "United States" : address.country
    ].filter(Boolean)
    return parts.join(", ")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return

    setLoadingId(id)
    try {
      const result = await deleteCustomerAction(id)
      if (result.success) {
        showToast("Customer deleted successfully", "success")
      } else {
        showToast(result.error || "Failed to delete customer", "error")
      }
    } catch (error) {
      showToast("An error occurred", "error")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-muted-foreground">
          {filteredCustomers.length} customers
        </h2>
      </div>

      <div className="flex items-center gap-2 py-4">
        {selectedCustomers.length > 0 ? (
          <div className="flex items-center gap-2 w-full p-2 bg-muted/50 rounded-md border text-sm">
            <span className="font-medium mr-2">{selectedCustomers.length} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) return

                  let successCount = 0
                  for (const id of selectedCustomers) {
                    try {
                      await deleteCustomerAction(id)
                      successCount++
                    } catch (e) {
                      console.error(e)
                    }
                  }

                  if (successCount === selectedCustomers.length) {
                    showToast(`${successCount} customers deleted`, "success")
                  } else {
                    showToast(`Deleted ${successCount} of ${selectedCustomers.length} customers`, "warning")
                  }
                  setSelectedCustomers([])
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomers([])}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers"
                className="pl-8 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Customer name</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Email subscription</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Location</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground">Orders</TableHead>
              <TableHead className="font-medium text-xs text-muted-foreground text-right">Amount spent</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-muted/50">
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedCustomers.includes(customer.id)}
                    onCheckedChange={() => toggleSelect(customer.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/customers/${customer.id}`} className="hover:underline text-sm font-semibold text-primary">
                    {customer.firstName || customer.lastName ? `${customer.firstName} ${customer.lastName}`.trim() : customer.email}
                  </Link>
                  {customer.firstName && <div className="text-xs text-muted-foreground">{customer.email}</div>}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={customer.acceptsMarketing ? "secondary" : "outline"}
                    className={`
                      font-normal border-0 px-2.5 py-0.5 rounded-md
                      ${customer.acceptsMarketing
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    {customer.acceptsMarketing ? 'Subscribed' : 'Not subscribed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatLocation(customer.defaultAddress)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                </TableCell>
                <TableCell className="text-sm font-medium text-right">
                  ${customer.totalSpent.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(customer.id)}>
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href={`/admin/customers/${customer.id}`} className="w-full">
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        disabled={loadingId === customer.id}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        {/* Pagination logic can be added here */}
        <div className="text-xs text-muted-foreground">
          1-{filteredCustomers.length} of {customers.length}
        </div>
      </div>
    </div>
  )
}
