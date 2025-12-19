'use server'

import { cookies } from "next/headers"
import { execute, query } from "@/lib/db"
import { createCustomer } from "@/lib/customers"
import { createSession, validateSession } from "@/lib/customer-sessions"
import { logAudit } from "@/lib/audit"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

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
    const { revokeSession } = require("@/lib/customer-sessions")
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
    // optimization: validateSession could join user table
    const { getCustomer } = require("@/lib/customers")
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
