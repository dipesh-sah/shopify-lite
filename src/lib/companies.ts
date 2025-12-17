import { query, execute } from './db';

// Types
export interface CompanyLocation {
  id: string;
  companyId: string;
  name?: string;
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

export interface Company {
  id: string;
  name: string;
  orderingStatus: 'approved' | 'not_approved';
  mainContactId?: string;
  companyExternalId?: string;
  paymentTerms?: string;
  allowOneTimeAddress: boolean;
  orderSubmissionType: 'auto' | 'draft';
  taxId?: string;
  taxSettings?: string;
  catalogs?: string[];
  totalSpent: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
  locationCount?: number;
  locations?: CompanyLocation[];
  mainContact?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Companies CRUD
export async function getCompanies(options: { search?: string; limit?: number; offset?: number; sort?: string } = {}) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (options.search) {
    whereClause += ' AND (name LIKE ?)';
    params.push(`%${options.search}%`);
  }

  // Count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM companies ${whereClause}`,
    params
  );
  const totalCount = countResult[0]?.total || 0;

  let sql = `
    SELECT c.*, 
           cust.first_name as contact_first_name, 
           cust.last_name as contact_last_name, 
           cust.email as contact_email,
           (SELECT COUNT(*) FROM company_locations WHERE company_id = c.id) as location_count
    FROM companies c
    LEFT JOIN customers cust ON c.main_contact_id = cust.id
    ${whereClause}
  `;

  if (options.sort) {
    if (options.sort === 'name_asc') sql += ' ORDER BY c.name ASC';
    else if (options.sort === 'spent_desc') sql += ' ORDER BY c.total_spent DESC';
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

  const rows = await query(sql, params);
  const companies = rows.map(mapCompanyFromDb);

  return { companies, totalCount };
}

export async function getCompany(id: string) {
  const rows = await query(`
    SELECT c.*, 
           cust.first_name as contact_first_name, 
           cust.last_name as contact_last_name, 
           cust.email as contact_email
    FROM companies c
    LEFT JOIN customers cust ON c.main_contact_id = cust.id
    WHERE c.id = ?
  `, [id]);

  if (rows.length === 0) return null;

  const company = mapCompanyFromDb(rows[0]);

  // Fetch locations
  const locationRows = await query('SELECT * FROM company_locations WHERE company_id = ?', [id]);
  company.locations = locationRows.map(mapLocationFromDb);

  return company;
}

export async function createCompany(data: {
  name: string;
  mainContactId?: string;
  companyExternalId?: string;
  paymentTerms?: string;
  allowOneTimeAddress?: boolean;
  orderSubmissionType?: 'auto' | 'draft';
  taxId?: string;
  taxSettings?: string;
  catalogs?: string[];
  location?: Partial<CompanyLocation>;
}) {
  const result = await execute(
    `INSERT INTO companies (
      name, main_contact_id, company_external_id, payment_terms, allow_one_time_address, 
      order_submission_type, tax_id, tax_settings, catalogs, 
      ordering_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_approved', NOW(), NOW())`,
    [
      data.name,
      data.mainContactId || null,
      data.companyExternalId || null,
      data.paymentTerms || null,
      data.allowOneTimeAddress ? 1 : 0,
      data.orderSubmissionType || 'auto',
      data.taxId || null,
      data.taxSettings || null,
      JSON.stringify(data.catalogs || []),
    ]
  );
  const companyId = result.insertId;

  if (data.location) {
    await createCompanyLocation(companyId.toString(), {
      ...data.location,
      isDefault: true
    } as any);
  }

  return companyId.toString();
}

export async function updateCompany(id: string, data: Partial<Company>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.orderingStatus !== undefined) { updates.push('ordering_status = ?'); values.push(data.orderingStatus); }
  if (data.mainContactId !== undefined) { updates.push('main_contact_id = ?'); values.push(data.mainContactId); }
  if (data.companyExternalId !== undefined) { updates.push('company_external_id = ?'); values.push(data.companyExternalId); }
  if (data.paymentTerms !== undefined) { updates.push('payment_terms = ?'); values.push(data.paymentTerms); }
  if (data.allowOneTimeAddress !== undefined) { updates.push('allow_one_time_address = ?'); values.push(data.allowOneTimeAddress ? 1 : 0); }
  if (data.orderSubmissionType !== undefined) { updates.push('order_submission_type = ?'); values.push(data.orderSubmissionType); }
  if (data.taxId !== undefined) { updates.push('tax_id = ?'); values.push(data.taxId); }
  if (data.taxSettings !== undefined) { updates.push('tax_settings = ?'); values.push(data.taxSettings); }
  if (data.catalogs !== undefined) { updates.push('catalogs = ?'); values.push(JSON.stringify(data.catalogs)); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, values);
  }
}

// ... (updateCompany implementation)

export async function deleteCompany(id: string) {
  await execute('DELETE FROM companies WHERE id = ?', [id]);
}

// Locations
export async function createCompanyLocation(companyId: string, data: Omit<CompanyLocation, 'id' | 'companyId'>) {
  if (data.isDefault) {
    await execute('UPDATE company_locations SET is_default = FALSE WHERE company_id = ?', [companyId]);
  }

  await execute(
    `INSERT INTO company_locations (company_id, name, address1, address2, city, province, province_code, country, country_code, zip, phone, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      companyId,
      data.name || null,
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
}

// Helpers
function mapCompanyFromDb(row: any): Company {
  const company: Company = {
    id: row.id.toString(),
    name: row.name,
    orderingStatus: row.ordering_status,
    mainContactId: row.main_contact_id ? row.main_contact_id.toString() : undefined,
    companyExternalId: row.company_external_id,
    paymentTerms: row.payment_terms,
    allowOneTimeAddress: Boolean(row.allow_one_time_address),
    orderSubmissionType: row.order_submission_type,
    taxId: row.tax_id,
    taxSettings: row.tax_settings,
    catalogs: row.catalogs ? (typeof row.catalogs === 'string' ? JSON.parse(row.catalogs) : row.catalogs) : [],
    totalSpent: Number(row.total_spent || 0),
    totalOrders: Number(row.total_orders || 0),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    locationCount: row.location_count ? Number(row.location_count) : 0
  };

  if (row.contact_email) {
    company.mainContact = {
      firstName: row.contact_first_name,
      lastName: row.contact_last_name,
      email: row.contact_email
    };
  }

  return company;
}

function mapLocationFromDb(row: any): CompanyLocation {
  return {
    id: row.id.toString(),
    companyId: row.company_id.toString(),
    name: row.name,
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
