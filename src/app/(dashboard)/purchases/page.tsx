'use client';

import { useEffect, useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { subscribePurchases } from '@/lib/firestore/purchases';
import { AddPurchaseDialog } from '@/components/purchases/AddPurchaseDialog';
import type { Purchase } from '@/types';
import { format } from 'date-fns';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => subscribePurchases(setPurchases), []);

  const totalCost = purchases.reduce((s, p) => s + p.totalCost, 0);

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div className="stat-card flex items-center gap-3 py-3 px-4">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-400">Total Purchased (All Time)</p>
            <p className="text-lg font-bold text-gray-900">৳{totalCost.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={() => setShowDialog(true)} className="btn-emerald flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Purchase
        </button>
      </div>

      <div className="stat-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Supplier</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Price/Unit</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No purchase records yet</td></tr>
            )}
            {purchases.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{p.date}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.productName}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.supplier}</td>
                <td className="px-4 py-3 text-right text-gray-700">{p.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-700">৳{p.purchasePricePerUnit}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">৳{p.totalCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddPurchaseDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
