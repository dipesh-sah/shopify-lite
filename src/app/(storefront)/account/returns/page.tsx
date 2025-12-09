'use client';

import { useState, useEffect } from 'react';
import { getCustomerOrders } from '@/lib/firestore';
import { createReturn, getCustomerReturns } from '@/lib/returns';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/components/ui/Toast';
import Link from 'next/link';

export default function ReturnsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnForm, setReturnForm] = useState({
    items: [] as any[],
    reason: '',
    method: 'refund' as 'refund' | 'exchange' | 'store_credit',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [ordersData, returnsData] = await Promise.all([
        getCustomerOrders(user?.email || undefined, user?.uid),
        getCustomerReturns(user?.uid!)
      ]);
      // Only delivered orders are eligible for return
      setOrders(ordersData.filter((o: any) => o.status === 'DELIVERED'));
      setReturns(returnsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await createReturn({
        orderId: selectedOrder.id,
        customerId: user!.uid,
        customerEmail: user!.email!,
        items: returnForm.items,
        reason: returnForm.reason,
        method: returnForm.method,
        status: 'requested'
      });

      showToast('Return requested successfully', 'success');
      setSelectedOrder(null);
      setReturnForm({ items: [], reason: '', method: 'refund' });
      loadData();
    } catch (error) {
      console.error('Error requesting return:', error);
      showToast('Failed to request return', 'error');
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Returns & Refunds</h1>

      {/* New Return Request */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Request a Return</h2>

        {!selectedOrder ? (
          <div>
            <p className="text-muted-foreground mb-4">Select an order to return items from:</p>
            {orders.length === 0 ? (
              <p className="text-gray-500">No eligible orders found for return.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left p-4 border rounded hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id.slice(-6)}</p>
                      <p className="text-sm text-gray-500">
                        {order.createdAt?.toDate?.().toLocaleDateString()} • {order.items.length} items
                      </p>
                    </div>
                    <span className="text-primary font-medium">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Select items to return from Order #{selectedOrder.id.slice(-6)}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Change Order
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <label key={idx} className="flex items-center p-3 border rounded">
                    <input
                      type="checkbox"
                      className="mr-3"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReturnForm({
                            ...returnForm,
                            items: [...returnForm.items, { ...item, returnQuantity: item.quantity }]
                          });
                        } else {
                          setReturnForm({
                            ...returnForm,
                            items: returnForm.items.filter((i: any) => i.productId !== item.productId)
                          });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.productName || 'Product'}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} • ${item.price}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reason for Return</label>
                  <select
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="damaged">Damaged / Defective</option>
                    <option value="wrong_item">Wrong Item Sent</option>
                    <option value="size_issue">Size / Fit Issue</option>
                    <option value="changed_mind">Changed Mind</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Resolution Method</label>
                  <select
                    value={returnForm.method}
                    onChange={(e) => setReturnForm({ ...returnForm, method: e.target.value as any })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="refund">Refund to Original Payment</option>
                    <option value="store_credit">Store Credit</option>
                    <option value="exchange">Exchange</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={returnForm.items.length === 0 || !returnForm.reason}
                className="bg-primary text-primary-foreground px-6 py-2 rounded disabled:opacity-50"
              >
                Submit Return Request
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Return History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Return History</h2>
        {returns.length === 0 ? (
          <p className="text-gray-500">No returns found.</p>
        ) : (
          <div className="space-y-4">
            {returns.map((ret) => (
              <div key={ret.id} className="bg-white border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">Return #{ret.id.slice(-6)}</p>
                    <p className="text-sm text-gray-500">
                      Requested on {ret.createdAt?.toDate?.().toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ret.status === 'approved' ? 'bg-green-100 text-green-800' :
                    ret.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {ret.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{ret.items.length} items • {ret.method.replace('_', ' ')}</p>
                  <p className="mt-1">Reason: {ret.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
