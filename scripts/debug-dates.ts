
import { createPool } from 'mysql2/promise';

async function checkDates() {
  const dbUrl = process.env.DATABASE_URL;
  const pool = createPool({ uri: dbUrl });

  try {
    const [rows]: any = await pool.query(`
      SELECT id, created_at, status 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('Recent Orders:', rows);

    const [chartData]: any = await pool.query(`
      SELECT 
        DATE(created_at) as date, 
        SUM(total) as revenue, 
        COUNT(*) as orders 
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);
    console.log('Chart Query Result:', chartData);

    const [now]: any = await pool.query('SELECT NOW() as now');
    console.log('DB Now:', now[0].now);

  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkDates();
