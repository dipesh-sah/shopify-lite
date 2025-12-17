
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verify() {
  console.log('Verifying Shipping Feature...');
  const { calculateShipping } = await import('../src/lib/shipping');
  const { createOrderMySQL } = await import('../src/lib/orders');

  // 1. Test Calculation
  console.log('Testing Calculation...');
  const rates = await calculateShipping('US', 5, 50);
  console.log('Rates for US (5kg, $50):', rates);

  if (rates.length === 0) {
    console.warn('No rates found. Ensure DB is seeded.');
  }

  // 2. Test Order Creation
  const orderData = {
    userId: 'test-user-ship',
    customerEmail: 'shipping-test@example.com',
    items: [
      { productId: '1', quantity: 1, price: 50, title: 'Test Product' }
    ],
    total: 50, // Subtotal
    shippingAddress: {
      firstName: 'Test', lastName: 'User', address1: '123 St', city: 'NY', zip: '10001', country: 'US'
    },
    shippingMethodId: rates[0]?.rateId || null, // Use first available rate
    shippingCost: rates[0]?.cost ? parseFloat(rates[0].cost) : 10
  };

  console.log('Creating Order with shipping cost:', orderData.shippingCost);

  try {
    // Stub pool for isolated run or ensure db connection works in lib
    // The lib/orders.ts uses 'pool' from lib/db.ts. 
    // If we run this script with bun, it should work if lib/db.ts initializes connection correctly using env vars.

    const orderId = await createOrderMySQL(orderData);
    console.log('Order Created:', orderId);

    const conn = await createConnection(process.env.DATABASE_URL!);
    const [rows]: any = await conn.execute('SELECT shipping_method_id, shipping_cost, total FROM orders WHERE id = ?', [orderId]);
    console.log('Order DB Data:', rows[0]);

    await conn.end();

    if (rows[0].shipping_cost == orderData.shippingCost) {
      console.log('SUCCESS: Shipping cost saved correctly.');
    } else {
      console.error('FAILURE: Shipping cost mismatch.');
    }

  } catch (e) {
    console.error('Order Creation Failed:', e);
  }

  process.exit(0);
}

verify();
