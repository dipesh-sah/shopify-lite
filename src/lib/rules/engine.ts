
import { get } from 'lodash';

// --- Types ---

export type RuleOperator = 'AND' | 'OR';

export type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'lt' | 'gte' | 'lte'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'
  | 'starts_with' | 'ends_with';

export type RuleCondition = {
  id: string; // Unique ID for UI rendering
  type: 'container' | 'condition';

  // For Container
  operator?: RuleOperator;
  children?: RuleCondition[];

  // For Condition
  field?: string;
  conditionOperator?: ConditionOperator;
  value?: any;
};

export type RulePayload = RuleCondition; // Root is always a condition (usually a container)

export interface RuleContext {
  cart?: any;
  customer?: any;
  order?: any;
  items?: any[];
  [key: string]: any; // Allow custom context fields
}

// --- Engine ---

export class RuleEngine {
  /**
   * Evaluates a rule payload against a given context.
   */
  static evaluate(payload: RulePayload, context: RuleContext): boolean {
    if (!payload) return false;
    return this.evaluateRecursive(payload, context);
  }

  private static evaluateRecursive(node: RuleCondition, context: RuleContext): boolean {
    if (node.type === 'container') {
      if (!node.children || node.children.length === 0) return true; // Empty container is true? Or false? usually true (no restrictions)

      if (node.operator === 'AND') {
        return node.children.every(child => this.evaluateRecursive(child, context));
      } else if (node.operator === 'OR') {
        return node.children.some(child => this.evaluateRecursive(child, context));
      }
      return false;
    } else {
      // Leaf Condition
      return this.evaluateCondition(node, context);
    }
  }

  private static evaluateCondition(condition: RuleCondition, context: RuleContext): boolean {
    const { field, conditionOperator, value } = condition;

    if (!field || !conditionOperator) return false;

    // Resolve field value from context using lodash.get for nested paths (e.g. 'cart.total')
    // We can implement a simple dot-notation getter if we want to avoid lodash dep, but usually handy.
    const actualValue = this.resolveValue(context, field);

    return this.compare(actualValue, conditionOperator, value);
  }

  private static resolveValue(context: RuleContext, path: string): any {
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, context);
  }

  private static compare(actual: any, operator: ConditionOperator, expected: any): boolean {
    // Handle numeric comparisons safely
    if (['gt', 'lt', 'gte', 'lte'].includes(operator)) {
      const numActual = Number(actual);
      const numExpected = Number(expected);
      if (isNaN(numActual) || isNaN(numExpected)) return false;

      switch (operator) {
        case 'gt': return numActual > numExpected;
        case 'lt': return numActual < numExpected;
        case 'gte': return numActual >= numExpected;
        case 'lte': return numActual <= numExpected;
      }
    }

    switch (operator) {
      case 'eq': return actual == expected; // Loose equality for flexibility ( "1" == 1 )
      case 'neq': return actual != expected;

      case 'contains':
        if (Array.isArray(actual)) return actual.includes(expected);
        if (typeof actual === 'string') return actual.includes(expected);
        return false;

      case 'not_contains':
        if (Array.isArray(actual)) return !actual.includes(expected);
        if (typeof actual === 'string') return !actual.includes(expected);
        return true;

      case 'in':
        if (Array.isArray(expected)) return expected.includes(actual);
        return false;

      case 'not_in':
        if (Array.isArray(expected)) return !expected.includes(actual);
        return true;

      case 'starts_with':
        return typeof actual === 'string' && actual.startsWith(expected);

      case 'ends_with':
        return typeof actual === 'string' && actual.endsWith(expected);

      default:
        return false;
    }
  }
}
