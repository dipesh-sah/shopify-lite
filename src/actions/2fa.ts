'use server';

import {
  verifyTemp2FASession,
  createSession,
  getSessionUserWithPermissions
} from "@/lib/auth";
import { query } from "@/lib/db";
import { send2FAEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
// Get 2FA Status
export async function get2FAStatusAction() {
  const user = await getSessionUserWithPermissions();
  if (!user) {
    return { error: 'Unauthorized' };
  }
  return { enabled: !!user.twoFactorEnabled };
}

// Enable 2FA (Simple toggle for now, could verify email first)
export async function enable2FAAction() {
  const user = await getSessionUserWithPermissions();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    await query(
      `UPDATE admin_users SET two_factor_enabled = 1 WHERE id = ?`,
      [user.id]
    );

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { error: 'Failed to enable 2FA' };
  }
}

// Disable 2FA
export async function disable2FAAction() {
  const user = await getSessionUserWithPermissions();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    await query(
      `UPDATE admin_users SET two_factor_enabled = 0, otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
      [user.id]
    );

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to disable 2FA' };
  }
}

// Verify 2FA during Login
export async function verify2FALoginAction(token: string) {
  const userId = await verifyTemp2FASession();

  if (!userId) {
    return { error: 'Session expired. Please login again.' };
  }

  const users = await query(
    `SELECT otp_code, otp_expires_at FROM admin_users WHERE id = ?`,
    [userId]
  );

  if (users.length === 0) {
    return { error: 'User not found' };
  }

  const user = users[0];

  if (!user.otp_code || !user.otp_expires_at) {
    return { error: 'No OTP requested. Please login again.' };
  }

  if (new Date() > new Date(user.otp_expires_at)) {
    return { error: 'Code expired. Please request a new one.' };
  }

  if (user.otp_code !== token) {
    return { error: 'Invalid verification code' };
  }

  // If verified, valid, create real session & clear OTP
  await query(
    `UPDATE admin_users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?`,
    [userId]
  );

  await createSession(userId);
  return { success: true };
}

// Resend OTP Action
export async function resendOTPAction() {
  const userId = await verifyTemp2FASession();

  if (!userId) {
    return { error: 'Session expired' };
  }

  const users = await query(
    `SELECT email FROM admin_users WHERE id = ?`,
    [userId]
  );

  if (users.length === 0) return { error: 'User not found' };

  const email = users[0].email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await query(
    `UPDATE admin_users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`,
    [otp, expiresAt, userId]
  );

  await send2FAEmail(email, otp);

  return { success: true };
}
