import { query, execute } from "./db";

export interface B2BApplicationData {
  customerId: string | number;
  companyName: string;
  companyRegistrationNumber?: string;
  taxId?: string;
  businessType?: string;
  website?: string;
  annualRevenue?: number;
  employeeCount?: number;
  contactPersonName?: string;
  contactPersonTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessAddress1?: string;
  businessAddress2?: string;
  businessCity?: string;
  businessProvince?: string;
  businessCountry?: string;
  businessZip?: string;
  applicationMessage?: string;
  expectedMonthlyVolume?: number;
  productCategoriesInterest?: string[];
}

export interface B2BApplication {
  id: number;
  customerId: number;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: number;
  reviewNotes?: string;
  rejectionReason?: string;
  [key: string]: any;
}

/**
 * Submit a B2B application
 */
export async function submitB2BApplication(data: B2BApplicationData): Promise<{
  success: boolean;
  applicationId?: number;
  error?: string;
}> {
  try {
    // Check if customer already has a pending or approved application
    const existing = await query<any>(
      `SELECT id, status FROM b2b_applications 
       WHERE customer_id = ? AND status IN ('pending', 'approved', 'under_review')
       ORDER BY submitted_at DESC LIMIT 1`,
      [data.customerId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'approved') {
        return { success: false, error: 'Customer already has an approved B2B account' };
      }
      return { success: false, error: 'Customer already has a pending application' };
    }

    // Insert the application
    const result = await execute(
      `INSERT INTO b2b_applications (
        customer_id, company_name, company_registration_number, tax_id,
        business_type, website, annual_revenue, employee_count,
        contact_person_name, contact_person_title, contact_phone, contact_email,
        business_address1, business_address2, business_city, business_province,
        business_country, business_zip, application_message,
        expected_monthly_volume, product_categories_interest, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.customerId,
        data.companyName,
        data.companyRegistrationNumber || null,
        data.taxId || null,
        data.businessType || null,
        data.website || null,
        data.annualRevenue || null,
        data.employeeCount || null,
        data.contactPersonName || null,
        data.contactPersonTitle || null,
        data.contactPhone || null,
        data.contactEmail || null,
        data.businessAddress1 || null,
        data.businessAddress2 || null,
        data.businessCity || null,
        data.businessProvince || null,
        data.businessCountry || null,
        data.businessZip || null,
        data.applicationMessage || null,
        data.expectedMonthlyVolume || null,
        data.productCategoriesInterest ? JSON.stringify(data.productCategoriesInterest) : null,
      ]
    );

    // Log the submission
    await execute(
      `INSERT INTO b2b_approval_logs (application_id, customer_id, action, notes)
       VALUES (?, ?, 'submitted', 'Application submitted by customer')`,
      [result.insertId, data.customerId]
    );

    // Update customer table to set as pending
    await execute(
      `UPDATE customers SET customer_type = 'b2b', account_status = 'pending' WHERE id = ?`,
      [data.customerId]
    );

    return { success: true, applicationId: result.insertId };
  } catch (error) {
    console.error('Error submitting B2B application:', error);
    return { success: false, error: 'Failed to submit application' };
  }
}

/**
 * Get all B2B applications (for admin)
 */
export async function getB2BApplications(filters?: {
  status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  limit?: number;
  offset?: number;
}): Promise<B2BApplication[]> {
  let sql = `
    SELECT 
      a.*,
      c.email as customer_email,
      c.first_name as customer_first_name,
      c.last_name as customer_last_name
    FROM b2b_applications a
    LEFT JOIN customers c ON a.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.status) {
    sql += ` AND a.status = ?`;
    params.push(filters.status);
  }

  sql += ` ORDER BY a.submitted_at DESC`;

  if (filters?.limit) {
    sql += ` LIMIT ?`;
    params.push(filters.limit);

    if (filters?.offset) {
      sql += ` OFFSET ?`;
      params.push(filters.offset);
    }
  }

  const applications = await query<any>(sql, params);
  return applications;
}

/**
 * Get a specific B2B application
 */
export async function getB2BApplication(applicationId: number): Promise<B2BApplication | null> {
  const applications = await query<any>(
    `SELECT a.*, c.email as customer_email, c.first_name, c.last_name
     FROM b2b_applications a
     LEFT JOIN customers c ON a.customer_id = c.id
     WHERE a.id = ?`,
    [applicationId]
  );

  return applications.length > 0 ? applications[0] : null;
}

/**
 * Get B2B application by customer ID
 */
export async function getCustomerB2BApplication(customerId: number): Promise<B2BApplication | null> {
  const applications = await query<any>(
    `SELECT * FROM b2b_applications 
     WHERE customer_id = ? 
     ORDER BY submitted_at DESC LIMIT 1`,
    [customerId]
  );

  return applications.length > 0 ? applications[0] : null;
}

/**
 * Approve a B2B application
 */
export async function approveB2BApplication(
  applicationId: number,
  approvedBy: number,
  notes?: string
): Promise<{ success: boolean; companyId?: number; error?: string }> {
  try {
    // Get the application
    const application = await getB2BApplication(applicationId);
    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    if (application.status === 'approved') {
      return { success: false, error: 'Application already approved' };
    }

    // Create a company record
    const companyResult = await execute(
      `INSERT INTO companies (
        name, ordering_status, tax_id, main_contact_id
      ) VALUES (?, 'approved', ?, ?)`,
      [application.companyName, application.taxId || null, application.customerId]
    );

    const companyId = companyResult.insertId;

    // Create company location from business address
    if (application.businessAddress1) {
      await execute(
        `INSERT INTO company_locations (
          company_id, name, address1, address2, city, province, country, zip, phone, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          companyId,
          'Main Office',
          application.businessAddress1,
          application.businessAddress2 || null,
          application.businessCity || null,
          application.businessProvince || null,
          application.businessCountry || null,
          application.businessZip || null,
          application.contactPhone || null,
        ]
      );
    }

    // Update the application
    await execute(
      `UPDATE b2b_applications 
       SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?, review_notes = ?
       WHERE id = ?`,
      [approvedBy, notes || null, applicationId]
    );

    // Update customer record
    await execute(
      `UPDATE customers 
       SET customer_type = 'b2b', company_id = ?, account_status = 'active', 
           approved_at = NOW(), approved_by = ?
       WHERE id = ?`,
      [companyId, approvedBy, application.customerId]
    );

    // Log the approval
    await execute(
      `INSERT INTO b2b_approval_logs (application_id, customer_id, action, performed_by, notes)
       VALUES (?, ?, 'approved', ?, ?)`,
      [applicationId, application.customerId, approvedBy, notes || 'Application approved']
    );

    return { success: true, companyId };
  } catch (error) {
    console.error('Error approving B2B application:', error);
    return { success: false, error: 'Failed to approve application' };
  }
}

/**
 * Reject a B2B application
 */
export async function rejectB2BApplication(
  applicationId: number,
  rejectedBy: number,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const application = await getB2BApplication(applicationId);
    if (!application) {
      return { success: false, error: 'Application not found' };
    }

    // Update the application
    await execute(
      `UPDATE b2b_applications 
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [rejectedBy, rejectionReason, applicationId]
    );

    // Update customer status
    await execute(
      `UPDATE customers SET account_status = 'rejected' WHERE id = ?`,
      [application.customerId]
    );

    // Log the rejection
    await execute(
      `INSERT INTO b2b_approval_logs (application_id, customer_id, action, performed_by, notes)
       VALUES (?, ?, 'rejected', ?, ?)`,
      [applicationId, application.customerId, rejectedBy, rejectionReason]
    );

    return { success: true };
  } catch (error) {
    console.error('Error rejecting B2B application:', error);
    return { success: false, error: 'Failed to reject application' };
  }
}

/**
 * Set application to under review
 */
export async function setApplicationUnderReview(
  applicationId: number,
  reviewedBy: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute(
      `UPDATE b2b_applications SET status = 'under_review', reviewed_by = ?, review_notes = ? WHERE id = ?`,
      [reviewedBy, notes || null, applicationId]
    );

    const application = await getB2BApplication(applicationId);
    if (application) {
      await execute(
        `INSERT INTO b2b_approval_logs (application_id, customer_id, action, performed_by, notes)
         VALUES (?, ?, 'under_review', ?, ?)`,
        [applicationId, application.customerId, reviewedBy, notes || 'Application under review']
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error setting application under review:', error);
    return { success: false, error: 'Failed to update application status' };
  }
}

/**
 * Get approval logs for an application
 */
export async function getApplicationLogs(applicationId: number) {
  return await query<any>(
    `SELECT 
      l.*,
      a.email as admin_email,
      a.first_name as admin_first_name,
      a.last_name as admin_last_name
     FROM b2b_approval_logs l
     LEFT JOIN admin_users a ON l.performed_by = a.id
     WHERE l.application_id = ?
     ORDER BY l.created_at DESC`,
    [applicationId]
  );
}
