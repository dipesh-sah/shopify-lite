import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query, execute } from "./db";

const CUSTOMER_SESSION_COOKIE = "customer_session";

export interface Customer {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  customerType: 'b2c' | 'b2b';
  companyId: number | null;
  accountStatus: 'active' | 'pending' | 'suspended' | 'rejected';
  isActive: boolean;
}

export interface CustomerWithCompany extends Customer {
  company?: {
    id: number;
    name: string;
    orderingStatus: 'approved' | 'not_approved';
    minimumOrderValue: number;
    creditLimit: number;
    discountPercentage: number;
    paymentTerms: string;
  };
}

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Create a customer session cookie
 */
export async function createCustomerSession(customerId: number) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_SESSION_COOKIE, customerId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Delete customer session cookie
 */
export async function deleteCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

/**
 * Get the current authenticated customer
 */
export async function getAuthenticatedCustomer(): Promise<Customer | null> {
  const cookieStore = await cookies();
  const customerId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (!customerId) return null;

  const customers = await query<any>(
    `SELECT 
      id, 
      email, 
      first_name, 
      last_name, 
      customer_type, 
      company_id, 
      account_status, 
      is_active
    FROM customers 
    WHERE id = ? AND is_active = TRUE`,
    [customerId]
  );

  if (customers.length === 0) return null;

  const c = customers[0];
  return {
    id: c.id,
    email: c.email,
    firstName: c.first_name,
    lastName: c.last_name,
    customerType: c.customer_type || 'b2c',
    companyId: c.company_id,
    accountStatus: c.account_status || 'active',
    isActive: c.is_active,
  };
}

/**
 * Get authenticated customer with company details
 */
export async function getAuthenticatedCustomerWithCompany(): Promise<CustomerWithCompany | null> {
  const customer = await getAuthenticatedCustomer();
  if (!customer) return null;

  if (customer.customerType === 'b2b' && customer.companyId) {
    const companies = await query<any>(
      `SELECT 
        id, 
        name, 
        ordering_status, 
        minimum_order_value, 
        credit_limit, 
        discount_percentage, 
        payment_terms
      FROM companies 
      WHERE id = ?`,
      [customer.companyId]
    );

    if (companies.length > 0) {
      const comp = companies[0];
      return {
        ...customer,
        company: {
          id: comp.id,
          name: comp.name,
          orderingStatus: comp.ordering_status,
          minimumOrderValue: parseFloat(comp.minimum_order_value || 0),
          creditLimit: parseFloat(comp.credit_limit || 0),
          discountPercentage: parseFloat(comp.discount_percentage || 0),
          paymentTerms: comp.payment_terms || 'Net 30',
        },
      };
    }
  }

  return customer;
}

/**
 * Login a customer
 */
export async function loginCustomer(email: string, password: string): Promise<Customer | null> {
  const customers = await query<any>(
    `SELECT 
      id, 
      email, 
      password, 
      first_name, 
      last_name, 
      customer_type, 
      company_id, 
      account_status, 
      is_active
    FROM customers 
    WHERE email = ?`,
    [email]
  );

  if (customers.length === 0) return null;

  const customer = customers[0];

  // Check if account is active
  if (!customer.is_active || customer.account_status === 'suspended' || customer.account_status === 'rejected') {
    return null;
  }

  // Verify password
  if (!customer.password) return null;

  const isValid = await verifyPassword(password, customer.password);
  if (!isValid) return null;

  // B2B customers must be approved
  if (customer.customer_type === 'b2b' && customer.account_status !== 'active') {
    return null;
  }

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    customerType: customer.customer_type || 'b2c',
    companyId: customer.company_id,
    accountStatus: customer.account_status || 'active',
    isActive: customer.is_active,
  };
}

/**
 * Register a new B2C customer
 */
export async function registerB2CCustomer(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<{ success: boolean; customerId?: number; error?: string }> {
  try {
    // Check if email already exists
    const existing = await query<any>(
      `SELECT id FROM customers WHERE email = ?`,
      [data.email]
    );

    if (existing.length > 0) {
      return { success: false, error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Insert customer
    const result = await execute(
      `INSERT INTO customers (
        email, 
        password, 
        first_name, 
        last_name, 
        phone, 
        customer_type, 
        account_status,
        is_active
      ) VALUES (?, ?, ?, ?, ?, 'b2c', 'active', TRUE)`,
      [
        data.email,
        passwordHash,
        data.firstName || null,
        data.lastName || null,
        data.phone || null,
      ]
    );

    return { success: true, customerId: result.insertId };
  } catch (error) {
    console.error('Error registering B2C customer:', error);
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Check if customer can access B2B features
 */
export async function canAccessB2BFeatures(customer: Customer): Promise<boolean> {
  return (
    customer.customerType === 'b2b' &&
    customer.accountStatus === 'active' &&
    customer.isActive
  );
}
