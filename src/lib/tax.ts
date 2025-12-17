
import { query, execute } from './db';
import { getTaxSettings } from './settings';

export interface TaxClass {
  id: number;
  name: string;
  is_default: boolean;
}

export interface TaxRule {
  id: number;
  name: string;
  tax_class_id: number;
  country_code: string;
  state_code: string | null;
  zip_code: string | null;
  rate: number;
  priority: number;
  is_compound: boolean;
  is_shipping: boolean;
}

export interface TaxCalculationResult {
  taxTotal: number;
  items: Array<{
    lineItemId?: string; // Optional if calculating for cart items without IDs yet
    productId: string;
    variantId?: string;
    taxAmount: number;
    taxRate: number;
    taxBreakdown: TaxBreakdownLine[];
  }>;
  shippingTax: number;
  shippingTaxRate: number; // Effective rate
  taxBreakdown: TaxBreakdownLine[]; // Summary breakdown
  pricesIncludeTax: boolean;
}

export interface TaxBreakdownLine {
  title: string;
  amount: number;
  rate: number;
}

// --- Tax Classes ---

export async function getTaxClasses() {
  const rows = await query('SELECT * FROM tax_classes');
  return rows.map((r: any) => ({
    ...r,
    is_default: !!r.is_default
  }));
}

export async function createTaxClass(name: string, isDefault: boolean = false) {
  if (isDefault) {
    await execute('UPDATE tax_classes SET is_default = 0');
  }
  return execute('INSERT INTO tax_classes (name, is_default) VALUES (?, ?)', [name, isDefault]);
}

export async function updateTaxClass(id: number, name: string, isDefault: boolean) {
  if (isDefault) {
    await execute('UPDATE tax_classes SET is_default = 0');
  }
  return execute('UPDATE tax_classes SET name = ?, is_default = ? WHERE id = ?', [name, isDefault, id]);
}

export async function deleteTaxClass(id: number) {
  return execute('DELETE FROM tax_classes WHERE id = ?', [id]);
}

// --- Tax Rules ---

export async function getTaxRules() {
  const rows = await query(`
    SELECT tr.*, tc.name as tax_class_name 
    FROM tax_rules tr 
    JOIN tax_classes tc ON tr.tax_class_id = tc.id
    ORDER BY tr.priority ASC
  `);
  return rows.map((r: any) => ({
    ...r,
    rate: Number(r.rate),
    is_compound: !!r.is_compound,
    is_shipping: !!r.is_shipping
  }));
}

