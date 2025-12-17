
'use server'

import { revalidatePath } from "next/cache"
import { listSessions, revokeSessionById, revokeAllSessions } from "@/lib/customer-sessions"
import { getSessionAction } from "@/actions/customer-auth"
import { logAudit } from "@/lib/audit"
import { cookies } from "next/headers"

export async function getLoginHistoryAction() {
  const session = await getSessionAction()
  if (!session) return []
  return await listSessions(session.id)
}

export async function revokeSessionAction(sessionId: number) {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  try {
    await revokeSessionById(sessionId, session.id)
    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'revoke_session',
      actorId: session.id,
      metadata: { sessionId }
    })
    revalidatePath('/account/security')
    return { success: true }
  } catch (error) {
    return { error: "Failed to revoke session" }
  }
}

export async function revokeAllSessionsAction() {
  const session = await getSessionAction()
  if (!session) return { error: "Not authenticated" }

  try {
    await revokeAllSessions(session.id)
    logAudit({
      entityType: 'customer',
      entityId: session.id,
      action: 'revoke_all_sessions',
      actorId: session.id
    })
      // Clear current cookie too since we nuked it from DB
      ; (await cookies()).delete("customer_session")

    return { success: true }
  } catch (error) {
    return { error: "Failed to revoke sessions" }
  }
}
