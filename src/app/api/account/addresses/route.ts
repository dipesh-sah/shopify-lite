
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError, parseBody } from '@/lib/api-utils';
import { validateSession } from '@/lib/customer-sessions';
import { getCustomerAddresses, createCustomerAddress, CustomerAddress } from '@/lib/customers';
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

    const addresses = await getCustomerAddresses(session.customerId.toString());
    return successResponse(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    let token = request.cookies.get('customer_session')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token) return errorResponse('Unauthorized', 401);

    const session = await validateSession(token);
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await parseBody<Omit<CustomerAddress, 'id' | 'customerId'>>(request);

    // Basic Validation
    if (!body.address1 || !body.city || !body.country || !body.zip) {
      return errorResponse('Missing required address fields', 400);
    }

    const addressId = await createCustomerAddress(session.customerId.toString(), body);

    logAudit({
      entityType: 'customer',
      entityId: session.customerId.toString(),
      action: 'create_address',
      actorId: session.customerId.toString(),
      metadata: { addressId }
    });

    return successResponse({ id: addressId, message: 'Address created' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
