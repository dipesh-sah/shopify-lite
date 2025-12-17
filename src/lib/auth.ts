import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query } from "./db";

const SESSION_COOKIE = "admin_session";
const TEMP_2FA_COOKIE = "admin_temp_2fa";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  twoFactorEnabled?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  // Clear temp cookie if exists
  const cookieStore = await cookies();
  cookieStore.delete(TEMP_2FA_COOKIE);

  // Simple session for now: just the user ID in a cookie
  // In a real app, use a session table or JWT
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Ensure this is false on localhost
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function createTemp2FASession(userId: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const cookieStore = await cookies();

  cookieStore.set(TEMP_2FA_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function verifyTemp2FASession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TEMP_2FA_COOKIE)?.value || null;
}

export async function login(email: string, password: string): Promise<AdminUser | null> {
  const users = await query(
    `SELECT id, email, password_hash, first_name, last_name, role_id, status, two_factor_enabled FROM admin_users WHERE email = ?`,
    [email]
  );

  if (users.length === 0) return null;

  const user = users[0];

  if (user.status !== 'active') return null;

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) return null;

  return {
    id: user.id.toString(),
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    roleId: user.role_id,
    twoFactorEnabled: !!user.two_factor_enabled
  };
}

export async function verifySession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) return null;

  const users = await query(
    `SELECT id, email, first_name, last_name, role_id, two_factor_enabled FROM admin_users WHERE id = ? AND status = 'active'`,
    [userId]
  );

  if (users.length === 0) return null;

  const u = users[0];
  return {
    id: u.id.toString(),
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    roleId: u.role_id,
    twoFactorEnabled: !!u.two_factor_enabled
  };
}

export async function getSessionUserWithPermissions(): Promise<(AdminUser & { permissions: string[] }) | null> {
  const user = await verifySession();
  if (!user) return null;

  const roles = await query(`SELECT permissions FROM roles WHERE id = ?`, [user.roleId]);
  let permissions: string[] = [];

  if (roles.length > 0) {
    try {
      // Handle if double stringified or already object
      const p = roles[0].permissions;
      permissions = typeof p === 'string' ? JSON.parse(p) : p;
    } catch (e) {
      permissions = [];
    }
  }

  return { ...user, permissions };
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  // Handle wildcard scopes like 'orders.*' matching 'orders.read'
  const [scope] = requiredPermission.split('.');
  if (userPermissions.includes(`${scope}.*`)) return true;

  return false;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(TEMP_2FA_COOKIE);
}
