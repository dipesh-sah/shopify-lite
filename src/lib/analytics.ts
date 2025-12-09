import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
}

// Sales Analytics
export async function getSalesAnalytics(dateRange?: AnalyticsDateRange) {
  const ordersRef = collection(db, 'orders');
  let q;

  if (dateRange) {
    q = query(
      ordersRef,
      where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
      where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
    );
  } else {
    q = query(ordersRef);
  }

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map(doc => doc.data());

  const analytics = {
    totalOrders: orders.length,
    totalRevenue: 0,
    averageOrderValue: 0,
    paidOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  };

  orders.forEach((order: any) => {
    analytics.totalRevenue += order.total || 0;

    if (order.isPaid) analytics.paidOrders++;

    if (order.status === 'PENDING') analytics.pendingOrders++;
    else if (order.status === 'COMPLETED') analytics.completedOrders++;
    else if (order.status === 'CANCELLED') analytics.cancelledOrders++;
  });

  analytics.averageOrderValue = analytics.totalOrders > 0
    ? analytics.totalRevenue / analytics.totalOrders
    : 0;

  return analytics;
}

// Sales by day/week/month
export async function getSalesByPeriod(
  period: 'day' | 'week' | 'month',
  dateRange: AnalyticsDateRange
) {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
    where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const salesByPeriod: { [key: string]: { orders: number; revenue: number } } = {};

  orders.forEach((order: any) => {
    const date = order.createdAt instanceof Timestamp
      ? order.createdAt.toDate()
      : new Date(order.createdAt);

    let periodKey: string;

    if (period === 'day') {
      periodKey = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!salesByPeriod[periodKey]) {
      salesByPeriod[periodKey] = { orders: 0, revenue: 0 };
    }

    salesByPeriod[periodKey].orders++;
    salesByPeriod[periodKey].revenue += order.total || 0;
  });

  return Object.entries(salesByPeriod).map(([period, data]) => ({
    period,
    ...data,
  }));
}

// Product Analytics
export async function getProductAnalytics(dateRange?: AnalyticsDateRange) {
  const ordersRef = collection(db, 'orders');
  let q;

  if (dateRange) {
    q = query(
      ordersRef,
      where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
      where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
    );
  } else {
    q = query(ordersRef);
  }

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map(doc => doc.data());

  const productStats: { [productId: string]: { quantity: number; revenue: number } } = {};

  orders.forEach((order: any) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { quantity: 0, revenue: 0 };
        }

        productStats[item.productId].quantity += item.quantity || 0;
        productStats[item.productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    }
  });

  return Object.entries(productStats).map(([productId, stats]) => ({
    productId,
    ...stats,
  }));
}

// Top selling products
export async function getTopSellingProducts(limitCount: number = 10, dateRange?: AnalyticsDateRange) {
  const productStats = await getProductAnalytics(dateRange);

  return productStats
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limitCount);
}

// Customer Analytics
export async function getCustomerAnalytics(dateRange?: AnalyticsDateRange) {
  const customersRef = collection(db, 'customers');
  const snapshot = await getDocs(customersRef);
  const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const analytics = {
    totalCustomers: customers.length,
    newCustomers: 0,
    returningCustomers: 0,
    averageLifetimeValue: 0,
    totalLifetimeValue: 0,
  };

  if (dateRange) {
    customers.forEach((customer: any) => {
      const createdAt = customer.createdAt instanceof Timestamp
        ? customer.createdAt.toDate()
        : new Date(customer.createdAt);

      if (createdAt >= dateRange.startDate && createdAt <= dateRange.endDate) {
        analytics.newCustomers++;
      }
    });
  }

  customers.forEach((customer: any) => {
    analytics.totalLifetimeValue += customer.totalSpent || 0;

    if ((customer.totalOrders || 0) > 1) {
      analytics.returningCustomers++;
    }
  });

  analytics.averageLifetimeValue = analytics.totalCustomers > 0
    ? analytics.totalLifetimeValue / analytics.totalCustomers
    : 0;

  return analytics;
}

// Inventory Analytics
export async function getInventoryAnalytics() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const analytics = {
    totalProducts: products.length,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalInventoryValue: 0,
  };

  products.forEach((product: any) => {
    const stock = product.stock || 0;
    const lowStockThreshold = product.lowStockThreshold || 5;

    if (stock === 0) {
      analytics.outOfStockProducts++;
    } else if (stock <= lowStockThreshold) {
      analytics.lowStockProducts++;
    }

    analytics.totalInventoryValue += (product.costPrice || product.price || 0) * stock;
  });

  return analytics;
}

// Low stock products
export async function getLowStockProducts() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return products.filter((product: any) => {
    const stock = product.stock || 0;
    const lowStockThreshold = product.lowStockThreshold || 5;
    return stock > 0 && stock <= lowStockThreshold;
  });
}

// Out of stock products
export async function getOutOfStockProducts() {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('stock', '==', 0));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Conversion Rate
export async function getConversionRate(dateRange?: AnalyticsDateRange) {
  // This would require tracking sessions/visitors
  // For now, return a placeholder
  return {
    visitors: 0,
    orders: 0,
    conversionRate: 0,
  };
}

// Dashboard Summary
export async function getDashboardSummary() {
  const today = new Date();
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dateRange = {
    startDate: last30Days,
    endDate: today,
  };

  const [sales, customers, inventory] = await Promise.all([
    getSalesAnalytics(dateRange),
    getCustomerAnalytics(dateRange),
    getInventoryAnalytics(),
  ]);

  return {
    sales,
    customers,
    inventory,
    period: 'Last 30 days',
  };
}
