
'use server'

import { revalidatePath } from "next/cache"
import { createCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from "@/lib/customers"
import { logAudit } from "@/lib/audit"
import { getSessionAction } from "@/actions/customer-auth"

export async function createAddressAction(data: any) {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  try {
    const id = await createCustomerAddress(session.id, {
      ...data,
      customerId: session.id
    })

    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'create_address',
      actorId: session.id,
      metadata: { addressId: id }
    })

    revalidatePath('/account/addresses')
    return { success: true, id }
  } catch (error: any) {
    return { error: error.message || "Failed to create address" }
  }
}

export async function updateAddressAction(id: string, data: any) {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  try {
    await updateCustomerAddress(id, session.id, data)

    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'update_address',
      actorId: session.id,
      metadata: { addressId: id }
    })

    revalidatePath('/account/addresses')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update address" }
  }
}

export async function deleteAddressAction(id: string) {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  try {
    await deleteCustomerAddress(id)

    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'delete_address',
      actorId: session.id,
      metadata: { addressId: id }
    })

    revalidatePath('/account/addresses')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete address" }
  }
}

export async function setDefaultAddressAction(id: string) {
  return updateAddressAction(id, { isDefault: true })
}
