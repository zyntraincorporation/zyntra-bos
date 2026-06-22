'use client';

import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { subscribeReturns } from '@/lib/firestore/returns';
import { subscribeOrders } from '@/lib/firestore/orders';
import type { Return, Order } from '@/types';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const u1 = subscribeReturns(setReturns);
    const u2 = subscribeOrders(setOrders);
    return () => { u1(); u2(); };
  }, []);

  const deliveredCount = orders.filter(o => o.status === 'Delivered' || o.status === 'Returned').length;
  const returnRate = deliveredCount > 0 ? ((returns.length / deliveredCount) * 100).toFixed(1) : '0';
  const totalLost = returns.reduce((s, r) => s + r.amount, 0);

  // Group by reason
  const byReason: Record<string, number> = {};
  returns.forEach(r => { byReason[r.returnReason] = (byReason[r.returnReason] ?? 0) + 1; });

  return (
    <div className="page-container space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center py-4">
          <RotateCcw className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
          <p className="text-xs text-gray-400">Total Returns</p>
        </div>
        <div className="stat-card text-center py-4 border-red-100">
          <p className="text-2xl font-bold text-red-600">৳{totalLost.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Revenue Lost</p>
        </div>
        <div className="stat-card text-center py-4 border-amber-100">
          <p className="text-2xl font-bold text-amber-600">{returnRate}%</p>
          <p className="text-xs text-gray-400">Return Rate</p>
        </div>
      </div>

      {/* Return reasons */}
      {Object.keys(byReason).length > 0 && (
        <div className="stat-card">
          <p className="text-sm font-bold text-gray-800 mb-3">Returns by Reason</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byReason).map(([reason, count]) => (
              <div key={reason} className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-orange-700">{reason}</span>
                <span className="text-xs font-bold text-orange-900 bg-orange-100 rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600">Return Records</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Reason</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No returns recorded
                </td>
              </tr>
            )}
            {returns.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400">{r.returnedAt?.substring(0, 10)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{r.customerName}</p>
                  <p className="text-[10px] font-mono text-gray-400">{r.phone}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{r.productName} × {r.quantity}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs bg-orange-50 text-orange-700 font-medium px-2 py-0.5 rounded-full">{r.returnReason}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600">৳{r.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
