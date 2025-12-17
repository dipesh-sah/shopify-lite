
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateSession, listSessions, revokeSessionById } from '@/lib/customer-sessions';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Auth
    let token = request.cookies.get('customer_session')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token) return errorResponse('Unauthorized', 401);

    const session = await validateSession(token);
    if (!session) return errorResponse('Unauthorized', 401);

    const sessions = await listSessions(session.customerId.toString());

    // Mark current session
    const sessionsWithCurrent = sessions.map((s: any) => ({
      ...s,
      isCurrent: s.id === session.id
    }));

    return successResponse(sessionsWithCurrent);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/account/security/sessions?id=123 (or via path param if we used dynamic route)
// Using Search Param for simplicity of a single route file, or could be dynamic.
// Requirement said: DELETE /api/account/security/sessions/{sessionId}
// So we should make a folder [id]
export async function DELETE(request: NextRequest) {
  return errorResponse('Use DELETE /api/account/security/sessions/[id]', 405);
}
