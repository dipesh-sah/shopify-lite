
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError, parseBody } from '@/lib/api-utils';
import { query } from '@/lib/db';
import { createSession } from '@/lib/customer-sessions';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<{ email?: string; password?: string }>(request);
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // 1. Find user
    const users = await query('SELECT * FROM customers WHERE email = ?', [email]) as any[];
    if (users.length === 0) {
      return errorResponse('Invalid credentials', 401);
    }

    const user = users[0];

    // 2. Verify password
    if (!user.password) {
      return errorResponse('Password not set for this account', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    if (!user.is_active) {
      return errorResponse('Account is deactivated', 403);
    }

    // 3. Create Session
    const token = await createSession(user.id.toString(), request.headers.get('user-agent') || undefined);

    // 4. Log Audit
    logAudit({
      entityType: 'customer',
      entityId: user.id.toString(),
      action: 'login',
      actorId: user.id.toString(),
      metadata: { source: 'api' }
    });

    // 5. Set Cookie (for browser clients compatibility)
    // For pure API clients, they should use the returned token
    (await cookies()).set("customer_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}
