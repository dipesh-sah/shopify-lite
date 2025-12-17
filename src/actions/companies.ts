'use server'

import { createCompany, updateCompany, deleteCompany, getCompanies } from "@/lib/companies"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getCompaniesAction(options?: any) {
  const data = await getCompanies(options)
  // Convert dates to strings for serialization if used in client components directly
  // But since it's used in server component (page.tsx), we can return as is or map if needed
  return data
}

export async function createCompanyAction(prevState: any, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries())

    // Parse catalogs from form data (expected as JSON string or array)
    // For now, let's assume it might be passed as a hidden input or handled differently
    // Simplifying for typical form submission

    const companyData = {
      name: rawFormData.name as string,
      mainContactId: rawFormData.mainContactId ? String(rawFormData.mainContactId) : undefined,
      companyExternalId: rawFormData.companyExternalId ? String(rawFormData.companyExternalId) : undefined,
      paymentTerms: rawFormData.paymentTerms ? String(rawFormData.paymentTerms) : undefined,
      allowOneTimeAddress: rawFormData.allowOneTimeAddress === 'on',
      orderSubmissionType: rawFormData.orderSubmissionType as 'auto' | 'draft',
      taxId: rawFormData.taxId ? String(rawFormData.taxId) : undefined,
      taxSettings: rawFormData.taxSettings ? String(rawFormData.taxSettings) : undefined,
      catalogs: [], // Handle catalogs if needed, maybe parsing a hidden field
      location: {
        address1: rawFormData.address1 as string,
        city: rawFormData.city as string,
        country: rawFormData.country as string,
        zip: rawFormData.zip as string,
        province: rawFormData.province as string,
        provinceCode: rawFormData.provinceCode as string,
        countryCode: rawFormData.countryCode as string, // Should come from a selector
      }
    }

    await createCompany(companyData)

    revalidatePath('/admin/companies')
    return { success: true }
  } catch (error) {
    console.error('Create company error:', error)
    return { error: 'Failed to create company' }
  }
}

export async function updateCompanyAction(id: string, prevState: any, formData: FormData) {
  // Similar implementation for update
  return { success: true }
}
