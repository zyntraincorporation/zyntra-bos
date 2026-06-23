'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag, TrendingUp, DollarSign, Wallet,
  Package, BarChart2, Activity, Sparkles, AlertTriangle, Star, Megaphone
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { AdSpendChart } from '@/components/dashboard/AdSpendChart';
import { subscribeOrders } from '@/lib/firestore/orders';
import { subscribeProducts } from '@/lib/firestore/products';
import { subscribeExpenses } from '@/lib/firestore/expenses';
import { subscribeAdSpend } from '@/lib/firestore/adSpend';
import { subscribeInvestments } from '@/lib/firestore/investments';
import { computeDashboardStats, buildChartData } from '@/lib/calculations/dashboard';
import type { Order, Product, Expense, AdSpend, Investment, DashboardStats, DailyChartPoint } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const emptyStats: DashboardStats = {
  ordersToday: 0, revenueToday: 0, profitToday: 0, adSpendToday: 0,
  currentCashBalance: 0, inventoryValue: 0,
  monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [chartData, setChartData] = useState<DailyChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders]       = useState<Order[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [adSpends, setAdSpends]   = useState<AdSpend[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeOrders(setOrders, 500),
      subscribeProducts(setProducts),
      subscribeExpenses(setExpenses, 500),
      subscribeAdSpend(setAdSpends, 500),
      subscribeInvestments(setInvestments),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  useEffect(() => {
    const s = computeDashboardStats(orders, products, expenses, adSpends, investments);
    const c = buildChartData(orders, adSpends);
    setStats(s);
    setChartData(c);
    setLoading(false);
  }, [orders, products, expenses, adSpends, investments]);

  const month = format(new Date(), 'MMMM yyyy');

  // ── Insights ────────────────────────────────────────────
  const productSales: Record<string, number> = {};
  orders.forEach(o => {
    if (o.status === 'Delivered') {
      productSales[o.productName] = (productSales[o.productName] || 0) + o.quantity;
    }
  });
  const bestSellingProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
  const bestSellingName    = bestSellingProduct?.[0] ?? 'N/A';
  const bestSellingSold    = bestSellingProduct?.[1] ?? 0;

  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);

  const productAdSpends: Record<string, number> = {};
  adSpends.forEach(a => {
    productAdSpends[a.productName] = (productAdSpends[a.productName] || 0) + a.amount;
  });
  const topAdProduct = Object.entries(productAdSpends).sort((a, b) => b[1] - a[1])[0];

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  return (
    <div className="page-container space-y-6">

      {/* ── Today metrics ──────────────────────────────── */}
      <section>
        <p className="section-label">Command Center — Today</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Orders Today"
            value={stats.ordersToday}
            icon={ShoppingBag}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            loading={loading}
          />
          <StatCard
            label="Revenue Today"
            value={stats.revenueToday}
            icon={TrendingUp}
            prefix="৳"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            loading={loading}
          />
          <StatCard
            label="Profit Today"
            value={stats.profitToday}
            icon={BarChart2}
            prefix="৳"
            iconColor="text-green-600"
            iconBg="bg-green-50"
            loading={loading}
          />
          <StatCard
            label="Cash Balance"
            value={stats.currentCashBalance}
            icon={Wallet}
            prefix="৳"
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            loading={loading}
          />
        </div>
      </section>

      {/* ── Monthly overview ───────────────────────────── */}
      <section>
        <p className="section-label">Monthly Overview — {month}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Inventory Value"
            value={stats.inventoryValue}
            icon={Package}
            prefix="৳"
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            loading={loading}
          />
          <StatCard
            label="Revenue"
            value={stats.monthlyRevenue}
            icon={TrendingUp}
            prefix="৳"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            loading={loading}
          />
          <StatCard
            label="Expenses"
            value={stats.monthlyExpenses}
            icon={DollarSign}
            prefix="৳"
            iconColor="text-red-500"
            iconBg="bg-red-50"
            loading={loading}
          />
          <StatCard
            label="Net Profit"
            value={stats.monthlyProfit}
            icon={Activity}
            prefix="৳"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            loading={loading}
          />
        </div>
      </section>

      {/* ── Insight cards ──────────────────────────────── */}
      <section>
        <p className="section-label flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Business Insights
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Best seller */}
          <div className={cn('card flex items-center gap-4', loading && 'animate-pulse-soft')}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="metric-label">Best Selling Product</p>
              <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{bestSellingName}</p>
              {bestSellingSold > 0 && (
                <p className="text-xs text-gray-400">{bestSellingSold} units sold</p>
              )}
            </div>
          </div>

          {/* Low stock */}
          <div className={cn(
            'card flex items-center gap-4',
            lowStockProducts.length > 0 ? 'border-red-200 bg-red-50/30' : '',
            loading && 'animate-pulse-soft'
          )}>
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              lowStockProducts.length > 0 ? 'bg-red-100' : 'bg-emerald-50'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5',
                lowStockProducts.length > 0 ? 'text-red-500' : 'text-emerald-600'
              )} />
            </div>
            <div className="min-w-0">
              <p className="metric-label">Low Stock Alert</p>
              <p className={cn(
                'text-sm font-bold truncate mt-0.5',
                lowStockProducts.length > 0 ? 'text-red-600' : 'text-emerald-700'
              )}>
                {lowStockProducts.length > 0
                  ? `${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} need restock`
                  : 'All stock optimal'}
              </p>
              {lowStockProducts.length > 0 && (
                <p className="text-xs text-red-400 truncate">
                  {lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}
                  {lowStockProducts.length > 2 ? ` +${lowStockProducts.length - 2} more` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Pending orders */}
          <div className={cn(
            'card flex items-center gap-4',
            pendingOrders > 0 ? 'border-amber-200 bg-amber-50/30' : '',
            loading && 'animate-pulse-soft'
          )}>
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              pendingOrders > 0 ? 'bg-amber-100' : 'bg-gray-100'
            )}>
              <Megaphone className={cn(
                'w-5 h-5',
                pendingOrders > 0 ? 'text-amber-600' : 'text-gray-400'
              )} />
            </div>
            <div className="min-w-0">
              <p className="metric-label">
                {topAdProduct ? 'Highest Ad Spend' : 'Pending Orders'}
              </p>
              <p className="text-sm font-bold text-gray-900 truncate mt-0.5">
                {topAdProduct
                  ? topAdProduct[0]
                  : pendingOrders > 0
                    ? `${pendingOrders} awaiting action`
                    : 'No pending orders'}
              </p>
              {topAdProduct && (
                <p className="text-xs text-gray-400">৳{topAdProduct[1].toLocaleString()} total</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────── */}
      <section>
        <p className="section-label">Trends — {month}</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Sales & Revenue</h3>
                <p className="text-xs text-gray-400">Daily delivered orders</p>
              </div>
              <span className="badge badge-green">Revenue</span>
            </div>
            <SalesTrendChart data={chartData} />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Ad Spend Trend</h3>
                <p className="text-xs text-gray-400">Daily advertising cost</p>
              </div>
              <span className="badge badge-purple">Ad Spend</span>
            </div>
            <AdSpendChart data={chartData} />
          </div>
        </div>
      </section>
    </div>
  );
}
