
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

  return rows.map((r: any) => ({
    date: r.date.toISOString().split('T')[0],
    revenue: Number(r.revenue),
    orders: Number(r.orders)
  }));
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
             CONCAT(o.first_name, ' ', o.last_name) as customerName 
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
