// Stubs for analytics to replace Firebase
export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

export async function getSalesAnalytics(dateRange?: AnalyticsDateRange) {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    paidOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  };
}

export async function getSalesByPeriod(
  period: 'day' | 'week' | 'month',
  dateRange: AnalyticsDateRange
) {
  return [];
}

export async function getProductAnalytics(dateRange?: AnalyticsDateRange) {
  return [];
}

export async function getTopSellingProducts(limitCount: number = 10, dateRange?: AnalyticsDateRange) {
  return [];
}

export async function getCustomerAnalytics(dateRange?: AnalyticsDateRange) {
  return {
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    averageLifetimeValue: 0,
    totalLifetimeValue: 0,
  };
}

export async function getInventoryAnalytics() {
  return {
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalInventoryValue: 0,
  };
}

export async function getLowStockProducts() {
  return [];
}

export async function getOutOfStockProducts() {
  return [];
}

export async function getConversionRate(dateRange?: AnalyticsDateRange) {
  return {
    visitors: 0,
    orders: 0,
    conversionRate: 0,
  };
}

export async function getDashboardSummary() {
  return {
    sales: await getSalesAnalytics(),
    customers: await getCustomerAnalytics(),
    inventory: await getInventoryAnalytics(),
    period: 'Last 30 days',
  };
}
