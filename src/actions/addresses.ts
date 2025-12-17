'use server'

import * as db from "@/lib/customers"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

async function getCustomerId() {
  const cookieStore = await cookies()
  const token = cookieStore.get("customer_session")?.value
  if (!token) return null

  try {
    const { validateSession } = await import("@/lib/customer-sessions")
    const session = await validateSession(token)
    if (!session) return null
    return session.customerId.toString()
  } catch {
    return null
  }
}

export async function getAddressesAction() {
  const customerId = await getCustomerId()
  if (!customerId) return []
  return await db.getCustomerAddresses(customerId)
}

export async function addAddressAction(formData: FormData) {
  const customerId = await getCustomerId()
  if (!customerId) throw new Error("Unauthorized")

  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    company: formData.get("company") as string,
    address1: formData.get("address1") as string,
    address2: formData.get("address2") as string,
    city: formData.get("city") as string,
    province: formData.get("province") as string,
    provinceCode: formData.get("province_code") as string,
    zip: formData.get("zip") as string,
    country: formData.get("country") as string,
    countryCode: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    isDefault: formData.get("isDefault") === "true"
  }

  await db.createCustomerAddress(customerId, data)
  revalidatePath("/account")
  revalidatePath("/account/addresses")
  return { success: true }
}

export async function updateAddressAction(id: string, formData: FormData) {
  const customerId = await getCustomerId()
  if (!customerId) throw new Error("Unauthorized")

  const data: any = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    company: formData.get("company") as string,
    address1: formData.get("address1") as string,
    address2: formData.get("address2") as string,
    city: formData.get("city") as string,
    province: formData.get("province") as string,
    provinceCode: formData.get("province_code") as string,
    zip: formData.get("zip") as string,
    country: formData.get("country") as string,
    countryCode: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    isDefault: formData.get("isDefault") === "true"
  }

  await db.updateCustomerAddress(id, customerId, data)
  revalidatePath("/account")
  revalidatePath("/account/addresses")
  return { success: true }
}

export async function deleteAddressAction(id: string) {
  const customerId = await getCustomerId()
  if (!customerId) throw new Error("Unauthorized")

  await db.deleteCustomerAddress(id)
  revalidatePath("/account")
  revalidatePath("/account/addresses")
  return { success: true }
}

export async function setDefaultAddressAction(id: string) {
  const customerId = await getCustomerId()
  if (!customerId) throw new Error("Unauthorized")

  // First set local, then updateOthers logic is inside create/update usually, 
  // but here we need a dedicated function if it exists in db.
  // Viewing src/lib/customers.ts, there is NO setDefaultAddress exported.
  // We need to implement it manually here or add it to customers.ts
  // Let's check customers.ts again.
  // It has create check if isDefault, update check if isDefault.
  // But no standalone setDefault. 
  // However, I can update the address with isDefault=true causing the logic to trigger.

  await db.updateCustomerAddress(id, customerId, { isDefault: true })
  revalidatePath("/account")
  revalidatePath("/account/addresses")
  return { success: true }
}
