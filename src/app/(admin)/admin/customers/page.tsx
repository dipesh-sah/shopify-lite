"use client"

import { useState, useEffect } from 'react'
import { getCustomersAction, deleteCustomerAction } from '@/actions/customers'
import { getSegmentsAction, deleteSegmentAction } from '@/actions/segments' // New
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { MoreHorizontal, Plus, Search, Trash, Eye, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/Toast'
import { showConfirm } from '@/components/ui/Confirm'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SegmentManager } from '@/components/admin/customers/SegmentManager'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'segments'
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    loadCustomers()
  }, [])

  if (!mounted) return null

  async function loadCustomers() {
    try {
      setLoading(true)
      const data = await getCustomersAction()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Failed to load customers:', error)
      showToast('Failed to load customers', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this customer? This action cannot be undone.',
      'Delete Customer'
    )

    if (confirmed) {
      try {
        await deleteCustomerAction(id)
        setCustomers(customers.filter(c => c.id !== id))
        showToast('Customer deleted successfully', 'success')
      } catch (error) {
        console.error('Failed to delete customer:', error)
        showToast('Failed to delete customer', 'error')
      }
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    customer.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    customer.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Link href="/admin/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {(customer.firstName?.[0] || customer.email?.[0] || '?').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {customer.firstName || customer.lastName
                                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                                : customer.email || 'Unknown Customer'}
                            </span>
                            {/* Only show email if we are showing a name above */}
                            {(customer.firstName || customer.lastName) && (
                              <span className="text-xs text-muted-foreground">{customer.email}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </TableCell>
                      <TableCell>
                        {customer.billingCity ? `${customer.billingCity}, ${customer.billingCountry}` : '-'}
                      </TableCell>
                      <TableCell>{customer.totalOrders || 0} orders</TableCell>
                      <TableCell>${Number(customer.totalSpent || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/customers/${customer.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <SegmentManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
