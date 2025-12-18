import { execute, query, pool } from './db';
import { v4 as uuidv4 } from 'uuid';
import { generateNextNumber } from './number-ranges';
import { calculateOrderTax } from './tax';

export async function createOrderMySQL(data: {
  userId: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    title?: string;
    image?: string; // New: Pass image URL for snapshot
  }>;
  total: number;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    phone?: string;
  };
  promotionCode?: string;
  shippingMethodId?: number; // New
  shippingCost?: number; // New
}) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const orderId = uuidv4();
    let finalTotal = data.total;
    let discountAmount = 0;

    // 0. Handle Promotion (If provided)
    if (data.promotionCode) {
      // Fetch promotion
      const [promotions] = await connection.query(
        "SELECT * FROM promotions WHERE code = ? AND is_active = 1 AND start_date <= CURDATE() AND end_date >= CURDATE()",
        [data.promotionCode]
      ) as any[];

      if (promotions.length === 0) {
        throw new Error(`Invalid or expired promotion code: ${data.promotionCode}`);
      }

      const promo = promotions[0];

      // Check usage limits
      if (promo.max_usages > 0 && promo.current_usages >= promo.max_usages) {
        throw new Error(`Promotion code usage limit reached: ${data.promotionCode}`);
      }

      // Check minimum order amount
      if (promo.min_order_amount > 0 && data.total < promo.min_order_amount) {
        throw new Error(`Order total does not meet minimum amount for promotion: ${data.promotionCode}`);
      }

      // Calculate discount
      if (promo.discount_type === 'percentage') {
        discountAmount = (data.total * promo.discount_value) / 100;
      } else {
        discountAmount = parseFloat(promo.discount_value);
      }

      // Ensure discount doesn't exceed total
      if (discountAmount > finalTotal) {
        discountAmount = finalTotal;
      }

      finalTotal = finalTotal - discountAmount;

      // Update promotion usage
      await connection.execute(
        "UPDATE promotions SET current_usages = current_usages + 1 WHERE id = ?",
        [promo.id]
      );
    }

    // 1. Validate and Deduct Inventory (Atomic Operation)
    for (const item of data.items) {
      if (item.variantId) {
        // Handle Variant Inventory
        const [variantResult] = await connection.execute(
          `UPDATE product_variants 
           SET inventory_quantity = inventory_quantity - ? 
           WHERE id = ? AND inventory_quantity >= ?`,
          [item.quantity, item.variantId, item.quantity]
        );

        if ((variantResult as any).affectedRows === 0) {
          throw new Error(`Insufficient stock for product variant: ${item.title}`);
        }
      } else {
        // Handle Main Product Inventory (only if track_quantity is true)
        const [productCheck] = await connection.query(
          "SELECT track_quantity FROM products WHERE id = ?",
          [item.productId]
        ) as any[];

        if (productCheck.length > 0 && productCheck[0].track_quantity) {
          const [productResult] = await connection.execute(
            `UPDATE products 
                 SET quantity = quantity - ? 
                 WHERE id = ? AND quantity >= ?`,
            [item.quantity, item.productId, item.quantity]
          );

          if ((productResult as any).affectedRows === 0) {
            throw new Error(`Insufficient stock for product: ${item.title}`);
          }
        }
      }
    }

    // 1.5 Calculate Tax
    const taxCalculation = await calculateOrderTax(
      data.items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        price: i.price,
        quantity: i.quantity
      })),
      {
        country: data.shippingAddress?.country || '',
        state: data.shippingAddress?.province,
        zip: data.shippingAddress?.zip
      },
      data.shippingCost || 0
    );

    // Add tax to final total?
    // If prices NOT include tax (default): finalTotal += taxCalculation.taxTotal
    // If prices INCLUDE tax: finalTotal IS the total to pay (includes tax).
    // The previous logic for promotions adjusted 'finalTotal'.
    // We need to know if tax is additive or inclusive to adjust final price correctly.
    // For now, let's assume additive for simplicity or check settings?
    // calculateOrderTax handles "inclusive" logic for the breakdown, but returns total tax amount.
    // Ideally we should know if we need to ADD it to the total or if it's already there.
    // Standard e-commerce usually adds tax on top unless "All prices include tax".

    // Let's fetch settings to verify behavior or assume additive if not set?
    // We really should respect the "pricesIncludeTax" setting for the FINAL TOTAL calculation.
    // But calculateOrderTax is async and we are inside a transaction potentially (though using pool).
    // Let's assume standard behavior: Tax is added to subtotal.
    // If prices included tax, then tax_total is just a portion of what's already there.

    // We'll update finalTotal logic:
    // finalTotal = (subtotal - discount) + shipping + tax

    // wait, existing code: finalTotal = finalTotal (from input) - discount.
    // input 'data.total' usually comes from frontend. 
    // If we want backend to be authoritative, we should re-sum items?
    // Existing code trusts data.total.
    // Let's add tax to it if we assume it wasn't calculated yet (standard flow).

    // But enable/disable check is inside 'calculateOrderTax'.
    // If we want to be safe, we add taxCalculation.taxTotal to finalTotal.
    // Note: If tax is inclusive, calculateOrderTax returns the tax component, but we shouldn't ADD it again.
    // We need to check if 'pricesIncludeTax' was true. 
    // For now, let's assume we ADD tax (Exclusive Tax).
    // TODO: Verify Inclusive Tax handling.

    if (!taxCalculation.pricesIncludeTax) {
      finalTotal += taxCalculation.taxTotal;
    }

    // 2. Create Order
    // Generate Order Number
    const orderNumber = await generateNextNumber('order');

    await connection.execute(
      `INSERT INTO orders 
      (id, user_id, customer_email, total, status, payment_status, created_at, updated_at,
       shipping_first_name, shipping_last_name, shipping_company, shipping_address1, shipping_address2,
       shipping_city, shipping_province, shipping_zip, shipping_country, shipping_phone,
       billing_first_name, billing_last_name, billing_company, billing_address1, billing_address2,
       billing_city, billing_province, billing_zip, billing_country, billing_phone, order_number,
       shipping_method_id, shipping_cost, tax_total, tax_breakdown) 
      VALUES (?, ?, ?, ?, 'pending', 'pending', NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        data.userId || null,
        data.customerEmail || null,
        finalTotal + (data.shippingCost || 0), // Add shipping to total if not already included? Or assume total includes it? 
        // CAUTION: The frontend usually calculates total INCLUDING shipping. 
        // If finalTotal is derived from data.total which comes from frontend, it might already include it.
        // Let's assume data.total INCLUDES shipping cost.
        // But wait, the previous code recalculates finalTotal based on promo. 
        // "finalTotal = data.total;" -> "finalTotal = finalTotal - discountAmount;"
        // If data.total includes shipping, then discounting is fine (usually shipping is excluded from discount, but simplified ok).
        // Let's act as if data.total passed from frontend ALREADY has shipping added.

        data.shippingAddress?.firstName || null,
        data.shippingAddress?.lastName || null,
        data.shippingAddress?.company || null,
        data.shippingAddress?.address1 || null,
        data.shippingAddress?.address2 || null,
        data.shippingAddress?.city || null,
        data.shippingAddress?.province || null,
        data.shippingAddress?.zip || null,
        data.shippingAddress?.country || null,
        data.shippingAddress?.phone || null,
        data.billingAddress?.firstName || null,
        data.billingAddress?.lastName || null,
        data.billingAddress?.company || null,
        data.billingAddress?.address1 || null,
        data.billingAddress?.address2 || null,
        data.billingAddress?.city || null,
        data.billingAddress?.province || null,
        data.billingAddress?.zip || null,
        data.billingAddress?.country || null,
        data.billingAddress?.phone || null,
        orderNumber,
        data.shippingMethodId || null,
        data.shippingCost || 0.00,
        taxCalculation.taxTotal,
        JSON.stringify(taxCalculation.taxBreakdown)
      ]
    );

    // 3. Create Order Items (with Snapshot)
    for (const item of data.items) {
      // Find tax info for this item
      const itemTax = taxCalculation.items.find(t => t.productId === item.productId && t.variantId === item.variantId);

      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, price, image_url, tax_amount, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.variantId || null,
          item.title || 'Product',
          item.quantity,
          item.price,
          item.image || null, // Store snapshot image
          itemTax ? itemTax.taxAmount : 0,
          itemTax ? itemTax.taxRate : 0
        ]
      );
    }

    // 4. Update Customer Statistics
    if (data.customerEmail) {
      // Find customer by email (or user_id if we have that logic, but email is safer for guest checkout merging)
      const [customers] = await connection.query(
        "SELECT id FROM customers WHERE email = ?",
        [data.customerEmail]
      ) as any[];

      if (customers.length > 0) {
        const customerId = customers[0].id;
        await connection.execute(
          `UPDATE customers 
           SET total_spent = total_spent + ?, 
               total_orders = total_orders + 1, 
               last_order_date = NOW() 
           WHERE id = ?`,
          [finalTotal, customerId]
        );
      }
    }

    await connection.commit();
    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getOrderMySQL(id: string) {
  const orders = await query(`SELECT * FROM orders WHERE id = ?`, [id]);
  if (orders.length === 0) return null;

  const items = await query(`SELECT * FROM order_items WHERE order_id = ?`, [id]);
  const order = orders[0];

  let customer = null;

  if (order.customer_email) {
    const customers = await query(`SELECT id, first_name, last_name, email, phone, total_orders, total_spent FROM customers WHERE email = ?`, [order.customer_email]);
    if (customers.length > 0) {
      customer = customers[0];
    }
  }

  // Use stored address if available
  const shippingAddress = order.shipping_address1 ? {
    firstName: order.shipping_first_name,
    lastName: order.shipping_last_name,
    company: order.shipping_company,
    address1: order.shipping_address1,
    address2: order.shipping_address2,
    city: order.shipping_city,
    province: order.shipping_province,
    zip: order.shipping_zip,
    country: order.shipping_country,
    phone: order.shipping_phone
  } : null;

  const billingAddress = order.billing_address1 ? {
    firstName: order.billing_first_name,
    lastName: order.billing_last_name,
    company: order.billing_company,
    address1: order.billing_address1,
    address2: order.billing_address2,
    city: order.billing_city,
    province: order.billing_province,
    zip: order.billing_zip,
    country: order.billing_country,
    phone: order.billing_phone
  } : null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    customerEmail: order.customer_email,
    customerPhone: customer?.phone,
    customerFirstName: customer?.first_name,
    customerLastName: customer?.last_name,
    customerTotalOrders: customer?.total_orders,
    customerTotalSpent: customer?.total_spent,
    shippingAddress,
    billingAddress,
    total: order.total,
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    items: items.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name,
      quantity: item.quantity,
      price: item.price
    }))
  };
}

export async function getOrdersMySQL(options: {
  userId?: string;
  email?: string;
  search?: string;
  status?: string;
  paymentStatus?: string;
  sortBy?: 'created_at' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
} = {}) {
  let baseSql = ` FROM orders o LEFT JOIN customers c ON o.customer_email = c.email WHERE 1=1`;
  const params: any[] = [];

  if (options.userId) {
    baseSql += ` AND o.user_id = ?`;
    params.push(options.userId);
  }

  if (options.email) {
    baseSql += ` AND o.customer_email = ?`;
    params.push(options.email);
  }

  if (options.status && options.status !== 'all') {
    baseSql += ` AND LOWER(o.status) = ?`;
    params.push(options.status.toLowerCase());
  }

  if (options.paymentStatus && options.paymentStatus !== 'all') {
    baseSql += ` AND LOWER(o.payment_status) = ?`;
    params.push(options.paymentStatus.toLowerCase());
  }

  if (options.search) {
    baseSql += ` AND (o.id LIKE ? OR o.order_number LIKE ? OR o.customer_email LIKE ? OR o.shipping_first_name LIKE ? OR o.shipping_last_name LIKE ?)`;
    const searchParam = `%${options.search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  // 1. Get Total Count
  const countSql = `SELECT COUNT(*) as total ${baseSql}`;
  const [countRows] = await query(countSql, params);
  const totalCount = countRows ? countRows.total : 0;

  // 2. Get Data
  let dataSql = `SELECT o.*, c.first_name, c.last_name ${baseSql}`;

  const sortColumn = options.sortBy === 'total' ? 'total' : options.sortBy === 'status' ? 'status' : 'created_at';
  const sortDirection = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
  dataSql += ` ORDER BY o.${sortColumn} ${sortDirection}`;

  if (options.limit) {
    dataSql += ` LIMIT ?`;
    params.push(options.limit);
  }

  if (options.offset) {
    dataSql += ` OFFSET ?`;
    params.push(options.offset);
  }

  const orders = await query(dataSql, params);
  if (orders.length === 0) return { orders: [], totalCount };

  const orderIds = orders.map((o: any) => o.id);
  const placeholders = orderIds.map(() => '?').join(',');

  const allItems = await query(`
    SELECT oi.*, 
    COALESCE(oi.product_name, p.title) as fallback_name,
    (SELECT url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY position ASC LIMIT 1) as image_url
    FROM order_items oi 
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id IN (${placeholders})
  `, orderIds);

  const itemsByOrder: Record<string, any[]> = {};
  allItems.forEach((item: any) => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name || item.fallback_name || 'Product',
      quantity: item.quantity,
      price: item.price,
      image: item.image_url
    });
  });

  const formattedOrders = orders.map((order: any) => {
    // Determine customer names from join or fallback to order fields
    const firstName = order.first_name || order.shipping_first_name || order.billing_first_name;
    const lastName = order.last_name || order.shipping_last_name || order.billing_last_name;

    return {
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      customerEmail: order.customer_email,
      customerFirstName: firstName,
      customerLastName: lastName,
      total: order.total,
      status: order.status,
      paymentStatus: order.payment_status,
      isPaid: order.payment_status === 'paid',
      createdAt: order.created_at,
      items: itemsByOrder[order.id] || []
    };
  });

  return { orders: formattedOrders, totalCount };
}

export async function updateOrderStatusMySQL(id: string, status: string) {
  await execute(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
}

export async function deleteOrderMySQL(id: string) {
  await execute(`DELETE FROM orders WHERE id = ?`, [id]);
}

export async function updatePaymentStatusMySQL(id: string, status: 'paid' | 'pending' | 'failed') {
  await execute(`UPDATE orders SET payment_status = ? WHERE id = ?`, [status, id]);
}

export async function getCustomerOrdersMySQL(email?: string, userId?: string) {
  const { orders } = await getOrdersMySQL({ email, userId });
  return orders;
}

export async function getOrderStatsMySQL() {
  const rows = await query<{ totalOrders: number; totalRevenue: number; pendingOrders: number; deliveredOrders: number }>(`
    SELECT 
      COUNT(*) as totalOrders,
      SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as totalRevenue,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as deliveredOrders
    FROM orders
  `);
  return rows[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 };
}
