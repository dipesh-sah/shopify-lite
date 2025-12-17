'use server';

import { hashPassword } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAdminUsersAction() {
  const users = await query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.status, r.name as role_name 
    FROM admin_users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    ORDER BY u.created_at DESC
  `);

  return users.map((u: any) => ({
    id: u.id.toString(),
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    status: u.status,
    roleName: u.role_name
  }));
}

export async function getRolesAction() {
  const roles = await query(`SELECT id, name FROM roles ORDER BY name ASC`);
  return roles.map((r: any) => ({
    id: r.id.toString(),
    name: r.name
  }));
}

export async function createAdminUserAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const roleId = formData.get('roleId') as string;

  if (!email || !password || !roleId) {
    throw new Error('Missing required fields');
  }

  const hashedPassword = await hashPassword(password);

  await execute(
    `INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id, status) VALUES (?, ?, ?, ?, ?, 'active')`,
    [email, hashedPassword, firstName, lastName, roleId]
  );

  revalidatePath('/admin/settings/users');
  return { success: true };
}

export async function deleteAdminUserAction(userId: string) {
  await execute(`DELETE FROM admin_users WHERE id = ?`, [userId]);
  revalidatePath('/admin/settings/users');
  return { success: true };
}
