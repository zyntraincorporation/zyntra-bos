import type { Order, Product, Expense, AdSpend, Investment, DashboardStats, DailyChartPoint } from '@/types';
import { format, isToday, isSameMonth, startOfMonth, eachDayOfInterval, endOfMonth, isAfter } from 'date-fns';

/** Safely converts any Firestore/string/Date value into a JS Date */
export const toDate = (v: unknown): Date => {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
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

  // ── Today metrics ──────────────────────────────────────────
  const todayOrders   = orders.filter(o => isToday(toDate(o.createdAt)));
  const todayDelivered = orders.filter(
    o => o.status === 'Delivered' && isToday(toDate(o.createdAt))
  );

  const revenueToday = todayDelivered.reduce(
    (s, o) => s + o.sellingPrice * o.quantity, 0
  );

  // Today profit = revenue - product cost (COGS) for delivered today
  const profitToday = todayDelivered.reduce((s, o) => {
    const product = products.find(p => p.id === o.productId);
    const cogs = (product?.purchasePrice ?? 0) * o.quantity;
    return s + (o.sellingPrice * o.quantity - cogs);
  }, 0);

  const adSpendToday = adSpends
    .filter(a => isToday(toDate(a.date)))
    .reduce((s, a) => s + a.amount, 0);

  // ── Monthly metrics ────────────────────────────────────────
  const monthDelivered = orders.filter(
    o => o.status === 'Delivered' && isSameMonth(toDate(o.createdAt), now)
  );

  const monthlyRevenue = monthDelivered.reduce(
    (s, o) => s + o.sellingPrice * o.quantity, 0
  );

  const monthlyExpenses =
    expenses
      .filter(e => isSameMonth(toDate(e.date), now))
      .reduce((s, e) => s + e.amount, 0) +
    adSpends
      .filter(a => isSameMonth(toDate(a.date), now))
      .reduce((s, a) => s + a.amount, 0);

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  // ── Inventory ──────────────────────────────────────────────
  const inventoryValue = products.reduce(
    (s, p) => s + p.stock * p.purchasePrice, 0
  );

  // ── Cash balance (all-time) ────────────────────────────────
  // Formula: all investments + all delivered revenue - all expenses - all ad spend
  const totalInvestments = investments.reduce((s, i) => s + i.amount, 0);

  const totalRevenue = orders
    .filter(o => o.status === 'Delivered')
    .reduce((s, o) => s + o.sellingPrice * o.quantity, 0);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalAdSpend  = adSpends.reduce((s, a) => s + a.amount, 0);

  const currentCashBalance =
    totalInvestments + totalRevenue - totalExpenses - totalAdSpend;

  return {
    ordersToday: todayOrders.length,
    revenueToday,
    profitToday,
    adSpendToday,
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
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Only render days up to and including today (no future empty bars)
  const days = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  }).filter(d => !isAfter(d, today));

  return days.map(day => {
    const label  = format(day, 'MMM dd');
    const dayStr = format(day, 'yyyy-MM-dd');

    const revenue = orders
      .filter(
        o =>
          o.status === 'Delivered' &&
          format(toDate(o.createdAt), 'yyyy-MM-dd') === dayStr
      )
      .reduce((s, o) => s + o.sellingPrice * o.quantity, 0);

    const adSpend = adSpends
      .filter(a => {
        const d = typeof a.date === 'string' ? a.date : format(toDate(a.date), 'yyyy-MM-dd');
        return d === dayStr;
      })
      .reduce((s, a) => s + a.amount, 0);

    return { date: label, revenue, adSpend };
  });
}
