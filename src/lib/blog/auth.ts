/**
 * TemporaryAuth Helpers
 * Note: This is a placeholder. Will be replaced with NextAuth implementation
 */

import { NextRequest } from 'next/server';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'editor' | 'admin';
}

/**
 * Get current authenticated user from request
 * TODO: Implement with NextAuth
 */
export async function getCurrentUser(_request: NextRequest): Promise<AuthUser | null> {
  // TEMPORARY: Return mock admin user for testing
  // TODO: Replace with actual NextAuth session when implemented
  return {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  };

  /* Original placeholder code (will be uncommented when NextAuth is ready):
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  // TODO: Validate JWT token and return user
  return null;
  */
}

/**
 * Require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Array<'customer' | 'editor' | 'admin'>
): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  return user;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'admin';
}

/**
 * Check if user is editor or admin
 */
export async function isEditorOrAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'editor' || user?.role === 'admin';
}
