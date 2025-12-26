import { query, execute } from "./db";
import type { Customer, CustomerWithCompany } from "./customer-auth";

export interface B2BPricing {
  id: number;
  productId: number;
  variantId: number | null;
  companyId: number | null;
  customerId: number | null;
  price: number;
  minQuantity: number;
  maxQuantity: number | null;
  pricingType: 'fixed' | 'percentage' | 'tiered';
  discountPercentage: number | null;
  tierName: string | null;
  isActive: boolean;
}

export interface MinimumOrderQuantity {
  productId: number;
  variantId: number | null;
  minQuantity: number;
  incrementQuantity: number;
}

/**
 * Get the effective price for a product based on customer type and company
 * Priority: Customer-specific > Company-specific > B2B general > Regular price
 */
export async function getProductPrice(
  productId: number,
  variantId: number | null,
  customer: CustomerWithCompany | null,
  quantity: number = 1
): Promise<number> {
  // If not a B2B customer, return regular price
  if (!customer || customer.customerType !== 'b2b') {
    return await getRegularPrice(productId, variantId);
  }

  // Try to get B2B pricing
  const b2bPrice = await getB2BPrice(productId, variantId, customer, quantity);

  if (b2bPrice !== null) {
    return b2bPrice;
  }

  // Fallback to regular price with company discount if available
  const regularPrice = await getRegularPrice(productId, variantId);

  if (customer.company && customer.company.discountPercentage > 0) {
    return regularPrice * (1 - customer.company.discountPercentage / 100);
  }

  return regularPrice;
}

/**
 * Get regular (non-B2B) price for a product
 */
async function getRegularPrice(productId: number, variantId: number | null): Promise<number> {
  if (variantId) {
    const variants = await query<any>(
      `SELECT price FROM product_variants WHERE id = ? AND product_id = ?`,
      [variantId, productId]
    );
    if (variants.length > 0) {
      return parseFloat(variants[0].price);
    }
  }

  const products = await query<any>(
    `SELECT price FROM products WHERE id = ?`,
    [productId]
  );

  if (products.length > 0) {
    return parseFloat(products[0].price);
  }

  return 0;
}

/**
 * Get B2B-specific pricing for a product
 */
async function getB2BPrice(
  productId: number,
  variantId: number | null,
  customer: CustomerWithCompany,
  quantity: number
): Promise<number | null> {
  // Build query to find best matching B2B price
  // Priority: customer_id > company_id > general B2B (both NULL)
  const pricings = await query<any>(
    `SELECT 
      price, 
      pricing_type, 
      discount_percentage, 
      min_quantity, 
      max_quantity,
      customer_id,
      company_id
    FROM b2b_product_pricing
    WHERE product_id = ?
      AND (variant_id = ? OR variant_id IS NULL)
      AND (customer_id = ? OR company_id = ? OR (customer_id IS NULL AND company_id IS NULL))
      AND is_active = TRUE
      AND (min_quantity <= ? OR min_quantity IS NULL)
      AND (max_quantity >= ? OR max_quantity IS NULL)
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
    ORDER BY 
      CASE 
        WHEN customer_id IS NOT NULL THEN 1
        WHEN company_id IS NOT NULL THEN 2
        ELSE 3
      END,
      min_quantity DESC
    LIMIT 1`,
    [
      productId,
      variantId || null,
      customer.id,
      customer.companyId || null,
      quantity,
      quantity,
    ]
  );

  if (pricings.length === 0) {
    return null;
  }

  const pricing = pricings[0];

  // If pricing type is percentage, calculate from regular price
  if (pricing.pricing_type === 'percentage' && pricing.discount_percentage) {
    const regularPrice = await getRegularPrice(productId, variantId);
    return regularPrice * (1 - pricing.discount_percentage / 100);
  }

  // Otherwise return fixed price
  return parseFloat(pricing.price);
}

/**
 * Get minimum order quantity for a product
 */
export async function getMinimumOrderQuantity(
  productId: number,
  variantId: number | null,
  customer: Customer | null
): Promise<MinimumOrderQuantity> {
  const customerType = customer?.customerType || 'b2c';
  const companyId = customer?.companyId || null;

  // Check for specific MOQ rules
  const moqs = await query<any>(
    `SELECT 
      min_quantity, 
      increment_quantity
    FROM minimum_order_quantities
    WHERE product_id = ?
      AND (variant_id = ? OR variant_id IS NULL)
      AND (company_id = ? OR company_id IS NULL)
      AND (customer_type = ? OR customer_type = 'all')
      AND is_active = TRUE
    ORDER BY 
      CASE WHEN company_id IS NOT NULL THEN 1 ELSE 2 END,
      CASE WHEN variant_id IS NOT NULL THEN 1 ELSE 2 END
    LIMIT 1`,
    [productId, variantId || null, companyId || null, customerType]
  );

  if (moqs.length > 0) {
    return {
      productId,
      variantId,
      minQuantity: moqs[0].min_quantity,
      incrementQuantity: moqs[0].increment_quantity || 1,
    };
  }

  // Default: no minimum, increment by 1
  return {
    productId,
    variantId,
    minQuantity: 1,
    incrementQuantity: 1,
  };
}

