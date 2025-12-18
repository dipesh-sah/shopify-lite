
import { getCustomers } from '../src/lib/customers';
import { query } from '../src/lib/db';

async function main() {
  try {
    console.log('Calling getCustomers...');
    const result = await getCustomers({ limit: 5 });
    console.log('Total Count:', result.totalCount);
    console.log('Customers Found:', result.customers.length);
    if (result.customers.length > 0) {
      console.log('First Customer:', JSON.stringify(result.customers[0], null, 2));
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
  }
}

main();
