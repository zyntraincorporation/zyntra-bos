'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag, TrendingUp, DollarSign, Megaphone,
  Wallet, Package, BarChart2, Activity
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

const emptyStats: DashboardStats = {
  ordersToday: 0, revenueToday: 0, profitToday: 0, adSpendToday: 0,
  currentCashBalance: 0, inventoryValue: 0,
  monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [chartData, setChartData] = useState<DailyChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adSpends, setAdSpends] = useState<AdSpend[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeOrders(setOrders),
      subscribeProducts(setProducts),
      subscribeExpenses(setExpenses),
      subscribeAdSpend(setAdSpends),
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

  return (
    <div className="page-container space-y-6">

      {/* Today's Snapshot */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Today's Snapshot
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Orders Today"   value={stats.ordersToday}   icon={ShoppingBag} prefix=""          iconColor="text-blue-600"   iconBg="bg-blue-50"   loading={loading} />
          <StatCard label="Revenue Today"  value={stats.revenueToday}  icon={TrendingUp}  prefix="৳"         iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
          <StatCard label="Profit Today"   value={stats.profitToday}   icon={BarChart2}   prefix="৳"         iconColor="text-green-600"  iconBg="bg-green-50"  loading={loading} />
          <StatCard label="Ad Spend Today" value={stats.adSpendToday}  icon={Megaphone}   prefix="৳"         iconColor="text-purple-600" iconBg="bg-purple-50" loading={loading} />
        </div>
      </section>

      {/* Live Business State */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Live Business State
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Cash Balance"    value={stats.currentCashBalance} icon={Wallet}  prefix="৳" iconColor="text-amber-600"  iconBg="bg-amber-50"  loading={loading} />
          <StatCard label="Inventory Value" value={stats.inventoryValue}     icon={Package} prefix="৳" iconColor="text-indigo-600" iconBg="bg-indigo-50" loading={loading} />
        </div>
      </section>

      {/* Monthly Summary */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {month} Summary
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Monthly Revenue"  value={stats.monthlyRevenue}  icon={TrendingUp}  prefix="৳" iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
          <StatCard label="Monthly Expenses" value={stats.monthlyExpenses} icon={DollarSign}  prefix="৳" iconColor="text-red-500"    iconBg="bg-red-50"    loading={loading} />
          <StatCard label="Monthly Profit"   value={stats.monthlyProfit}   icon={Activity}    prefix="৳" iconColor="text-blue-600"   iconBg="bg-blue-50"   loading={loading} />
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Sales Trend</h3>
              <p className="text-xs text-gray-400">{month}</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 rounded-full">Revenue</span>
          </div>
          <SalesTrendChart data={chartData} />
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Ad Spend Trend</h3>
              <p className="text-xs text-gray-400">{month}</p>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-1 rounded-full">Ad Spend</span>
          </div>
          <AdSpendChart data={chartData} />
        </div>
      </div>
    </div>
  );
}