/**
 * Validate if quantity meets minimum order requirements
 */
export async function validateOrderQuantity(
  productId: number,
  variantId: number | null,
  quantity: number,
  customer: Customer | null
): Promise<{ valid: boolean; error?: string; minQuantity?: number; increment?: number }> {
  const moq = await getMinimumOrderQuantity(productId, variantId, customer);

  if (quantity < moq.minQuantity) {
    return {
      valid: false,
      error: `Minimum order quantity is ${moq.minQuantity}`,
      minQuantity: moq.minQuantity,
    };
  }

  if (moq.incrementQuantity > 1 && quantity % moq.incrementQuantity !== 0) {
    return {
      valid: false,
      error: `Quantity must be in multiples of ${moq.incrementQuantity}`,
      increment: moq.incrementQuantity,
    };
  }

  return { valid: true };
}

/**
 * Check if customer's order meets company minimum order value
 */
export async function validateMinimumOrderValue(
  orderTotal: number,
  customer: CustomerWithCompany | null
): Promise<{ valid: boolean; error?: string; minimumValue?: number }> {
  if (!customer || customer.customerType !== 'b2b' || !customer.company) {
    return { valid: true };
  }

  const minOrderValue = customer.company.minimumOrderValue;

  if (minOrderValue > 0 && orderTotal < minOrderValue) {
    return {
      valid: false,
      error: `Minimum order value is ${minOrderValue}`,
      minimumValue: minOrderValue,
    };
  }

  return { valid: true };
}

/**
 * Get all active price groups
 */
export async function getPriceGroups() {
  return await query<any>(
    `SELECT * FROM customer_price_groups WHERE is_active = TRUE ORDER BY name`
  );
}

/**
 * Assign customer to a price group
 */
export async function assignCustomerToPriceGroup(
  customerId: number,
  priceGroupId: number,
  assignedBy: number | null = null
): Promise<boolean> {
  try {
    await execute(
      `INSERT INTO customer_price_group_members (customer_id, price_group_id, assigned_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP, assigned_by = ?`,
      [customerId, priceGroupId, assignedBy, assignedBy]
    );
    return true;
  } catch (error) {
    console.error('Error assigning price group:', error);
    return false;
  }
}

/**
 * Create or update B2B product pricing
 */
export async function setB2BProductPricing(data: {
  productId: number;
  variantId?: number | null;
  companyId?: number | null;
  customerId?: number | null;
  price?: number;
  discountPercentage?: number;
  pricingType: 'fixed' | 'percentage' | 'tiered';
  minQuantity?: number;
  maxQuantity?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  createdBy?: number;
}): Promise<{ success: boolean; pricingId?: number; error?: string }> {
  try {
    // Validate that either price or discountPercentage is provided
    if (data.pricingType === 'fixed' && !data.price) {
      return { success: false, error: 'Price is required for fixed pricing' };
    }
    if (data.pricingType === 'percentage' && !data.discountPercentage) {
      return { success: false, error: 'Discount percentage is required for percentage pricing' };
    }

    const result = await execute(
      `INSERT INTO b2b_product_pricing (
        product_id, variant_id, company_id, customer_id,
        price, pricing_type, discount_percentage,
        min_quantity, max_quantity,
        valid_from, valid_until, created_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        data.productId,
        data.variantId || null,
        data.companyId || null,
        data.customerId || null,
        data.price || 0,
        data.pricingType,
        data.discountPercentage || null,
        data.minQuantity || 1,
        data.maxQuantity || null,
        data.validFrom || null,
        data.validUntil || null,
        data.createdBy || null,
      ]
    );

    return { success: true, pricingId: result.insertId };
  } catch (error) {
    console.error('Error setting B2B pricing:', error);
    return { success: false, error: 'Failed to set pricing' };
  }
}

/**
 * Set minimum order quantity for a product
 */
export async function setMinimumOrderQuantity(data: {
  productId: number;
  variantId?: number | null;
  companyId?: number | null;
  customerType?: 'b2c' | 'b2b' | 'all';
  minQuantity: number;
  incrementQuantity?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await execute(
      `INSERT INTO minimum_order_quantities (
        product_id, variant_id, company_id, customer_type,
        min_quantity, increment_quantity, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        min_quantity = VALUES(min_quantity),
        increment_quantity = VALUES(increment_quantity)`,
      [
        data.productId,
        data.variantId || null,
        data.companyId || null,
        data.customerType || 'all',
        data.minQuantity,
        data.incrementQuantity || 1,
      ]
    );

    return { success: true };
  } catch (error) {
    console.error('Error setting MOQ:', error);
    return { success: false, error: 'Failed to set minimum order quantity' };
  }
}
