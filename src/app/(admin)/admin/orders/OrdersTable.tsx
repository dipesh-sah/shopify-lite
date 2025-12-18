'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Calendar, Trash2, Edit, Search, Filter, CheckCircle, Plus, MoreHorizontal } from 'lucide-react';
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
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider"

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
  const { formatPrice } = useStoreSettings()

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

  async function handleBulkDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) return;

    try {
      await Promise.all(selectedOrders.map(id => deleteOrderAction(id)));
      setOrders(orders.filter(order => !selectedOrders.includes(order.id)));
      setSelectedOrders([]);
      router.refresh();
    } catch (error) {
      console.error('Error deleting orders:', error);
      alert('Failed to delete some orders');
    }
  }

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

  async function handleExport() {
    try {
      if (!confirm("Export filtered orders to CSV?")) return;

      const { orders: allOrders } = await import('@/actions/orders').then(mod => mod.getOrdersAction({
        search: searchTerm,
        status: statusParam || undefined,
        paymentStatus: paymentStatusParam || undefined,
        limit: 1000
      }));

      const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Total', 'Payment Status', 'Fulfillment Status', 'Items Count'];
      const csvContent = [
        headers.join(','),
        ...allOrders.map((order: any) => [
          order.id,
          new Date(order.createdAt).toISOString(),
          `"${(order.customerFirstName || '')} ${(order.customerLastName || '')}"`,
          order.customerEmail,
          order.total,
          order.paymentStatus,
          order.status,
          order.items?.length || 0
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export orders');
    }
  }

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

        {selectedOrders.length > 0 ? (
          <div className="flex items-center gap-2 py-4 bg-muted/50 px-4 rounded-md">
            <span className="text-sm font-medium">{selectedOrders.length} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrders([])}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
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
              {/* <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button> */}
              <button
                onClick={handleExport}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                Export CSV
              </button>
              <Link href="/admin/orders/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Create Order
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    {(statusParam || paymentStatusParam) && (
                      <Badge variant="secondary" className="ml-1 px-1 rounded-sm h-5 text-[10px] min-w-[1.25rem]">
                        {(statusParam ? 1 : 0) + (paymentStatusParam ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Fulfillment Status</p>
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                        <div key={s} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`status-${s}`}
                            checked={statusParam === s}
                            onChange={(e) => {
                              const params = new URLSearchParams(searchParams.toString());
                              if (e.target.checked) params.set('status', s);
                              else params.delete('status');
                              params.set('page', '1');
                              router.push(`?${params.toString()}`);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`status-${s}`} className="text-sm capitalize">{s}</label>
                        </div>
                      ))}
                    </div>

                    <DropdownMenuSeparator />

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Payment Status</p>
                      {['paid', 'pending', 'failed', 'refunded'].map((s) => (
                        <div key={s} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`payment-${s}`}
                            checked={paymentStatusParam === s}
                            onChange={(e) => {
                              const params = new URLSearchParams(searchParams.toString());
                              if (e.target.checked) params.set('paymentStatus', s);
                              else params.delete('paymentStatus');
                              params.set('page', '1');
                              router.push(`?${params.toString()}`);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`payment-${s}`} className="text-sm capitalize">{s}</label>
                        </div>
                      ))}
                    </div>

                    {(statusParam || paymentStatusParam) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('status');
                          params.delete('paymentStatus');
                          router.push(`?${params.toString()}`);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

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
                          {formatPrice(order.total ?? 0)}
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.id}`}>Edit Order</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(order.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
