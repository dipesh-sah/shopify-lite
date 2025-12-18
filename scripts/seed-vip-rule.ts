
import { createRule } from '../src/lib/rules/service';
import { RulePayload } from '../src/lib/rules/engine';

async function seed() {
  console.log('Seeding VIP Rule...');

  const payload: RulePayload = {
    id: 'root',
    type: 'container',
    operator: 'AND',
    children: [
      {
        id: 'c1',
        type: 'condition',
        field: 'customer.group',
        operator: 'eq',
        value: 'VIP'
      },
      {
        id: 'c2',
        type: 'condition',
        field: 'shippingAddress.country',
        operator: 'eq',
        value: 'US'
      },
      {
        id: 'group_or',
        type: 'container',
        operator: 'OR',
        children: [
          {
            id: 'c3',
            type: 'condition',
            field: 'cart.total',
            operator: 'gte',
            value: '500'
          },
          {
            id: 'c4',
            type: 'condition',
            field: 'cart.lineItems.count',
            operator: 'gt',
            value: '10'
          }
        ]
      }
    ]
  };

  try {
    const id = await createRule({
      name: 'VIP Power Shopper - Domestic',
      description: 'High-value transactions from VIP customers in the US.',
      priority: 100,
      module_type: 'promotion',
      is_active: true,
      payload
    });
    console.log(`Rule created successfully with ID: ${id}`);
  } catch (error) {
    console.error('Failed to create rule:', error);
  }
}

seed();
