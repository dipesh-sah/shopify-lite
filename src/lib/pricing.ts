
export function getBulkPricingTiers(basePrice: number) {
  return [
    { label: '1-9 items', price: basePrice, minQty: 1 },
    { label: '10-49 items', price: Number((basePrice * 0.95).toFixed(2)), minQty: 10 },
    { label: '50+ items', price: Number((basePrice * 0.90).toFixed(2)), minQty: 50 },
  ];
}
