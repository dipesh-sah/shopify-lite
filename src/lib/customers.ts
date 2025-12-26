import { query, execute } from './db';
import { serializeDate } from './utils';

// Types
export interface CustomerAddress {
  id: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  provinceCode?: string;
  country: string;
  countryCode?: string;
  zip: string;
  phone?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  tags: string[];
  acceptsMarketing: boolean;
  totalSpent: number;
  totalOrders: number;
  lastOrderDate?: string;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  addresses?: CustomerAddress[];
  defaultAddress?: CustomerAddress;
}

// Customers CRUD functions
export async function getCustomers(options: { search?: string; limit?: number; offset?: number; sort?: string } = {}) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (options.search) {
    whereClause += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
    params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
    params
  );
  const totalCount = countResult[0]?.total || 0;

  // Main Query using Subqueries to avoid GROUP BY issues
  let sql = `SELECT * FROM customers c ${whereClause}`;

  if (options.sort) {
    if (options.sort === 'spent_desc') sql += ' ORDER BY calculated_total_spent DESC';
    else if (options.sort === 'created_desc') sql += ' ORDER BY c.created_at DESC';
    else sql += ' ORDER BY c.created_at DESC';
  } else {
    sql += ' ORDER BY c.created_at DESC';
  }

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  try {
    const rows = await query(sql, params);

    const customers = rows.map(row => ({
      ...mapCustomerFromDb(row),
      // For now, we rely on the denormalized columns in the customers table.
      // If we need live calculation or location, we can add it back later properly.
      billingCity: row.billing_city || undefined,
      billingCountry: row.billing_country || undefined
    }));

    return { customers, totalCount };
  } catch (error) {
    console.error('SQL Error in getCustomers:', error);
    console.error('SQL Query:', sql);
    console.error('SQL Params:', params);
    throw error;
  }
}

export async function getCustomer(id: string) {
  const rows = await query('SELECT * FROM customers WHERE id = ?', [id]);
  if (rows.length === 0) return null;

  const customer = mapCustomerFromDb(rows[0]);

  // Fetch addresses
  const addressRows = await query('SELECT * FROM customer_addresses WHERE customer_id = ?', [id]);
  customer.addresses = addressRows.map(mapAddressFromDb);
  customer.defaultAddress = customer.addresses.find(a => a.isDefault);

  return customer;
}

export async function getCustomerByEmail(email: string) {
  const rows = await query('SELECT * FROM customers WHERE email = ?', [email]);
  if (rows.length === 0) return null;
  return mapCustomerFromDb(rows[0]);
}

export async function createCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  notes?: string;
  tags?: string[];
  acceptsMarketing?: boolean;
  profileImageUrl?: string;
  preferences?: Record<string, any>;
  isActive?: boolean;
  address?: Partial<CustomerAddress>; // Initial address
}) {
  const result = await execute(
    `INSERT INTO customers(first_name, last_name, email, phone, password, notes, tags, accepts_marketing, profile_image_url, preferences, is_active, created_at, updated_at)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      data.firstName,
      data.lastName,
      data.email,
      data.phone || null,
      data.password || null,
      data.notes || null,
      JSON.stringify(data.tags || []),
      data.acceptsMarketing ? 1 : 0,
      data.profileImageUrl || null,
      data.preferences ? JSON.stringify(data.preferences) : null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1
    ]
  );

  const customerId = result.insertId;

  if (data.address) {
    await createCustomerAddress(customerId.toString(), {
      ...data.address,
      isDefault: true
    } as any);
  }

  return customerId.toString();
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.firstName !== undefined) { updates.push('first_name = ?'); values.push(data.firstName); }
  if (data.lastName !== undefined) { updates.push('last_name = ?'); values.push(data.lastName); }
  if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email); }
  if (data.phone !== undefined) { updates.push('phone = ?'); values.push(data.phone); }
  if (data.notes !== undefined) { updates.push('notes = ?'); values.push(data.notes); }
  if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
  if (data.acceptsMarketing !== undefined) { updates.push('accepts_marketing = ?'); values.push(data.acceptsMarketing ? 1 : 0); }
  if (data.profileImageUrl !== undefined) { updates.push('profile_image_url = ?'); values.push(data.profileImageUrl); }
  if (data.preferences !== undefined) { updates.push('preferences = ?'); values.push(JSON.stringify(data.preferences)); }
  if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE customers SET ${updates.join(', ')} WHERE id = ? `, values);
  }
}

