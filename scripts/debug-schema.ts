
import { createPool } from 'mysql2/promise';

async function checkSchema() {
  const dbUrl = process.env.DATABASE_URL;
  const config = dbUrl ? { uri: dbUrl } : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  const pool = createPool({ ...config, waitForConnections: true, connectionLimit: 1 });

  try {
    console.log('--- Orders Table ---');
    const [ordersCols]: any = await pool.query('DESCRIBE orders');
    ordersCols.forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

    console.log('\n--- Products Table ---');
    const [productsCols]: any = await pool.query('DESCRIBE products');
    productsCols.forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSchema();
