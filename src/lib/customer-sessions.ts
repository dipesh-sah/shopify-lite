
import { execute, query } from './db';
import { serializeDate } from './utils';
import crypto from 'crypto';

export interface CustomerSession {
  id: number;
  customerId: number;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  lastActiveAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export async function createSession(customerId: string, userAgent?: string, ipAddress?: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await execute(
    `INSERT INTO customer_sessions (customer_id, token, user_agent, ip_address, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [customerId, token, userAgent || null, ipAddress || null, expiresAt]
  );

  return token;
}

export async function validateSession(token: string): Promise<CustomerSession | null> {
  const rows = await query(
    `SELECT * FROM customer_sessions WHERE token = ? AND expires_at > NOW()`,
    [token]
  );

  if (rows.length === 0) return null;

  const session = rows[0];

  // Update last active
  await execute(
    `UPDATE customer_sessions SET last_active_at = NOW() WHERE id = ?`,
    [session.id]
  );

  return {
    id: session.id,
    customerId: session.customer_id,
    token: session.token,
    userAgent: session.user_agent,
    ipAddress: session.ip_address,
    lastActiveAt: serializeDate(session.last_active_at),
    expiresAt: serializeDate(session.expires_at),
    createdAt: serializeDate(session.created_at),
  };
}

export async function revokeSession(token: string) {
  await execute('DELETE FROM customer_sessions WHERE token = ?', [token]);
}

export async function revokeSessionById(sessionId: number, customerId: string) {
  await execute('DELETE FROM customer_sessions WHERE id = ? AND customer_id = ?', [sessionId, customerId]);
}

export async function revokeAllSessions(customerId: string) {
  await execute('DELETE FROM customer_sessions WHERE customer_id = ?', [customerId]);
}

export async function listSessions(customerId: string) {
  const rows = await query(
    `SELECT * FROM customer_sessions WHERE customer_id = ? ORDER BY last_active_at DESC`,
    [customerId]
  );

  return rows.map((session: any) => ({
    id: session.id,
    userAgent: session.user_agent,
    ipAddress: session.ip_address,
    lastActiveAt: serializeDate(session.last_active_at),
    createdAt: serializeDate(session.created_at),
    isCurrent: false // Backend doesn't know "current" without token context, managed by caller
  }));
}
