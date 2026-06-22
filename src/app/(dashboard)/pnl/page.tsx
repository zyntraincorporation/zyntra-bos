'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { getOrders } from '@/lib/firestore/orders';
import { getProducts } from '@/lib/firestore/products';
import { subscribeAdSpend } from '@/lib/firestore/adSpend';
import { calcProductProfitSummary } from '@/lib/calculations/profit';
import type { Order, Product, AdSpend } from '@/types';
import { isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PnLPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adSpends, setAdSpends] = useState<AdSpend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAdSpend(setAdSpends);
    Promise.all([getOrders(), getProducts()]).then(([o, p]) => {
      setOrders(o); setProducts(p); setLoading(false);
    });
    return () => unsub();
  }, []);

  const productMap = Object.fromEntries(products.map(p => [p.id, p.purchasePrice]));
  const summary = calcProductProfitSummary(orders, productMap, adSpends);
  const monthSummary = calcProductProfitSummary(
    orders.filter(o => { try { return isSameMonth(new Date(o.createdAt as string), new Date()); } catch { return false; } }),
    productMap, adSpends
  );

  const totalRevenue = summary.reduce((s, p) => s + p.revenue, 0);
  const totalProfit = summary.reduce((s, p) => s + p.netProfit, 0);
  const totalAdSpend = summary.reduce((s, p) => s + p.adSpent, 0);
  const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div className="page-container space-y-5">
      {/* All-time summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: totalRevenue, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Total Profit', value: totalProfit, color: totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600', bg: totalProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          { label: 'Ad Spend', value: totalAdSpend, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Avg Margin', value: `${overallMargin}%`, color: 'text-gray-800', bg: 'bg-gray-50', isPercent: true },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl p-4 text-center', s.bg)}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn('text-xl font-bold', s.color)}>{s.isPercent ? s.value : `৳${(s.value as number).toLocaleString()}`}</p>
          </div>
        ))}
      </div>

      {/* Product-wise table */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">Product Profit Analysis (All Time)</h2>
        <div className="stat-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Units</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Revenue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">COGS</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Ad Spend</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Profit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Margin</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>}
              {!loading && summary.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No delivered orders yet</td></tr>
              )}
              {summary.map(p => (
                <tr key={p.productId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.productName}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.unitsSold}</td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">৳{p.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">৳{p.cogs.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-purple-600 hidden md:table-cell">৳{p.adSpent.toLocaleString()}</td>
                  <td className={cn('px-4 py-3 text-right font-bold', p.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    ৳{p.netProfit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-full',
                      p.margin >= 30 ? 'bg-emerald-100 text-emerald-700' :
                      p.margin >= 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600')}>
                      {p.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
