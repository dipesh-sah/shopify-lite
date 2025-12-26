'use server'

import { cookies } from "next/headers"
import { execute, query } from "@/lib/db"
import { createCustomer, getCustomer } from "@/lib/customers"
import { createSession, validateSession, revokeSession } from "@/lib/customer-sessions"
import { logAudit } from "@/lib/audit"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { submitB2BApplication } from '@/lib/b2b-applications';

export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string

  if (!email || !password || !firstName || !lastName) {
    return { error: "Missing required fields" }
  }

  // Check if user exists
  const existingUsers = await query("SELECT id FROM customers WHERE email = ?", [email]) as any[]
  if (existingUsers.length > 0) {
    return { error: "User already exists" }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const customerId = await createCustomer({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      acceptsMarketing: false
    })

    logAudit({
      entityType: 'customer',
      entityId: customerId,
      action: 'register'
    })

    // Auto login
    const token = await createSession(customerId)

      ; (await cookies()).set("customer_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/"
      })

    return { success: true }
  } catch (error: any) {
    console.error("Signup error:", error)
    return { error: error.message || "Failed to create account" }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Missing required fields" }
  }

  try {
    const users = await query("SELECT * FROM customers WHERE email = ?", [email]) as any[]

    if (users.length === 0) {
      return { error: "Invalid credentials" }
    }

    const user = users[0]

    if (!user.password) {
      return { error: "Please reset your password" }
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return { error: "Invalid credentials" }
    }

    // Create DB Session
    // In a real app we'd get User-Agent and IP from headers()
    const token = await createSession(user.id.toString())

    logAudit({
      entityType: 'customer',
      entityId: user.id.toString(),
      action: 'login',
      actorId: user.id.toString()
    })

      // Store ONLY token in cookie
      ; (await cookies()).set("customer_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/"
      })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "Something went wrong" }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get("customer_session")?.value

  // Note: We might want to revoke from DB too, but for speed just clear cookie usually.
  // Ideally:
  if (token) {
    await revokeSession(token)

    // We can't easily get the user ID here without validating first, 
    // so let's skip audit log for logout unless we validate first. 
    // Usually logout audit is lower priority.
  }

  cookieStore.delete("customer_session")
  redirect("/")
}

export async function getSessionAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get("customer_session")?.value

  if (!token) return null

  try {
    // Validate against DB
    const session = await validateSession(token)
    if (!session) {
      console.log('getSessionAction: Session invalid in DB', token)
      return null
    }

    // Fetch fresh user data to return
    const user = await getCustomer(session.customerId.toString())

    if (!user || !user.isActive) {
      console.log('getSessionAction: User not found or inactive', session.customerId)
      return null
    }

    return user
  } catch (e) {
    console.error('getSessionAction error:', e)
    return null
  }
}

// B2B Application Action
export async function submitB2BApplicationAction(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_session")?.value;

    if (!token) {
      return { error: 'You must be logged in to apply for a B2B account' };
    }

    const session = await validateSession(token);
    if (!session) {
      return { error: 'Session expired. Please login again.' };
    }


    const applicationData = {
      customerId: session.customerId, // Already a string from session
      companyName: formData.get('companyName') as string,
      companyRegistrationNumber: formData.get('companyRegistrationNumber') as string || undefined,
      taxId: formData.get('taxId') as string || undefined,
      businessType: formData.get('businessType') as string || undefined,
      website: formData.get('website') as string || undefined,
      annualRevenue: formData.get('annualRevenue') ? parseFloat(formData.get('annualRevenue') as string) : undefined,
      employeeCount: formData.get('employeeCount') ? parseInt(formData.get('employeeCount') as string) : undefined,
      contactPersonName: formData.get('contactPersonName') as string || undefined,
      contactPersonTitle: formData.get('contactPersonTitle') as string || undefined,
      contactPhone: formData.get('contactPhone') as string || undefined,
      contactEmail: formData.get('contactEmail') as string || undefined,
      businessAddress1: formData.get('businessAddress1') as string || undefined,
      businessAddress2: formData.get('businessAddress2') as string || undefined,
      businessCity: formData.get('businessCity') as string || undefined,
      businessProvince: formData.get('businessProvince') as string || undefined,
      businessCountry: formData.get('businessCountry') as string || undefined,
      businessZip: formData.get('businessZip') as string || undefined,
      applicationMessage: formData.get('applicationMessage') as string || undefined,
      expectedMonthlyVolume: formData.get('expectedMonthlyVolume') ? parseFloat(formData.get('expectedMonthlyVolume') as string) : undefined,
    };

    if (!applicationData.companyName) {
      return { error: 'Company name is required' };
    }

    const result = await submitB2BApplication(applicationData);

    if (!result.success) {
      return { error: result.error || 'Failed to submit application' };
    }

    return { success: true, applicationId: result.applicationId };

  } catch (err) {
    console.error('B2B application error:', err);
    return { error: 'Something went wrong' };
  }
}