export async function deleteCustomer(id: string) {
  await execute('DELETE FROM customers WHERE id = ?', [id]);
}

// Address Management
export async function createCustomerAddress(customerId: string, data: Omit<CustomerAddress, 'id' | 'customerId'>) {
  // If set to default, unset other defaults
  if (data.isDefault) {
    await execute('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?', [customerId]);
  }

  const result = await execute(
    `INSERT INTO customer_addresses(customer_id, first_name, last_name, company, address1, address2, city, province, province_code, country, country_code, zip, phone, is_default, created_at, updated_at)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      customerId,
      data.firstName || null,
      data.lastName || null,
      data.company || null,
      data.address1,
      data.address2 || null,
      data.city,
      data.province || null,
      data.provinceCode || null,
      data.country,
      data.countryCode || null,
      data.zip,
      data.phone || null,
      data.isDefault ? 1 : 0
    ]
  );

  return result.insertId.toString();
}

export async function updateCustomerAddress(id: string, customerId: string, data: Partial<CustomerAddress>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.firstName !== undefined) { updates.push('first_name = ?'); values.push(data.firstName); }
  if (data.lastName !== undefined) { updates.push('last_name = ?'); values.push(data.lastName); }
  if (data.company !== undefined) { updates.push('company = ?'); values.push(data.company); }
  if (data.address1 !== undefined) { updates.push('address1 = ?'); values.push(data.address1); }
  if (data.address2 !== undefined) { updates.push('address2 = ?'); values.push(data.address2); }
  if (data.city !== undefined) { updates.push('city = ?'); values.push(data.city); }
  if (data.province !== undefined) { updates.push('province = ?'); values.push(data.province); }
  if (data.provinceCode !== undefined) { updates.push('province_code = ?'); values.push(data.provinceCode); }
  if (data.country !== undefined) { updates.push('country = ?'); values.push(data.country); }
  if (data.countryCode !== undefined) { updates.push('country_code = ?'); values.push(data.countryCode); }
  if (data.zip !== undefined) { updates.push('zip = ?'); values.push(data.zip); }
  if (data.phone !== undefined) { updates.push('phone = ?'); values.push(data.phone); }
  if (data.isDefault !== undefined) {
    updates.push('is_default = ?'); values.push(data.isDefault ? 1 : 0);
    if (data.isDefault) {
      await execute('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?', [customerId]);
    }
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE customer_addresses SET ${updates.join(', ')} WHERE id = ? `, values);
  }
}

export async function deleteCustomerAddress(id: string) {
  await execute('DELETE FROM customer_addresses WHERE id = ?', [id]);
}

export async function getCustomerAddresses(customerId: string) {
  const rows = await query('SELECT * FROM customer_addresses WHERE customer_id = ?', [customerId]);
  return rows.map(mapAddressFromDb);
}


// Helpers
function mapCustomerFromDb(row: any): Customer {
  return {
    id: row.id.toString(),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
    acceptsMarketing: Boolean(row.accepts_marketing),
    totalSpent: Number(row.total_spent || 0),
    totalOrders: Number(row.total_orders || 0),
    lastOrderDate: serializeDate(row.last_order_date) || undefined,
    profileImageUrl: row.profile_image_url,
    preferences: row.preferences ? (typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences) : {},
    isActive: row.is_active !== 0,
    createdAt: serializeDate(row.created_at),
    updatedAt: serializeDate(row.updated_at),
  };
}

function mapAddressFromDb(row: any): CustomerAddress {
  return {
    id: row.id.toString(),
    customerId: row.customer_id.toString(),
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    province: row.province,
    provinceCode: row.province_code,
    country: row.country,
    countryCode: row.country_code,
    zip: row.zip,
    phone: row.phone,
    isDefault: Boolean(row.is_default)
  };
}


