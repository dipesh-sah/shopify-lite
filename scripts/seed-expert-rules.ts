
import { createRule } from '../src/lib/rules/service';
import { RulePayload } from '../src/lib/rules/engine';

async function seed() {
  console.log('Seeding Expert Rules...');

  // 1. Heavy Goods Surcharge
  // cart.weight > 50 AND customer.group != VIP
  const heavyGoodsPayload: RulePayload = {
    id: 'root',
    type: 'container',
    operator: 'AND',
    children: [
      {
        id: 'c1',
        type: 'condition',
        field: 'cart.weight',
        operator: 'gt',
        value: '50'
      },
      {
        id: 'c2',
        type: 'condition',
        field: 'customer.group',
        operator: 'neq',
        value: 'VIP'
      }
    ]
  };

  // 2. High Risk Order Prevention
  // customer.group == Guest AND (cart.total > 1000 OR email contains @tempmail.com)
  const highRiskPayload: RulePayload = {
    id: 'root',
    type: 'container',
    operator: 'AND',
    children: [
      {
        id: 'c1',
        type: 'condition',
        field: 'customer.group',
        operator: 'eq',
        value: 'Guest'
      },
      {
        id: 'group_or',
        type: 'container',
        operator: 'OR',
        children: [
          {
            id: 'c2',
            type: 'condition',
            field: 'cart.total',
            operator: 'gt',
            value: '1000'
          },
          {
            id: 'c3',
            type: 'condition',
            field: 'customer.email',
            operator: 'contains',
            value: '@tempmail.com'
          }
        ]
      }
    ]
  };

  // 3. Evening Flash Sale
  // product.category IN [Electronics] AND current_time > 18
  const flashSalePayload: RulePayload = {
    id: 'root',
    type: 'container',
    operator: 'AND',
    children: [
      {
        id: 'c1',
        type: 'condition',
        field: 'product.category',
        operator: 'in', // simulating ID check with name for clarity
        value: 'Electronics,Computers'
      },
      {
        id: 'c2',
        type: 'condition',
        field: 'current_time',
        operator: 'gt',
        value: '18'
      }
    ]
  };

  try {
    await createRule({
      name: 'Heavy Goods Surcharge',
      description: 'Extra fee for orders over 50kg (non-VIP).',
      priority: 50,
      module_type: 'payment',
      is_active: true,
      payload: heavyGoodsPayload
    });
    console.log('Created: Heavy Goods Surcharge');

    await createRule({
      name: 'High Risk Order Block',
      description: 'Block COD for likely fraud attempts.',
      priority: 90,
      module_type: 'payment',
      is_active: true,
      payload: highRiskPayload
    });
    console.log('Created: High Risk Order Block');

    await createRule({
      name: 'Evening Flash Sale',
      description: '20% off electronics after 6 PM.',
      priority: 20,
      module_type: 'promotion',
      is_active: true,
      payload: flashSalePayload
    });
    console.log('Created: Evening Flash Sale');

  } catch (error) {
    console.error('Failed to create rules:', error);
  }
}

seed();
