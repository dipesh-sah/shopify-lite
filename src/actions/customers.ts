"use server"

import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "@/lib/customers"
import { updateMetafieldAction } from "@/actions/metadata"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getCustomersAction(options?: { search?: string; limit?: number; offset?: number }) {
  try {
    const data = await getCustomers(options)
    return data
  } catch (error) {
    console.error("Error getting customers:", error)
    return { customers: [], totalCount: 0 }
  }
}

export async function getCustomerAction(id: string) {
  try {
    const data = await getCustomer(id)
    return data
  } catch (error) {
    console.error("Error getting customer:", error)
    return null
  }
}

export async function createCustomerAction(data: any) {
  try {
    const id = await createCustomer(data)

    // Handle Metafields
    if (data.metafields && Array.isArray(data.metafields)) {
      for (const field of data.metafields) {
        await updateMetafieldAction(
          'customer',
          id,
          field.namespace || 'custom',
          field.key,
          field.value,
          field.type
        )
      }
    }

    revalidatePath("/admin/customers")
    return { success: true, id }
  } catch (error) {
    console.error("Error creating customer:", error)
    return { success: false, error: "Failed to create customer" }
  }
}

export async function updateCustomerAction(id: string, data: any) {
  try {
    await updateCustomer(id, data)

    // Handle Metafields
    if (data.metafields && Array.isArray(data.metafields)) {
      for (const field of data.metafields) {
        await updateMetafieldAction(
          'customer',
          id,
          field.namespace || 'custom',
          field.key,
          field.value,
          field.type
        )
      }
    }

    revalidatePath("/admin/customers")
    revalidatePath(`/admin/customers/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating customer:", error)
    return { success: false, error: "Failed to update customer" }
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    await deleteCustomer(id)
    revalidatePath("/admin/customers")
    return { success: true }
  } catch (error) {
    console.error("Error deleting customer:", error)
    return { success: false, error: "Failed to delete customer" }
  }
}
