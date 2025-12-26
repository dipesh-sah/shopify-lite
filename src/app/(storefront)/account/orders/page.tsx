import { getCustomerProfile } from '@/actions/customer-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { query } from '@/lib/db';

export const metadata = {
  title: 'My Orders',
  description: 'View your order history and track shipments',
};

async function getCustomerOrders(email: string) {
  try {
    const orders = await query<any>(
      `SELECT 
        o.id,
        o.order_number,
        o.total,
        o.status as order_status,
        o.payment_status,
        o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE o.customer_email = ?
      ORDER BY o.created_at DESC
      LIMIT 50`,
      [email]
    );
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default async function OrdersPage() {
  const customer = await getCustomerProfile();

  if (!customer) {
    redirect('/login?redirect=/account/orders');
  }

  const orders = await getCustomerOrders(customer.email);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-1">
          View and track your order history
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Button asChild>
              <a href="/products">Browse Products</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const statusKey = (order.order_status || 'pending').toLowerCase();
            const paymentStatusKey = (order.payment_status || 'pending').toLowerCase();
            const totalValue = parseFloat(order.total || 0);

            return (
              <Card key={order.id || Math.random()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.order_number || 'N/A'}
                      </CardTitle>
                      <CardDescription>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }) : 'Date unavailable'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${isNaN(totalValue) ? '0.00' : totalValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.item_count || 0} {(order.item_count === 1) ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge className={statusColors[statusKey] || 'bg-gray-100 text-gray-800'}>
                        {order.order_status || 'unknown'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={paymentStatusColors[paymentStatusKey] || 'bg-gray-100 text-gray-800'}
                      >
                        Payment: {order.payment_status || 'unknown'}
                      </Badge>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/orders/${order.id}`}>View Details</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
