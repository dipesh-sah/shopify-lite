
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateSession } from '@/lib/customer-sessions';
import { getCustomer } from '@/lib/customers';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract Token
    let token = request.cookies.get('customer_session')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    // 2. Validate Session
    const session = await validateSession(token);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // 3. Fetch User
    const user = await getCustomer(session.customerId.toString());
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);

  } catch (error) {
    return handleApiError(error);
  }
}
