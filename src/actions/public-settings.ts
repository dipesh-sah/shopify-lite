'use server'

import { getPaymentSettings } from '@/lib/settings';

export async function getPaymentMethodsAction() {
  const settings = await getPaymentSettings();

  // Return only public safe info
  return {
    cashOnDeliveryEnabled: !!settings.cashOnDeliveryEnabled,
    stripeEnabled: !!settings.stripeEnabled,
    stripePublishableKey: settings.stripeEnabled ? settings.stripePublishableKey : null,
    // Add other methods here if needed (e.g. PayPal)
  };
}
