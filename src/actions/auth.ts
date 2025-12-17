'use server';

import { createSession, createTemp2FASession, verifyPassword, deleteSession, verifySession } from "@/lib/auth";
import { query } from "@/lib/db";
import { send2FAEmail } from "@/lib/email";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }

  try {
    const users = await query(
      `SELECT id, password_hash, status, two_factor_enabled FROM admin_users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return { error: 'Invalid email or password' };
    }

    const user = users[0];

    if (user.status !== 'active') {
      return { error: 'Account is inactive' };
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    // Check for 2FA
    if (user.two_factor_enabled) {
      // Create Temp Session first so we know who it is
      await createTemp2FASession(user.id.toString());

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to DB
      await query(
        `UPDATE admin_users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`,
        [otp, expiresAt, user.id]
      );

      // Send Email
      await send2FAEmail(email, otp);

      redirect('/admin/login/verify-2fa');
    } else {
      await createSession(user.id.toString());
    }
  } catch (err) {
    // If it's a redirect error, rethrow it (Next.js behavior)
    if ((err as any).message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Login error:', err);
    return { error: 'Something went wrong' };
  }

  redirect('/admin');
}


export async function logoutAction() {
  await deleteSession();
  redirect('/admin/login');
}

export async function getMeAction() {
  const user = await verifySession();
  return user ? { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` } : null;
}

