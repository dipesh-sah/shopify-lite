import { query, execute } from './db';

// Settings Operations
export async function getSettings(category: string = 'general') {
  const rows = await query('SELECT setting_key, setting_value FROM settings WHERE category = ?', [category]);

  if (rows.length > 0) {
    const settings: any = {};
    rows.forEach((row: any) => {
      const val = row.setting_value;
      if (val === 'true' || val === '1') settings[row.setting_key] = true;
      else if (val === 'false' || val === '0') settings[row.setting_key] = false;
      else {
        try {
          settings[row.setting_key] = JSON.parse(val);
        } catch (e) {
          settings[row.setting_key] = val;
        }
      }
    });
    return settings;
  }

  // Return default settings based on category
  return getDefaultSettings(category);
}

export async function updateSettings(category: string, data: any) {
  const keys = Object.keys(data);

  for (const key of keys) {
    let value = data[key];
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }

    // Upsert setting
    await execute(
      `INSERT INTO settings (category, setting_key, setting_value, updated_at) 
       VALUES (?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
      [category, key, value, value]
    );
  }
}

function getDefaultSettings(category: string) {
  const defaults: { [key: string]: any } = {
    general: {
      storeName: 'My Store',
      storeEmail: 'store@example.com',
      storePhone: '',
      storeAddress: '',
      currency: 'USD',
      timezone: 'UTC',
      weightUnit: 'kg',
      dimensionUnit: 'cm',
    },
    payment: {
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeSecretKey: '',
      paypalEnabled: false,
      paypalClientId: '',
      cashOnDeliveryEnabled: true,
    },
    shipping: {
      freeShippingThreshold: 0,
      defaultShippingRate: 0,
      enableLocalPickup: false,
    },
    tax: {
      taxEnabled: false,
      pricesIncludeTax: false,
      displayPricesWithTax: true,
      shippingTaxable: false,
    },
    email: {
      fromName: 'My Store',
      fromEmail: 'noreply@example.com',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      smtpSecure: true,
    },
    notifications: {
      orderConfirmation: true,
      orderShipped: true,
      orderDelivered: true,
      lowStockAlert: true,
      lowStockThreshold: 5,
      newReview: true,
      abandonedCart: true,
      abandonedCartDelay: 1, // hours
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
      googleAnalyticsId: '',
      facebookPixelId: '',
    },
  };

  return defaults[category] || {};
}

// Specific setting getters
export async function getGeneralSettings() {
  return getSettings('general');
}

export async function getPaymentSettings() {
  return getSettings('payment');
}

export async function getShippingSettings() {
  return getSettings('shipping');
}

export async function getTaxSettings() {
  return getSettings('tax');
}

export async function getEmailSettings() {
  return getSettings('email');
}

export async function getNotificationSettings() {
  return getSettings('notifications');
}

export async function getSeoSettings() {
  return getSettings('seo');
}