// Get customer profile with company info
export async function getCustomerProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_session")?.value;

  if (!token) {
    console.log('[getCustomerProfile] No session token found');
    return null;
  }

  try {
    const session = await validateSession(token);
    if (!session) {
      console.log('[getCustomerProfile] Invalid session');
      return null;
    }

    console.log('[getCustomerProfile] Session valid for customer:', session.customerId);

    // Try to get customer with all B2B fields
    try {
      const customers = await query<any>(
        `SELECT 
          c.id,
          c.email,
          c.first_name,
          c.last_name,
          c.customer_type,
          c.company_id,
          c.account_status,
          c.is_active,
          co.name as company_name,
          co.ordering_status,
          co.minimum_order_value,
          co.credit_limit,
          co.discount_percentage,
          co.payment_terms
        FROM customers c
        LEFT JOIN companies co ON c.company_id = co.id
        WHERE c.id = ?`,
        [session.customerId]
      );

      if (customers.length === 0) {
        console.log('[getCustomerProfile] Customer not found');
        return null;
      }

      const c = customers[0];
      console.log('[getCustomerProfile] Found customer:', c.email);

      const profile: any = {
        id: c.id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        customerType: c.customer_type || 'b2c',
        companyId: c.company_id,
        accountStatus: c.account_status || 'active',
        isActive: c.is_active !== false,
      };

      if (c.company_id && c.company_name) {
        profile.company = {
          id: c.company_id,
          name: c.company_name,
          orderingStatus: c.ordering_status,
          minimumOrderValue: parseFloat(c.minimum_order_value || 0),
          creditLimit: parseFloat(c.credit_limit || 0),
          discountPercentage: parseFloat(c.discount_percentage || 0),
          paymentTerms: c.payment_terms || 'Net 30',
        };
      }

      console.log('[getCustomerProfile] Returning profile for:', profile.email);
      return profile;
    } catch (queryError: any) {
      // Check if it's a missing column error
      if (queryError.code === 'ER_BAD_FIELD_ERROR' || queryError.message.includes('Unknown column')) {
        console.warn('[getCustomerProfile] B2B columns missing in database, falling back to basic profile.');
      } else {
        console.error('[getCustomerProfile] Database error fetching profile:', queryError);
      }

      // Fall back to basic customer query
      const customers = await query<any>(
        `SELECT 
          c.id,
          c.email,
          c.first_name,
          c.last_name,
          c.is_active
        FROM customers c
        WHERE c.id = ?`,
        [session.customerId]
      );

      if (customers.length === 0) return null;

      const c = customers[0];
      return {
        id: c.id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        customerType: 'b2c', // Default to B2C if columns don't exist
        companyId: null,
        accountStatus: 'active',
        isActive: c.is_active !== false,
      };
    }
  } catch (error) {
    console.error('[getCustomerProfile] Error:', error);
    return null;
  }
}
