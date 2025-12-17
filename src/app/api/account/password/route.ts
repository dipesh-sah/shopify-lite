
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError, parseBody } from '@/lib/api-utils';
import { validateSession } from '@/lib/customer-sessions';
import { getCustomer, updateCustomer } from '@/lib/customers';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    // Auth
    let token = request.cookies.get('customer_session')?.value;
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token) return errorResponse('Unauthorized', 401);

    const session = await validateSession(token);
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await parseBody<{ currentPassword?: string; newPassword?: string }>(request);

    if (!body.currentPassword || !body.newPassword) {
      return errorResponse('Current and new password are required', 400);
    }

    if (body.newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400);
    }

    // Verify current password - requires fetching full user record (or at least password hash)
    // Optimization: create a specialized getPasswordHash query for security
    const user = await getCustomer(session.customerId.toString());

    // We need the password hash which might not be in the standard getCustomer DTO or is hidden
    // Let's use a direct query for safety or assume we need to update getCustomer to return it internally
    // For now, let's use a direct query as getCustomer probably hides it
    const { query } = require('@/lib/db');
    const rows = await query('SELECT password FROM customers WHERE id = ?', [session.customerId]);
    const currentHash = rows[0]?.password;

    if (!currentHash) {
      return errorResponse('Account does not have a password set', 400);
    }

    const isMatch = await bcrypt.compare(body.currentPassword, currentHash);
    if (!isMatch) {
      return errorResponse('Incorrect current password', 400);
    }

    // Update Password
    const newHash = await bcrypt.hash(body.newPassword, 10);

    // We can use updateCustomer if it supports password, or direct update
    // checking customers.ts... createCustomer supports it, let's see updateCustomer
    // updateCustomer in our current file doesn't seem to have password in interface?
    // Let's check the viewed file... yes, updateCustomer has Partial<Customer>, Customer interface has no password field visibly in the map function? 
    // Wait, the interface in customers.ts file view showed:
    // export interface Customer { ... no password ... }
    // But createCustomer takes password?
    // Let's check updateCustomer implementation again in the file view from earlier...
    // It checked: if (data.firstName !== undefined) ...
    // It does NOT seem to check for password in updateCustomer.
    // So we need to do a direct update or update customers.ts.
    // Direct update is safer for this specific sensitive operation.

    const { execute } = require('@/lib/db');
    await execute('UPDATE customers SET password = ?, updated_at = NOW() WHERE id = ?', [newHash, session.customerId]);

    logAudit({
      entityType: 'customer',
      entityId: session.customerId.toString(),
      action: 'change_password',
      actorId: session.customerId.toString()
    });

    return successResponse({ message: 'Password updated successfully' });

  } catch (error) {
    return handleApiError(error);
  }
}
