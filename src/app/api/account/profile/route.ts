
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError, parseBody } from '@/lib/api-utils';
import { validateSession } from '@/lib/customer-sessions';
import { updateCustomer, Customer } from '@/lib/customers';
import { logAudit } from '@/lib/audit';

export async function PUT(request: NextRequest) {
  try {
    // 1. Auth Check
    let token = request.cookies.get('customer_session')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) return errorResponse('Unauthorized', 401);

    const session = await validateSession(token);
    if (!session) return errorResponse('Unauthorized', 401);

    // 2. Parse Body
    const body = await parseBody<Partial<Customer>>(request);

    // 3. Update Profile
    // Whitelist allowed fields to prevent overwriting sensitive data like system flags
    const allowedUpdates: Partial<Customer> = {};
    if (body.firstName) allowedUpdates.firstName = body.firstName;
    if (body.lastName) allowedUpdates.lastName = body.lastName;
    if (body.phone) allowedUpdates.phone = body.phone;
    if (body.profileImageUrl) allowedUpdates.profileImageUrl = body.profileImageUrl;
    if (body.preferences) allowedUpdates.preferences = body.preferences;

    if (Object.keys(allowedUpdates).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    await updateCustomer(session.customerId.toString(), allowedUpdates);

    // 4. Audit Log
    logAudit({
      entityType: 'customer',
      entityId: session.customerId.toString(),
      action: 'update_profile',
      actorId: session.customerId.toString(),
      metadata: { updates: Object.keys(allowedUpdates) }
    });

    return successResponse({ message: 'Profile updated successfully' });

  } catch (error) {
    return handleApiError(error);
  }
}
