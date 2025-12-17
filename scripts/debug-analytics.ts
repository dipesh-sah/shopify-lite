
import { createPool } from 'mysql2/promise';

async function debugAnalytics() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL found");
    return;
  }
  const pool = createPool({ uri: dbUrl });

  try {
    console.log("--- DEBUGGING ANALYTICS ---");

    // 1. Check Orders Count in last 30 days
    const [recentOrders]: any = await pool.query(`
        SELECT COUNT(*) as count FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    console.log("Orders in last 30 days:", recentOrders[0].count);

    // 2. Run the exact Sales Chart Query
    const salesSql = `
        SELECT 
        DATE(created_at) as date, 
        SUM(total) as revenue, 
        COUNT(*) as orders 
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status != 'cancelled'
        GROUP BY DATE(created_at) 
        ORDER BY date ASC
    `;
    const [salesRows]: any = await pool.query(salesSql);
    console.log("Sales Query Rows:", salesRows);

    // 3. Check Order Items
    const [itemCount]: any = await pool.query("SELECT COUNT(*) as count FROM order_items");
    console.log("Total Order Items:", itemCount[0].count);

    // 4. Run Top Products query
    const topProdSql = `
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
        LIMIT 5
    `;
    const [topProdRows]: any = await pool.query(topProdSql);
    console.log("Top Products Rows:", topProdRows);

  } catch (error) {
    console.error("DEBUG ERROR:", error);
  } finally {
    await pool.end();
  }
}

debugAnalytics();
