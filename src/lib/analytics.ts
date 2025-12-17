
import { query } from './db';

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  title: string;
  sold: number;
  revenue: number;
}

export async function getSalesOverTime(days: number = 30): Promise<SalesData[]> {
  const sql = `
    SELECT 
      DATE(created_at) as date, 
      SUM(total) as revenue, 
      COUNT(*) as orders 
    FROM orders 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND status != 'cancelled'
    GROUP BY DATE(created_at) 
    ORDER BY date ASC
  `;

  const rows = await query(sql, [days]);
  console.log("getSalesOverTime ROWS:", rows);

  const salesMap = new Map();
  rows.forEach((r: any) => {
    // Standardize date key
    const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
    console.log("Mapping Data Key:", dateStr, "Revenue:", r.revenue);
    salesMap.set(dateStr, {
      revenue: Number(r.revenue),
      orders: Number(r.orders)
    });
  });

  const results: SalesData[] = [];
  const today = new Date();

  // Generate last 30 days including today
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];

    const data = salesMap.get(dateKey) || { revenue: 0, orders: 0 };
    // console.log("Checking Key:", dateKey, "Found:", !!salesMap.get(dateKey));
    results.push({
      date: dateKey,
      revenue: data.revenue,
      orders: data.orders
    });
  }

  return results;
}

export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
  const sql = `
    SELECT 
      p.id,
      p.title, 
      SUM(oi.quantity) as sold, 
      SUM(oi.price * oi.quantity) as revenue 
    FROM order_items oi 
    JOIN products p ON oi.product_id = p.id 
    JOIN orders o ON oi.order_id = o.id 
    WHERE o.status != 'cancelled'
    GROUP BY p.id, p.title
    ORDER BY sold DESC 
    LIMIT ?
  `;

  const rows = await query(sql, [limit]);

  return rows.map((r: any) => ({
    id: r.id.toString(),
    title: r.title,
    sold: Number(r.sold),
    revenue: Number(r.revenue)
  }));
}

export async function getRecentOrders(limit: number = 10) {
  const sql = `
      SELECT o.*, 
             CONCAT(o.shipping_first_name, ' ', o.shipping_last_name) as customerName 
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
  const rows = await query(sql, [limit]);
  return rows.map((r: any) => ({
    ...r,
    id: r.id.toString(),
    total: Number(r.total)
  }));
}
