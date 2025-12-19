"use server"

import { deleteOrderMySQL as deleteOrder, updateOrderStatusMySQL as updateOrderStatus, updatePaymentStatusMySQL as updatePaymentStatus, getOrderMySQL as getOrder, createOrderMySQL as createOrder, getCustomerOrdersMySQL as getCustomerOrders, getOrdersMySQL, getOrderStatsMySQL } from "@/lib/orders"
import { updateMetafieldAction } from "@/actions/metadata"
import { revalidatePath } from "next/cache"

export async function deleteOrderAction(id: string) {
  try {
    await deleteOrder(id)
    return { success: true }
  } catch (error) {
    console.error("Error deleting order:", error)
    return { error: "Failed to delete order" }
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  try {
    await updateOrderStatus(id, status)
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { error: "Failed to update order status" }
  }
}

export async function updatePaymentStatusAction(id: string, status: 'paid' | 'pending' | 'failed') {
  try {
    await updatePaymentStatus(id, status)
    return { success: true }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { error: "Failed to update payment status" }
  }
}

export async function updateOrderAction(id: string, data: any) {
  try {
    // Handle Metafields
    if (data.metafields && Array.isArray(data.metafields)) {
      for (const field of data.metafields) {
        await updateMetafieldAction(
          'order',
          id,
          field.namespace || 'custom',
          field.key,
          field.value,
          field.type
        )
      }
    }
    revalidatePath(`/admin/orders/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating order:", error)
    return { success: false, error: "Failed to update order" }
  }
}

export async function getOrderAction(id: string) {
  try {
    const order = await getOrder(id)
    return order
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export async function getCustomerOrdersAction(email?: string, userId?: string) {
  try {
    return await getCustomerOrders(email, userId)
  } catch (error) {
    console.error("Error fetching customer orders:", error)
    return []
  }
}
export async function createOrderAction(data: any) {
  try {
    const orderId = await createOrder(data)
    return orderId
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}
export async function getOrdersAction(options: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  try {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const offset = (page - 1) * limit;

    // Direct call to MySQL logic
    const { orders, totalCount } = await getOrdersMySQL({
      ...options,
      status: options.status === 'all' ? undefined : options.status, // Ensure 'all' is treated as undefined
      paymentStatus: options.paymentStatus === 'all' ? undefined : options.paymentStatus,
      limit,
      offset
    });

    return {
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getOrderStatsAction() {
  try {
    return await getOrderStatsMySQL();
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 };
  }
}

export async function trackOrderAction(orderNumber: string, email: string) {
  try {
    const cleanOrderNum = orderNumber.replace('#', '').trim();
    const { orders } = await getOrdersAction({ search: cleanOrderNum, limit: 100 });

    // Filter by email match strictly
    const order = orders.find((o: any) =>
      (o.orderNumber === cleanOrderNum || o.id === orderNumber) &&
      o?.customerEmail?.toLowerCase() === email.toLowerCase()
    );

    if (!order) return null;

    // Format for UI (already formatted by getOrdersAction, but let's ensure structure)
    return {
      ...order,
      createdAt: order.createdAt,
      trackingUrl: null
    };
  } catch (e) {
    return null;
  }
}

import { query } from "@/lib/db";

// ... existing code ...

export async function exportOrdersAction() {
  try {
    const sql = `
      SELECT 
        o.id, o.created_at, o.status, o.total, o.shipping_cost,
        CONCAT(COALESCE(o.billing_first_name, ''), ' ', COALESCE(o.billing_last_name, '')) as customer_name,
        o.customer_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      ORDER BY o.created_at DESC
    `;

    const rows = await query(sql);

    const header = [
      'Order ID',
      'Date',
      'Status',
      'Customer Name',
      'Customer Email',
      'Items Count',
      'Total',
      'Shipping',
      'Currency'
    ];

    const csvRows = rows.map((r: any) => {
      const dateStr = r.created_at instanceof Date
        ? r.created_at.toISOString()
        : new Date(r.created_at).toISOString();

      return [
        r.id,
        dateStr,
        r.status,
        `"${r.customer_name?.trim() || 'Guest'}"`,
        r.customer_email || '',
        r.item_count,
        r.total,
        r.shipping_cost,
        'USD'
      ].join(',');
    });

    const csvContent = [header.join(','), ...csvRows].join('\n');
    return { csv: csvContent, filename: `store-report-${new Date().toISOString().split('T')[0]}.csv` };

  } catch (error: any) {
    console.error("Export Action Error:", error);
    return { error: `Failed to generate export: ${error.message || error}` };
  }
}