export async function createTaxRule(data: Omit<TaxRule, 'id'>) {
  return execute(
    `INSERT INTO tax_rules (name, tax_class_id, country_code, state_code, zip_code, rate, priority, is_compound, is_shipping) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.tax_class_id, data.country_code, data.state_code || null, data.zip_code || null,
      data.rate, data.priority, data.is_compound, data.is_shipping
    ]
  );
}

export async function updateTaxRule(id: number, data: Partial<TaxRule>) {
  // Build query dynamically
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.tax_class_id !== undefined) { updates.push('tax_class_id = ?'); values.push(data.tax_class_id); }
  if (data.country_code !== undefined) { updates.push('country_code = ?'); values.push(data.country_code); }
  if (data.state_code !== undefined) { updates.push('state_code = ?'); values.push(data.state_code || null); }
  if (data.zip_code !== undefined) { updates.push('zip_code = ?'); values.push(data.zip_code || null); }
  if (data.rate !== undefined) { updates.push('rate = ?'); values.push(data.rate); }
  if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
  if (data.is_compound !== undefined) { updates.push('is_compound = ?'); values.push(data.is_compound); }
  if (data.is_shipping !== undefined) { updates.push('is_shipping = ?'); values.push(data.is_shipping); }

  if (updates.length === 0) return;

  values.push(id);
  return execute(`UPDATE tax_rules SET ${updates.join(', ')} WHERE id = ?`, values);
}

export async function deleteTaxRule(id: number) {
  return execute('DELETE FROM tax_rules WHERE id = ?', [id]);
}

// --- Calculation ---

interface ItemForTax {
  lineItemId?: string;
  productId: string;
  variantId?: string;
  taxClassId?: number; // If known, otherwise fetched
  price: number; // Unit price
  quantity: number;
}

interface AddressForTax {
  country: string;
  state?: string;
  zip?: string;
}

export async function calculateOrderTax(
  items: ItemForTax[],
  address: AddressForTax,
  shippingCost: number = 0
): Promise<TaxCalculationResult> {
  const settings = await getTaxSettings();

  if (!settings.taxEnabled) {
    return {
      taxTotal: 0,
      items: items.map(i => ({
        lineItemId: i.lineItemId,
        productId: i.productId,
        variantId: i.variantId,
        taxAmount: 0,
        taxRate: 0,
        taxBreakdown: []
      })),
      shippingTax: 0,
      shippingTaxRate: 0,
      taxBreakdown: [],
      pricesIncludeTax: false
    };
  }

  const pricesIncludeTax = settings.pricesIncludeTax || false;

  // 1. Fetch all Rules sorted by Priority ASC
  const allRulesRaw = await query('SELECT * FROM tax_rules ORDER BY priority ASC');
  const allRules: TaxRule[] = allRulesRaw.map((r: any) => ({
    ...r,
    rate: Number(r.rate),
    is_compound: !!r.is_compound,
    is_shipping: !!r.is_shipping
  }));

  // 2. Filter Rules by Address
  const applicableRules = allRules.filter(rule => {
    // Country Check
    const ruleCountries = rule.country_code ? rule.country_code.split(',').map((c: string) => c.trim().toUpperCase()) : ['*'];
    if (!ruleCountries.includes('*') && !ruleCountries.includes(address.country.toUpperCase())) return false;

    // State Check
    if (rule.state_code) {
      const ruleStates = rule.state_code.split(',').map((s: string) => s.trim().toUpperCase());
      const userState = (address.state || '').toUpperCase();
      if (!ruleStates.includes('*') && !ruleStates.includes(userState)) return false;
    }

    // Zip Check (Exact, Wildcard, or List)
    if (rule.zip_code) {
      const ruleZips = rule.zip_code.split(',').map((z: string) => z.trim());
      // Check if ANY zip matches
      const match = ruleZips.some((rZip: string) => {
        if (rZip === '*') return true;
        if (rZip.includes('*')) {
          const prefix = rZip.replace('*', '');
          return address.zip && address.zip.startsWith(prefix);
        }
        return rZip === address.zip;
      });
      if (!match) return false;
    }
    return true;
  });

  // 3. Fetch Product Tax Classes if not provided
  const itemsWithClass = [...items];
  const missingClassItems = items.filter(i => i.taxClassId === undefined);

  if (missingClassItems.length > 0) {
    const pIds = missingClassItems.map(i => i.productId);
    const placeholders = pIds.map(() => '?').join(',');
    // Fetch product tax class. If null, use Default class.

    // Get default class id first
    const defaultClassRows = await query('SELECT id FROM tax_classes WHERE is_default = 1 LIMIT 1');
    const defaultClassId = defaultClassRows && defaultClassRows.length > 0 ? defaultClassRows[0].id : null;

    const products = await query(`SELECT id, tax_class_id FROM products WHERE id IN (${placeholders})`, pIds);
    const pMap: Record<string, number> = {};
    products.forEach((p: any) => {
      pMap[p.id.toString()] = p.tax_class_id || defaultClassId;
    });

    itemsWithClass.forEach(i => {
      if (i.taxClassId === undefined) {
        i.taxClassId = pMap[i.productId];
      }
    });
  } else {
    // If all provided, ensure we handle missing ones with default?
    // Assume caller handles or we do a quick check? 
    // For safety, let's fetch default ID in case items pass explicit null/undefined
    const defaultClassRows = await query('SELECT id FROM tax_classes WHERE is_default = 1 LIMIT 1');
    const defaultClassId = defaultClassRows && defaultClassRows.length > 0 ? defaultClassRows[0].id : 0;
    itemsWithClass.forEach(i => {
      if (!i.taxClassId) i.taxClassId = defaultClassId;
    });
  }

  // 4. Calculate Tax
  const result: TaxCalculationResult = {
    taxTotal: 0,
    items: [],
    shippingTax: 0,
    shippingTaxRate: 0,
    taxBreakdown: [],
    pricesIncludeTax: false
  };

  const globalBreakdown: Record<string, { amount: number, rate: number }> = {};

  // For Shipping
  let shippingTotalRate = 0;
  let shippingTaxAmount = 0;
  // Shipping typically follows "Standard" tax class OR specific rules marked is_shipping? 
  // Requirement: "Tax system should allow... toggle taxes on or off for... shipping?" 
  // Common pattern: Shipping inherits tax rate of products (proportional) OR has its own rules.
  // Our schema has `is_shipping` flag on Rules. This suggests rules specifically targeting shipping.
  // HOWEVER, typically shipping taxes depend on destination.
  // Let's assume: If a rule matches destination AND has `is_shipping=true`, it applies to shipping.
  // If NO rules have `is_shipping=true` for this Destination, maybe shipping is non-taxable?
  // Or maybe shipping uses Standard Class?
  // Let's stick to `is_shipping` flag for explicit shipping tax rules.

  const shippingRules = applicableRules.filter(r => r.is_shipping);

  // Calculate Shipping Tax
  // Shipping tax is usually simple (not compound usually, but we support it)
  // Base cost
  let shippingBase = shippingCost;

  // Create Shipping Calculation Logic
  // Apply rules in priority order
  for (const rule of shippingRules) {
    const taxAmount = (shippingBase * rule.rate) / 100;
    shippingTaxAmount += taxAmount;
    shippingTotalRate += rule.rate;

    if (rule.is_compound) {
      shippingBase += taxAmount; // Next tax applies on top
    }

    // Add to global breakdown
    const key = rule.name;
    if (!globalBreakdown[key]) globalBreakdown[key] = { amount: 0, rate: rule.rate };
    globalBreakdown[key].amount += taxAmount;
  }

  result.shippingTax = Number(shippingTaxAmount.toFixed(2));
  result.shippingTaxRate = shippingTotalRate; // Sum of rates, approximate for compound

  // For Items
  for (const item of itemsWithClass) {
    const itemTotal = item.price * item.quantity;
    let itemBase = itemTotal;

    // If prices include tax, we need to BACK OUT the tax to find base, then re-calculate tax.
    // FORMULA: PriceWithTax = Base * (1 + TaxRate) => Base = PriceWithTax / (1 + TaxRate)
    // Only applies if we know the TOTAL rate applicable to this item.

    // Find applicable rules for this item's class
    const itemRules = applicableRules.filter(r => r.tax_class_id === item.taxClassId && !r.is_shipping);
    // Wait, is_shipping rules might ALSO link to a class? 
    // Let's assume `is_shipping` rules ONLY apply to shipping, and regular rules (linked to Product Tax Classes) apply to items.

    // Calculate effective Rate first to handle "Include Tax" 
    // Compound tax makes "effective rate" tricky.
    // Simple sum if no compound.
    // If compound: Tax = Base * R1 + (Base + Base*R1) * R2 ...
    // Let's start with forward calculation assuming Base is known.

    let totalTaxAmount = 0;
    let totalRateRaw = 0;

    if (pricesIncludeTax) {
      // Reverse Calculation to find Base
      // For compound, it's complex algebraically.
      // Approx: Base = Total / (1 + SumRates).
      // If compound: T1 = B*r1, T2 = (B+T1)*r2 ... 
      // Total = B + T1 + T2 ...
      // Total = B * (1 + r1) * (1 + r2) ... if all compound?
      // Let's support simple reverse for non-compound first, or standard iterative.
      // Most systems don't do compound + inclusive tax together often.
      // Let's assume simple sum of rates for reverse calculation.

      let effectiveRate = 0;
      itemRules.forEach(r => {
        // Treat compound as simple add for reverse estimation, or accurate if simple
        effectiveRate += r.rate;
      });

      const divisor = 1 + (effectiveRate / 100);
      itemBase = itemTotal / divisor;
    }

    // Now calc tax on itemBase
    let currentBase = itemBase;
    const itemBreakdown: TaxBreakdownLine[] = [];

    for (const rule of itemRules) {
      const amount = (currentBase * rule.rate) / 100;
      totalTaxAmount += amount;
      totalRateRaw += rule.rate;

      itemBreakdown.push({
        title: rule.name,
        amount: Number(amount.toFixed(2)),
        rate: rule.rate
      });

      // Add to global
      const key = rule.name;
      if (!globalBreakdown[key]) globalBreakdown[key] = { amount: 0, rate: rule.rate };
      globalBreakdown[key].amount += amount;

      if (rule.is_compound) {
        currentBase += amount;
      }
    }

    result.items.push({
      lineItemId: item.lineItemId,
      productId: item.productId,
      variantId: item.variantId,
      taxAmount: Number(totalTaxAmount.toFixed(2)),
      taxRate: totalRateRaw,
      taxBreakdown: itemBreakdown
    });

    result.taxTotal += totalTaxAmount;
  }

  result.taxTotal += shippingTaxAmount;
  result.taxTotal = Number(result.taxTotal.toFixed(2));

  // Format global breakdown
  result.taxBreakdown = Object.keys(globalBreakdown).map(k => ({
    title: k,
    amount: Number(globalBreakdown[k].amount.toFixed(2)),
    rate: globalBreakdown[k].rate
  }));

  result.pricesIncludeTax = pricesIncludeTax;

  return result;
}
