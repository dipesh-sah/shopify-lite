
import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { revokeSession } from '@/lib/customer-sessions';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Try to get token from header (Bearer) or cookie
    let token = request.cookies.get('customer_session')?.value;

    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      await revokeSession(token);
    }

    (await cookies()).delete('customer_session');

    return successResponse({ message: 'Logged out successfully' });

  } catch (error) {
    return handleApiError(error);
  }
}
