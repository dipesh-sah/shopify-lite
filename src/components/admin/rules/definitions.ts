
import { ConditionOperator } from "@/lib/rules/engine";

export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'date';

export interface FieldDefinition {
  label: string;
  type: FieldType;
  operators: ConditionOperator[];
  options?: { label: string; value: any }[]; // For 'select' type
}

export const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  'cart.total': {
    label: 'Cart Total Amount',
    type: 'number',
    operators: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte']
  },
  'cart.lineItems.count': {
    label: 'Cart Item Count',
    type: 'number',
    operators: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte']
  },
  'order.shippingMethod': {
    label: 'Shipping Method',
    type: 'string',
    operators: ['eq', 'neq', 'contains']
  },
  'order.paymentMethod': {
    label: 'Payment Method',
    type: 'string',
    operators: ['eq', 'neq']
  },
  'order.currency': {
    label: 'Currency',
    type: 'string',
    operators: ['eq', 'neq']
  },
  'product.price': {
    label: 'Product Price',
    type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'eq']
  },
  'product.stock': {
    label: 'Product Stock',
    type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'eq']
  },
  'product.category': {
    label: 'Product Category ID',
    type: 'string',
    operators: ['eq', 'neq', 'in']
  },
  'product.tags': {
    label: 'Product Tags',
    type: 'string',
    operators: ['contains', 'not_contains']
  },
  'customer.email': {
    label: 'Customer Email',
    type: 'string',
    operators: ['eq', 'neq', 'contains', 'ends_with']
  },
  'customer.group': {
    label: 'Customer Group',
    type: 'string',
    operators: ['eq', 'neq']
  },
  'customer.acceptsMarketing': {
    label: 'Customer Accepts Marketing',
    type: 'boolean',
    operators: ['eq']
  },
  'customer.totalSpent': {
    label: 'Customer Total Spent',
    type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte']
  },
  'customer.ordersCount': {
    label: 'Customer Total Orders',
    type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte']
  },
  'shippingAddress.country': {
    label: 'Shipping Country',
    type: 'string',
    operators: ['eq', 'neq', 'in']
  },
  'cart.weight': {
    label: 'Total Cart Weight',
    type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'eq']
  },
  'context.salesChannelId': {
    label: 'Sales Channel',
    type: 'string', // In real app, this would be a select with dynamic options
    operators: ['eq', 'neq']
  },
  'current_time': {
    label: 'Current Time (Hour)',
    type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'eq']
  }
};

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: 'Equals',
  neq: 'Does not equal',
  gt: 'Greater than',
  lt: 'Less than',
  gte: 'Greater than or equal to',
  lte: 'Less than or equal to',
  contains: 'Contains',
  not_contains: 'Does not contain',
  in: 'Is one of',
  not_in: 'Is not one of',
  starts_with: 'Starts with',
  ends_with: 'Ends with'
};
