
import { createPool } from 'mysql2/promise';

async function checkData() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('Checking DB data...', dbUrl ? 'Using DATABASE_URL' : 'Using env vars');

  const config = dbUrl ? { uri: dbUrl } : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  const pool = createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // Check connection
    const [now]: any = await pool.query('SELECT NOW() as now');
    console.log('DB Connection successful:', now[0].now);

    // 1. Orders Count
    const [ordersCount]: any = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log('Total Orders in DB:', ordersCount[0].count);

    if (ordersCount[0].count > 0) {
      // Check Order Statuses
      const [orderStatuses]: any = await pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
      console.log('Order Statuses:', orderStatuses);

      // Check Payment Statuses
      const [paymentStatuses]: any = await pool.query('SELECT payment_status, COUNT(*) as count FROM orders GROUP BY payment_status');
      console.log('Payment Statuses:', paymentStatuses);
    }

    // 2. Products Count
    const [productsCount]: any = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('Total Products in DB:', productsCount[0].count);

    if (productsCount[0].count > 0) {
      // Check Product Statuses
      const [productStatuses]: any = await pool.query('SELECT status, COUNT(*) as count FROM products GROUP BY status');
      console.log('Product Statuses:', productStatuses);
    }

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await pool.end();
  }
}

checkData();
