'use server'

import { getSettings, updateSettings } from '@/lib/settings';
import { getNumberRanges, updateNumberRange, previewNextNumber } from '@/lib/number-ranges';
import { getSessionUserWithPermissions, hasPermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSettingsAction(category: string) {
  // Allow all internal users to read settings for now (or strict RBAC: 'settings.read')
  const user = await getSessionUserWithPermissions();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return await getSettings(category);
}

export async function updateSettingsAction(category: string, data: any) {
  const user = await getSessionUserWithPermissions();
  if (!user || (!hasPermission(user.permissions, 'settings.update') && !hasPermission(user.permissions, '*'))) {
    throw new Error('Unauthorized');
  }

  await updateSettings(category, data);
  revalidatePath('/admin');
}

export async function getNumberRangesAction() {
  const user = await getSessionUserWithPermissions();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return await getNumberRanges();
}

export async function updateNumberRangeAction(id: string, data: any) {
  const user = await getSessionUserWithPermissions();
  if (!user || (!hasPermission(user.permissions, 'settings.update') && !hasPermission(user.permissions, '*'))) {
    throw new Error('Unauthorized');
  }

  await updateNumberRange(id, data);
  revalidatePath('/admin');
}

export async function previewNextNumberAction(type: string) {
  const user = await getSessionUserWithPermissions();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return await previewNextNumber(type);
}
