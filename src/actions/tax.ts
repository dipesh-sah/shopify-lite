
'use server';

import { revalidatePath } from 'next/cache';
import {
  getTaxClasses, createTaxClass, updateTaxClass, deleteTaxClass,
  getTaxRules, createTaxRule, updateTaxRule, deleteTaxRule,
  calculateOrderTax, TaxClass, TaxRule
} from '../lib/tax';
import { getTaxSettings, updateSettings } from '../lib/settings';

// --- Calculation ---

export async function calculateTaxAction(data: {
  items: Array<{ productId: string, variantId?: string, price: number, quantity: number }>;
  address: { country: string, state?: string, zip?: string };
  shippingCost: number;
}) {
  return await calculateOrderTax(data.items, data.address, data.shippingCost);
}

// --- Settings ---

export async function getTaxSettingsAction() {
  return await getTaxSettings();
}

export async function updateTaxSettingsAction(data: any) {
  try {
    await updateSettings('tax', data);
    revalidatePath('/admin/settings/taxes');
    return { success: true };
  } catch (error) {
    console.error('Failed to update tax settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

// --- Tax Classes ---

export async function getTaxClassesAction() {
  return await getTaxClasses();
}

export async function createTaxClassAction(data: { name: string; isDefault: boolean }) {
  try {
    await createTaxClass(data.name, data.isDefault);
    revalidatePath('/admin/settings/taxes');
    return { success: true };
  } catch (error) {
    console.error('Failed to create tax class:', error);
    return { success: false, error: 'Failed to create tax class' };
  }
}

export async function updateTaxClassAction(id: number, data: { name: string; isDefault: boolean }) {
  try {
    await updateTaxClass(id, data.name, data.isDefault);
    revalidatePath('/admin/settings/taxes');
    return { success: true };
  } catch (error) {
    console.error('Failed to update tax class:', error);
    return { success: false, error: 'Failed to update tax class' };
  }
}

export async function deleteTaxClassAction(id: number) {
  try {
    await deleteTaxClass(id);
    revalidatePath('/admin/settings/taxes');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete tax class:', error);
    return { success: false, error: 'Failed to delete tax class' };
  }
}

// --- Tax Rules ---

export async function getTaxRulesAction() {
  return await getTaxRules();
}

export async function createTaxRuleAction(data: any) {
  try {
    // Validate required fields?
    await createTaxRule(data);
    revalidatePath('/admin/settings/taxes'); // Or specific rule list page
    return { success: true };
  } catch (error) {
    console.error('Failed to create tax rule:', error);
    return { success: false, error: 'Failed to create tax rule' };
  }
}

export async function updateTaxRuleAction(id: number, data: any) {
  try {
    await updateTaxRule(id, data);
    revalidatePath('/admin/settings/taxes');
    return { success: true };
  } catch (error) {
    console.error('Failed to update tax rule:', error);
    return { success: false, error: 'Failed to update tax rule' };
  }
}

export async function deleteTaxRuleAction(id: number) {
  try {
    await deleteTaxRule(id);
    revalidatePath('/admin/settings/taxes');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete tax rule:', error);
    return { success: false, error: 'Failed to delete tax rule' };
  }
}
