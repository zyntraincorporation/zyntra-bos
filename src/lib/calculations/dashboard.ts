import type { Order, Product, Expense, AdSpend, Investment, DashboardStats, DailyChartPoint } from '@/types';
import { format, isToday, isSameMonth, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns';

const toDate = (v: unknown): Date => {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  // Firestore Timestamp
  if (typeof v === 'object' && 'seconds' in (v as object)) {
    return new Date((v as { seconds: number }).seconds * 1000);
  }
  return new Date();
};

export function computeDashboardStats(
  orders: Order[],
  products: Product[],
  expenses: Expense[],
  adSpends: AdSpend[],
  investments: Investment[]
): DashboardStats {
  const now = new Date();

  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const todayOrders = orders.filter(o => isToday(toDate(o.createdAt)));
  const monthOrders = deliveredOrders.filter(o => isSameMonth(toDate(o.createdAt), now));
  const todayDelivered = deliveredOrders.filter(o => isToday(toDate(o.createdAt)));

  const revenueToday = todayDelivered.reduce((s, o) => s + o.sellingPrice * o.quantity, 0);
  const monthlyRevenue = monthOrders.reduce((s, o) => s + o.sellingPrice * o.quantity, 0);

  const todayAdSpend = adSpends
    .filter(a => isToday(toDate(a.date)))
    .reduce((s, a) => s + a.amount, 0);

  const monthlyExpenses = expenses
    .filter(e => isSameMonth(toDate(e.date), now))
    .reduce((s, e) => s + e.amount, 0)
    + adSpends
    .filter(a => isSameMonth(toDate(a.date), now))
    .reduce((s, a) => s + a.amount, 0);

  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const profitToday = revenueToday - todayAdSpend;

  const inventoryValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);

  const totalInflow = investments.reduce((s, i) => s + i.amount, 0) + monthlyRevenue;
  const totalOutflow = monthlyExpenses;
  const currentCashBalance = totalInflow - totalOutflow;

  return {
    ordersToday: todayOrders.length,
    revenueToday,
    profitToday,
    adSpendToday: todayAdSpend,
    currentCashBalance,
    inventoryValue,
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit,
  };
}

export function buildChartData(
  orders: Order[],
  adSpends: AdSpend[]
): DailyChartPoint[] {
  const now = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

  return days.map(day => {
    const label = format(day, 'MMM dd');
    const dayStr = format(day, 'yyyy-MM-dd');

    const revenue = orders
      .filter(o => o.status === 'Delivered' && format(toDate(o.createdAt), 'yyyy-MM-dd') === dayStr)
      .reduce((s, o) => s + o.sellingPrice * o.quantity, 0);

    const adSpend = adSpends
      .filter(a => a.date === dayStr)
      .reduce((s, a) => s + a.amount, 0);

    return { date: label, revenue, adSpend };
  });
}
