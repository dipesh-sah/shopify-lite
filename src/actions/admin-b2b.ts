'use server';

import { getSessionUserWithPermissions } from "@/lib/auth";
import {
  getB2BApplications,
  getB2BApplication,
  approveB2BApplication,
  rejectB2BApplication,
  setApplicationUnderReview,
  getApplicationLogs,
} from "@/lib/b2b-applications";
import {
  setB2BProductPricing,
  setMinimumOrderQuantity,
  getPriceGroups,
  assignCustomerToPriceGroup,
} from "@/lib/b2b-pricing";
import { revalidatePath } from "next/cache";

/**
 * Get all B2B applications (Admin only)
 */
export async function getB2BApplicationsAction(filters?: {
  status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  limit?: number;
  offset?: number;
}) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  return await getB2BApplications(filters);
}

/**
 * Get a specific B2B application (Admin only)
 */
export async function getB2BApplicationAction(applicationId: number) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  return await getB2BApplication(applicationId);
}

/**
 * Approve B2B application (Admin only)
 */
export async function approveB2BApplicationAction(
  applicationId: number,
  notes?: string
) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  const result = await approveB2BApplication(
    applicationId,
    parseInt(user.id),
    notes
  );

  if (result.success) {
    revalidatePath('/admin/b2b/applications');
  }

  return result;
}

/**
 * Reject B2B application (Admin only)
 */
export async function rejectB2BApplicationAction(
  applicationId: number,
  rejectionReason: string
) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  const result = await rejectB2BApplication(
    applicationId,
    parseInt(user.id),
    rejectionReason
  );

  if (result.success) {
    revalidatePath('/admin/b2b/applications');
  }

  return result;
}

/**
 * Set application under review (Admin only)
 */
export async function setApplicationUnderReviewAction(
  applicationId: number,
  notes?: string
) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  const result = await setApplicationUnderReview(
    applicationId,
    parseInt(user.id),
    notes
  );

  if (result.success) {
    revalidatePath('/admin/b2b/applications');
  }

  return result;
}

/**
 * Get application logs (Admin only)
 */
export async function getApplicationLogsAction(applicationId: number) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  return await getApplicationLogs(applicationId);
}

/**
 * Set B2B pricing for a product (Admin only)
 */
export async function setB2BProductPricingAction(data: {
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
}) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  const result = await setB2BProductPricing({
    ...data,
    createdBy: parseInt(user.id),
  });

  if (result.success) {
    revalidatePath('/admin/products');
    revalidatePath('/admin/b2b/pricing');
  }

  return result;
}

/**
 * Set minimum order quantity (Admin only)
 */
export async function setMinimumOrderQuantityAction(data: {
  productId: number;
  variantId?: number | null;
  companyId?: number | null;
  customerType?: 'b2c' | 'b2b' | 'all';
  minQuantity: number;
  incrementQuantity?: number;
}) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  const result = await setMinimumOrderQuantity(data);

  if (result.success) {
    revalidatePath('/admin/products');
  }

  return result;
}

/**
 * Get all price groups (Admin only)
 */
export async function getPriceGroupsAction() {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  return await getPriceGroups();
}

/**
 * Assign customer to price group (Admin only)
 */
export async function assignCustomerToPriceGroupAction(
  customerId: number,
  priceGroupId: number
) {
  const user = await getSessionUserWithPermissions();
  if (!user) throw new Error('Unauthorized');

  const result = await assignCustomerToPriceGroup(
    customerId,
    priceGroupId,
    parseInt(user.id)
  );

  if (result) {
    revalidatePath('/admin/customers');
  }

  return { success: result };
}
