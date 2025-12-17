
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateSession, revokeSessionById } from '@/lib/customer-sessions';
import { logAudit } from '@/lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Auth
    let token = request.cookies.get('customer_session')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token) return errorResponse('Unauthorized', 401);

    const session = await validateSession(token);
    if (!session) return errorResponse('Unauthorized', 401);

    const sessionId = parseInt(id);
    if (isNaN(sessionId)) return errorResponse('Invalid session ID', 400);

    // Prevent revoking current session via this endpoint? Or allow it (logout)?
    // Usually allow, but let's just do standard revoke.

    await revokeSessionById(sessionId, session.customerId.toString());

    logAudit({
      entityType: 'customer',
      entityId: session.customerId.toString(),
      action: 'revoke_session',
      actorId: session.customerId.toString(),
      metadata: { revokedSessionId: sessionId }
    });

    return successResponse({ message: 'Session revoked' });
  } catch (error) {
    return handleApiError(error);
  }
}
