'use server'

import { query, execute } from '@/lib/db';
import { hashPassword, getSessionUserWithPermissions, hasPermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getUsersAction() {
  const user = await getSessionUserWithPermissions();
  if (!user || !hasPermission(user.permissions, 'users.read') && !hasPermission(user.permissions, '*')) {
    // Basic protection: if no specific permission, allow if admin or just return self?
    // For now strict RBAC: need users.read or *
    // Correction: If permission logic fails (e.g. initial setup), we might want to be careful.
    // Assuming seed set Admin with '*'
    if (!user?.permissions.includes('*') && !user?.permissions.includes('users.read')) {
      return [];
    }
  }

  const rows = await query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at, r.name as role_name
    FROM admin_users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `);

  return rows.map((r: any) => ({
    id: r.id.toString(),
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    status: r.status,
    roleName: r.role_name,
    createdAt: r.created_at
  }));
}

export async function createUserAction(data: {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  password?: string;
}) {
  const user = await getSessionUserWithPermissions();
  if (!user || (!hasPermission(user.permissions, 'users.create') && !hasPermission(user.permissions, '*'))) {
    throw new Error('Unauthorized');
  }

  const password = data.password || 'password123'; // Default temp password
  const hashed = await hashPassword(password);

  await execute(
    `INSERT INTO admin_users (email, first_name, last_name, role_id, password_hash, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
    [data.email, data.firstName, data.lastName, data.roleId, hashed]
  );

  revalidatePath('/admin/users');
}

export async function updateUserAction(id: string, data: {
  firstName?: string;
  lastName?: string;
  roleId?: string;
  status?: string;
  password?: string;
}) {
  const user = await getSessionUserWithPermissions();
  if (!user || (!hasPermission(user.permissions, 'users.update') && !hasPermission(user.permissions, '*'))) {
    throw new Error('Unauthorized');
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (data.firstName) { updates.push('first_name = ?'); values.push(data.firstName); }
  if (data.lastName) { updates.push('last_name = ?'); values.push(data.lastName); }
  if (data.roleId) { updates.push('role_id = ?'); values.push(data.roleId); }
  if (data.status) { updates.push('status = ?'); values.push(data.status); }
  if (data.password) {
    const hashed = await hashPassword(data.password);
    updates.push('password_hash = ?');
    values.push(hashed);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(id);
    await execute(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`, values);
    revalidatePath('/admin/users');
  }
}

export async function deleteUserAction(id: string) {
  const user = await getSessionUserWithPermissions();
  if (!user || (!hasPermission(user.permissions, 'users.delete') && !hasPermission(user.permissions, '*'))) {
    throw new Error('Unauthorized');
  }

  // Prevent self-delete
  if (user.id === id) {
    throw new Error('Cannot delete your own account');
  }

  await execute('DELETE FROM admin_users WHERE id = ?', [id]);
  revalidatePath('/admin/users');
}

export async function getRolesAction() {
  const rows = await query('SELECT id, name FROM roles ORDER BY name');
  return rows.map((r: any) => ({
    id: r.id.toString(),
    name: r.name
  }));
}
