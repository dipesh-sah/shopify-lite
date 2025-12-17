'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Calendar, Trash2, Edit, Search, Filter, CheckCircle, Plus } from 'lucide-react';
import { deleteOrderAction, updateOrderStatusAction, updatePaymentStatusAction } from '@/actions/orders';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface OrdersTableProps {
  orders: any[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}

export default function OrdersTable({
  orders: initialOrders,
  totalCount = 0,
  totalPages = 1,
  currentPage = 1
}: OrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");

  // Determine active tab based on params
  const statusParam = searchParams.get('status');
  const paymentStatusParam = searchParams.get('paymentStatus');

  let currentTab = 'all';
  if (statusParam === 'pending' && !paymentStatusParam) currentTab = 'unfulfilled';
  else if (!statusParam && paymentStatusParam === 'paid') currentTab = 'paid';
  else if (statusParam === 'delivered' && !paymentStatusParam) currentTab = 'delivered';

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      // Preserve other filters when searching ?? Actually standard is to keep them.
      params.set('page', '1');
      if (searchTerm !== (searchParams.get('search') || "")) {
        router.push(`?${params.toString()}`);
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, searchParams, router]); // Added deps

  const handleSearch = (term: string) => {
    // Handled by effect
  }

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('status'); // Reset status filters
    params.delete('paymentStatus');

    if (value === 'unfulfilled') {
      params.set('status', 'pending');
    } else if (value === 'paid') {
      params.set('paymentStatus', 'paid');
    } else if (value === 'delivered') {
      params.set('status', 'delivered');
    }
    // 'all' does nothing (status/paymentStatus remain deleted)

    params.set('page', '1');
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allOrderIds = orders.map((order) => order.id);
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // Handle individual select
  const toggleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;

    try {
      await deleteOrderAction(id);
      setOrders(orders.filter(order => order.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    try {
      await updateOrderStatusAction(id, newStatus.toLowerCase());
      setOrders(orders.map(order =>
        order.id === id ? { ...order, status: newStatus.toLowerCase() } : order
      ));
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  }

  async function handlePaymentUpdate(id: string, newStatus: string) {
    try {
      await updatePaymentStatusAction(id, newStatus.toLowerCase() as 'paid' | 'pending');
      setOrders(orders.map(order =>
        order.id === id ? { ...order, isPaid: newStatus === 'PAID', paymentStatus: newStatus.toLowerCase() } : order
      ));
      router.refresh();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  }

  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length;

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} className="w-full" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto">
            <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Unfulfilled</TabsTrigger>
            <TabsTrigger value="paid" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Paid</TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Delivered</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center gap-2 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-8 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Link href="/admin/orders/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Create Order
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs bg-gray-50 uppercase text-gray-700">
                <tr>
                  <th scope="col" className="p-4">
                    <div className="flex items-center">
                      <input
                        id="checkbox-all"
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Items</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-24 text-center text-muted-foreground">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isPaid = order.paymentStatus === 'paid';
                    const paymentBadgeClass = isPaid
                      ? "bg-gray-100 text-gray-800"
                      : "bg-orange-100 text-orange-800";

                    const isFulfilled = ['shipped', 'delivered'].includes(order.status.toLowerCase());
                    const fulfillmentBadgeClass = isFulfilled
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800";

                    return (
                      <tr key={order.id} className={`bg-white border-b hover:bg-gray-50 ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''}`}>
                        <td className="w-4 p-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => toggleSelectOrder(order.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                        </td>
                        <th scope="row" className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                            #{order.id.slice(-6).toUpperCase()}
                          </Link>
                        </th>
                        <td className="px-4 py-4 text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{order.customerFirstName && order.customerLastName ? `${order.customerFirstName} ${order.customerLastName}` : 'Guest'}</span>
                            <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900">
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={`capitalize font-normal border-0 ${paymentBadgeClass}`}>
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={`capitalize font-normal border-0 ${fulfillmentBadgeClass}`}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {order.items?.length || 0} items
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination UI */}
        <div className="flex items-center justify-end gap-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
