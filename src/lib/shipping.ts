
import { execute, query } from './db';

export interface ShippingZone {
  id: number;
  name: string;
  countries: string[]; // List of country codes
}

export interface ShippingMethod {
  id: number;
  zone_id: number;
  name: string;
  description?: string;
}

export interface ShippingRate {
  id: number;
  method_id: number;
  name?: string;
  min_weight?: number;
  max_weight?: number;
  min_price?: number;
  max_price?: number;
  rate: number;
}

// --- Zones ---

export async function getShippingZones() {
  return query('SELECT * FROM shipping_zones');
}

export async function createShippingZone(name: string, countries: string[]) {
  return execute('INSERT INTO shipping_zones (name, countries) VALUES (?, ?)', [name, JSON.stringify(countries)]);
}

// --- Methods ---

export async function getShippingMethods(zoneId: number) {
  return query('SELECT * FROM shipping_methods WHERE zone_id = ?', [zoneId]);
}

export async function createShippingMethod(zoneId: number, name: string, description?: string) {
  return execute('INSERT INTO shipping_methods (zone_id, name, description) VALUES (?, ?, ?)', [zoneId, name, description]);
}

// --- Rates ---

export async function getShippingRates(methodId: number) {
  return query('SELECT * FROM shipping_rates WHERE method_id = ?', [methodId]);
}

export async function createShippingRate(rateData: Omit<ShippingRate, 'id'>) {
  const { method_id, name, min_weight, max_weight, min_price, max_price, rate } = rateData;
  return execute(
    `INSERT INTO shipping_rates (method_id, name, min_weight, max_weight, min_price, max_price, rate) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [method_id, name, min_weight || 0, max_weight || null, min_price || 0, max_price || null, rate]
  );
}

// --- Calculation ---

export async function calculateShipping(countryCode: string, totalWeight: number, totalPrice: number) {
  // 1. Find Zone matches (naive implementation: select all and filter in JS if JSON_CONTAINS is tricky with exact match inside array, 
  // but MySQL 5.7+ supports JSON_CONTAINS. Let's try to do it effectively).
  // Assuming 'countries' is ["US", "CA"] etc.

  // Fetch all zones and filter. simpler for now.
  const zones: any[] = await query('SELECT * FROM shipping_zones');

  let matchedZoneIds: number[] = [];

  for (const zone of zones) {
    let countries: string[] = [];
    try {
      if (typeof zone.countries === 'string') {
        countries = JSON.parse(zone.countries);
      } else if (Array.isArray(zone.countries)) {
        countries = zone.countries;
      }
    } catch (e) { console.error(e); }

    if (countries.includes(countryCode) || countries.includes('*')) {
      matchedZoneIds.push(zone.id);
    }
  }

  if (matchedZoneIds.length === 0) return [];

  // 2. Fetch methods for these zones
  if (matchedZoneIds.length === 0) return [];
  const zonePlaceholders = matchedZoneIds.map(() => '?').join(',');
  const methods: any[] = await query(`SELECT * FROM shipping_methods WHERE zone_id IN (${zonePlaceholders})`, matchedZoneIds);
  if (methods.length === 0) return [];

  const methodIds = methods.map(m => m.id);
  const methodPlaceholders = methodIds.map(() => '?').join(',');
  const rates: any[] = await query(`SELECT * FROM shipping_rates WHERE method_id IN (${methodPlaceholders})`, methodIds);

  const applicableRates = [];

  for (const method of methods) {
    // Find matching rate for this method
    // Logic: satisfy weight and price constraints
    const methodRates = rates.filter(r => r.method_id === method.id);

    // Simplest logic: Find FIRST rate that matches criteria. Or all? Usually just one per method applies.
    // If multiple apply, maybe cheapest or specific logical order. Let's return all valid options.

    for (const rate of methodRates) {
      const minW = rate.min_weight || 0;
      const maxW = rate.max_weight || Infinity;
      const minP = rate.min_price || 0;
      const maxP = rate.max_price || Infinity;

      if (totalWeight >= minW && totalWeight <= maxW && totalPrice >= minP && totalPrice <= maxP) {
        applicableRates.push({
          methodId: method.id,
          methodName: method.name,
          description: method.description,
          rateId: rate.id,
          cost: rate.rate,
          label: rate.name || method.name
        });
      }
    }
  }

  return applicableRates;
}
