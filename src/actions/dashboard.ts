
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
      topCustomersResult,
      b2bPendingResult
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
        SELECT o.customer_email, MAX(c.id) as customer_id, MAX(o.shipping_first_name) as shipping_first_name, MAX(o.shipping_last_name) as shipping_last_name, COUNT(*) as order_count, SUM(o.total) as total_spent
        FROM orders o
        LEFT JOIN customers c ON o.customer_email = c.email
        WHERE o.payment_status = 'paid'
        GROUP BY o.customer_email
        ORDER BY total_spent DESC
        LIMIT 5
      `),
      query("SELECT COUNT(*) as count FROM b2b_applications WHERE status = 'pending'")
    ]);

    return {
      totalRevenue: Number(revenueResult[0]?.total || 0),
      totalOrders: Number(ordersResult[0]?.count || 0),
      totalProducts: Number(productsResult[0]?.count || 0),
      pendingOrders: Number(pendingOrdersResult[0]?.count || 0),
      pendingB2BApplications: Number(b2bPendingResult[0]?.count || 0),
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
        id: c.customer_id,
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

import { getAnalyticsUsageAction } from "@/actions/analytics";

export async function exportDashboardAction() {
  try {
    const [stats, analytics] = await Promise.all([
      getDashboardStatsAction(),
      getAnalyticsUsageAction()
    ]);

    // 1. Summary Stats
    const summaryRows = [
      ['DASHBOARD REPORT'],
      [`Generated at: ${new Date().toLocaleString()}`],
      [''],
      ['SUMMARY STATS'],
      ['Metric', 'Value'],
      ['Total Revenue', `$${stats.totalRevenue.toFixed(2)}`],
      ['Total Orders', stats.totalOrders],
      ['Active Products', stats.totalProducts],
      ['Pending Orders', stats.pendingOrders],
      [''],
    ];

    // 2. Sales Analytics
    const analyticsHeader = ['SALES ANALYTICS (Last 30 Days)'];
    const analyticsColumns = ['Date', 'Orders', 'Revenue'];
    const salesData = Array.isArray(analytics.sales) ? analytics.sales : [];
    const analyticsRows = salesData.map((day: any) => [
      day.name,
      day.orders,
      `$${Number(day.revenue).toFixed(2)}`
    ]);

    // 3. Recent Orders
    const recentOrdersHeader = ['RECENT ORDERS'];
    const recentOrdersColumns = ['ID', 'Date', 'Customer', 'Status', 'Total'];
    const recentOrdersRows = stats.recentOrders.map((o: any) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName}"`,
      o.status,
      `$${o.total.toFixed(2)}`
    ]);

    // 4. Top Customers
    const topCustomersHeader = ['TOP CUSTOMERS'];
    const topCustomersColumns = ['Name', 'Email', 'Orders', 'Total Spent'];
    const topCustomersRows = stats.topCustomers.map((c: any) => [
      `"${c.name}"`,
      c.email,
      c.orders,
      `$${c.totalSpent.toFixed(2)}`
    ]);

    // 5. Low Stock Alerts
    const lowStockHeader = ['LOW STOCK ALERTS'];
    const lowStockColumns = ['Product', 'Stock Remaining'];
    const lowStockRows = stats.inventoryAlerts.map((p: any) => [
      `"${p.title}"`,
      p.stock
    ]);

    // Combine all sections with spacing
    const csvContent = [
      // Summary
      ...summaryRows.map(r => r.join(',')),

      // Analytics
      analyticsColumns.join(','),
      ...analyticsRows.map(r => r.join(',')),
      '',

      // Recent Orders
      recentOrdersHeader.join(','),
      recentOrdersColumns.join(','),
      ...recentOrdersRows.map(r => r.join(',')),
      '',

      // Top Customers
      topCustomersHeader.join(','),
      topCustomersColumns.join(','),
      ...topCustomersRows.map(r => r.join(',')),
      '',

      // Low Stock
      lowStockHeader.join(','),
      lowStockColumns.join(','),
      ...lowStockRows.map(r => r.join(','))
    ].join('\n');

    return {
      csv: csvContent,
      filename: `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`
    };

  } catch (error: any) {
    console.error("Dashboard Export Error:", error);
    return { error: `Failed to export dashboard data: ${error.message}` };
  }
}
