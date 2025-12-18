
import { createSegment } from '../src/lib/segments';

const segments = [
  {
    name: 'VIP Customers',
    description: 'High value customers with 5+ orders and $500+ spend',
    query: JSON.stringify({
      type: 'container',
      operator: 'AND',
      children: [
        { type: 'condition', field: 'orders_count', operator: 'gte', value: 5 },
        { type: 'condition', field: 'total_spent', operator: 'gte', value: 500 }
      ]
    })
  },
  {
    name: 'New Customers',
    description: 'First time buyers',
    query: JSON.stringify({
      type: 'container',
      operator: 'AND',
      children: [
        { type: 'condition', field: 'orders_count', operator: 'equals', value: 1 }
      ]
    })
  },
  {
    name: 'Local Shoppers (US)',
    description: 'Customers from the United States',
    query: JSON.stringify({
      type: 'container',
      operator: 'AND',
      children: [
        { type: 'condition', field: 'country_code', operator: 'equals', value: 'US' }
      ]
    })
  }
];

async function seed() {
  console.log('Seeding customer segments...');
  for (const seg of segments) {
    try {
      await createSegment(seg);
      console.log(`Created segment: ${seg.name}`);
    } catch (e: any) {
      console.error(`Failed to create ${seg.name}`);
      console.error('Message:', e.message);
      console.error('SQL Message:', e.sqlMessage);
      console.error('Code:', e.code);
    }
  }
}

seed();
