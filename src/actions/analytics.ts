
"use server"

import * as analytics from "@/lib/analytics"

export async function getAnalyticsUsageAction() {
  try {
    const [sales, topProducts, recentOrders] = await Promise.all([
      analytics.getSalesOverTime(30),
      analytics.getTopProducts(5),
      analytics.getRecentOrders(5)
    ]);

    return {
      sales,
      topProducts,
      recentOrders
    }
  } catch (e) {
    console.error("Analytics Error:", e);
    return { sales: [], topProducts: [], recentOrders: [] }
  }
}
