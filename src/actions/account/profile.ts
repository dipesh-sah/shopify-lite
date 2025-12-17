
'use server'

import { revalidatePath } from "next/cache"
import { execute, query } from "@/lib/db"
import { updateCustomer, getCustomer } from "@/lib/customers"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"
import { validateSession } from "@/lib/customer-sessions"
import { getSessionAction } from "@/actions/customer-auth"

// Profile
export async function updateProfileAction(formData: FormData) {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string

  // Simple validation
  if (!email) return { error: "Email is required" }

  try {
    await updateCustomer(session.id, {
      firstName,
      lastName,
      email,
      phone
    })

    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'update_profile',
      actorId: session.id,
      metadata: { items: ['name', 'email', 'phone'] }
    })

    revalidatePath('/account/profile')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to update profile" }
  }
}

// Security
export async function changePasswordAction(prevState: any, formData: FormData) {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string

  if (!currentPassword || !newPassword) return { error: "Missing fields" }

  if (newPassword.length < 6) return { error: "Password must be at least 6 characters" }

  try {
    // Re-verify current password
    const customer = await getCustomer(session.id)
    // Note: getCustomer doesn't return password hash by default in our map function, 
    // we need to fetch it explicitly or update getCustomer to return it (bad practice for frontend exposure).
    // Let's assume we need a specific internal function for password verification or query directly.
    // For now, let's query directly here for security.
    const { query } = require("@/lib/db")
    const rows = await query("SELECT password FROM customers WHERE id = ?", [session.id])

    if (rows.length === 0 || !rows[0].password) return { error: "User not found" }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password)
    if (!isMatch) return { error: "Incorrect current password" }

    // Update
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    // Use direct SQL to update password to avoid exposing it in updateCustomer interface unnecessarily 
    // if we didn't want to transport it, but updateCustomer supports it.
    // Update password
    await execute('UPDATE customers SET password = ? WHERE id = ?', [hashedPassword, session.id])

    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'change_password',
      actorId: session.id
    })

    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { error: "Failed to update password" }
  }
}
