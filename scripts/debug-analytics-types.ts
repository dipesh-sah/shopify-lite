
import { createPool } from 'mysql2/promise';

async function debugTypes() {
  const dbUrl = process.env.DATABASE_URL;
  const pool = createPool({ uri: dbUrl });

  try {
    console.log("--- DEBUG TYPES ---");

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
        LIMIT 1
    `;
    const [rows]: any = await pool.query(salesSql);

    if (rows.length > 0) {
      const r = rows[0];
      console.log("Row:", r);
      console.log("Type of date:", typeof r.date);
      console.log("Is Date instance?", r.date instanceof Date);
      console.log("Value of date:", r.date);
      console.log("Type of revenue:", typeof r.revenue);
      console.log("Value of revenue:", r.revenue);

      // Test parsing
      const dateObj = new Date(r.date);
      console.log("Parsed Date:", dateObj);
      console.log("Parsed ISO:", dateObj.toISOString());
    } else {
      console.log("No sales rows found.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

debugTypes();
