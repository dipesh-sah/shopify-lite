'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Calendar, Trash2, Edit } from 'lucide-react';
import { deleteOrderAction, updateOrderStatusAction } from '@/actions/orders';
import { useRouter } from 'next/navigation';

interface OrdersTableProps {
  orders: any[];
}

export default function OrdersTable({ orders: initialOrders }: OrdersTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const router = useRouter();

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
      await updateOrderStatusAction(id, newStatus);
      setOrders(orders.map(order =>
        order.id === id ? { ...order, status: newStatus } : order
      ));
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Items</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="h-24 text-center">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">#{order.id.slice(-6)}</td>
                  <td className="p-4 align-middle text-sm">
                    <Link
                      href={`/admin/customers/${encodeURIComponent(order.customerEmail || order.userId || 'guest')}`}
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {order.customerEmail || order.userId || 'Guest'}
                    </Link>
                  </td>
                  <td className="p-4 align-middle text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                      {order.items?.length || 0}
                    </span>
                  </td>
                  <td className="p-4 align-middle font-semibold">${Number(order.total).toFixed(2)}</td>
                  <td className="p-4 align-middle">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`rounded px-2 py-1 text-xs font-medium border-0 cursor-pointer ${order.status === 'DELIVERED'
                        ? 'bg-green-50 text-green-700'
                        : order.status === 'PENDING'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                        }`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${order.isPaid
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                      }`}>
                      {order.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="p-2 hover:bg-gray-100 rounded-full text-blue-600"
                        title="View Details"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-2 hover:bg-red-50 rounded-full text-red-600"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
