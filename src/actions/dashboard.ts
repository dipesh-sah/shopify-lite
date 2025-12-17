
'use server'

import { query } from "@/lib/db";

export async function getDashboardStatsAction() {
  try {
    const [
      revenueResult,
      ordersResult,
      productsResult,
      pendingOrdersResult,
      recentOrdersResult,
      lowStockResult,
      topCustomersResult
    ] = await Promise.all([
      query("SELECT SUM(total) as total FROM orders WHERE payment_status = 'paid'"),
      query("SELECT COUNT(*) as count FROM orders"),
      query("SELECT COUNT(*) as count FROM products WHERE status = 'active'"),
      query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      query(`
        SELECT id, total, created_at, status, customer_email, shipping_first_name, shipping_last_name 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 5
      `),
      query(`
        SELECT id, title, quantity as inventory_quantity 
        FROM products 
        WHERE quantity < 10 
        ORDER BY quantity ASC 
        LIMIT 5
      `),
      query(`
        SELECT customer_email, MAX(shipping_first_name) as shipping_first_name, MAX(shipping_last_name) as shipping_last_name, COUNT(*) as order_count, SUM(total) as total_spent
        FROM orders
        WHERE payment_status = 'paid'
        GROUP BY customer_email
        ORDER BY total_spent DESC
        LIMIT 5
      `)
    ]);

    return {
      totalRevenue: Number(revenueResult[0]?.total || 0),
      totalOrders: Number(ordersResult[0]?.count || 0),
      totalProducts: Number(productsResult[0]?.count || 0),
      pendingOrders: Number(pendingOrdersResult[0]?.count || 0),
      recentOrders: recentOrdersResult.map((o: any) => ({
        id: o.id,
        total: Number(o.total),
        status: o.status,
        customerEmail: o.customer_email,
        customerName: o.shipping_first_name && o.shipping_last_name
          ? `${o.shipping_first_name} ${o.shipping_last_name}`
          : o.customer_email,
        createdAt: o.created_at
      })),
      inventoryAlerts: lowStockResult.map((p: any) => ({
        id: p.id,
        title: p.title,
        stock: p.inventory_quantity
      })),
      topCustomers: topCustomersResult.map((c: any) => ({
        email: c.customer_email,
        name: c.shipping_first_name ? `${c.shipping_first_name} ${c.shipping_last_name}` : c.customer_email,
        orders: c.order_count,
        totalSpent: Number(c.total_spent)
      }))
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to load dashboard statistics");
  }
}
