'use client';

import { useEffect, useState } from 'react';
import { Plus, Megaphone } from 'lucide-react';
import { subscribeAdSpend } from '@/lib/firestore/adSpend';
import { AddAdSpendDialog } from '@/components/ads/AddAdSpendDialog';
import type { AdSpend } from '@/types';
import { isToday, isSameMonth } from 'date-fns';

export default function AdsPage() {
  const [adSpends, setAdSpends] = useState<AdSpend[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => subscribeAdSpend(setAdSpends), []);

  const todayTotal = adSpends.filter(a => { try { return isToday(new Date(a.date)); } catch { return false; } }).reduce((s, a) => s + a.amount, 0);
  const monthTotal = adSpends.filter(a => { try { return isSameMonth(new Date(a.date), new Date()); } catch { return false; } }).reduce((s, a) => s + a.amount, 0);
  const allTotal = adSpends.reduce((s, a) => s + a.amount, 0);

  // Group by product
  const byProduct: Record<string, { name: string; total: number; thisMonth: number; today: number }> = {};
  adSpends.forEach(a => {
    if (!byProduct[a.productId]) byProduct[a.productId] = { name: a.productName, total: 0, thisMonth: 0, today: 0 };
    byProduct[a.productId].total += a.amount;
    try {
      if (isSameMonth(new Date(a.date), new Date())) byProduct[a.productId].thisMonth += a.amount;
      if (isToday(new Date(a.date))) byProduct[a.productId].today += a.amount;
    } catch {}
  });

  return (
    <div className="page-container space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: todayTotal, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'This Month', value: monthTotal, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'All Time', value: allTotal, color: 'text-gray-800', bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className="stat-card text-center py-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>৳{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Ad Spend by Product</h2>
        <button onClick={() => setShowDialog(true)} className="btn-emerald flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Ad Spend
        </button>
      </div>

      {/* Product breakdown */}
      <div className="space-y-3">
        {Object.keys(byProduct).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No ad spend recorded yet</p>
          </div>
        )}
        {Object.entries(byProduct).map(([id, p]) => (
          <div key={id} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900">{p.name}</p>
              <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-1 rounded-full">৳{p.total.toLocaleString()} total</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-[10px] text-gray-400">Today</p>
                <p className="text-sm font-bold text-gray-800">৳{p.today.toLocaleString()}</p>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-2">
                <p className="text-[10px] text-purple-500">This Month</p>
                <p className="text-sm font-bold text-purple-700">৳{p.thisMonth.toLocaleString()}</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-2">
                <p className="text-[10px] text-gray-400">All Time</p>
                <p className="text-sm font-bold text-gray-800">৳{p.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent entries */}
      <div className="stat-card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600">Recent Entries</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {adSpends.slice(0, 15).map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-xs text-gray-400">{a.date}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{a.productName}</td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full">{a.platform}</span>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-gray-500">{a.campaignType}</td>
                <td className="px-4 py-2.5 text-right font-bold text-purple-600">৳{a.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddAdSpendDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
