
'use server'

import { query } from "@/lib/db";

export async function getDashboardStatsAction() {
  try {
    const [
      revenueResult,
      ordersResult,
      productsResult,
      pendingOrdersResult,
      recentOrdersResult
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
      }))
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error("Failed to load dashboard statistics");
  }
}
