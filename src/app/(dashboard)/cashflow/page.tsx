'use client';

import { useEffect, useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { subscribeInvestments } from '@/lib/firestore/investments';
import { subscribeOrders } from '@/lib/firestore/orders';
import { subscribeExpenses } from '@/lib/firestore/expenses';
import { subscribeAdSpend } from '@/lib/firestore/adSpend';
import { subscribePurchases } from '@/lib/firestore/purchases';
import { AddInvestmentDialog } from '@/components/cashflow/AddInvestmentDialog';
import type { Investment, Order, Expense, AdSpend, Purchase } from '@/types';

export default function CashFlowPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adSpends, setAdSpends] = useState<AdSpend[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const u1 = subscribeInvestments(setInvestments);
    const u2 = subscribeOrders(setOrders);
    const u3 = subscribeExpenses(setExpenses);
    const u4 = subscribeAdSpend(setAdSpends);
    const u5 = subscribePurchases(setPurchases);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  const nirobTotal = investments.filter(i => i.person === 'Nirob').reduce((s, i) => s + i.amount, 0);
  const partnerTotal = investments.filter(i => i.person === 'Partner').reduce((s, i) => s + i.amount, 0);
  const totalInvestment = nirobTotal + partnerTotal;

  const salesRevenue = orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + o.sellingPrice * o.quantity, 0);
  const totalInflow = totalInvestment + salesRevenue;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalAdSpend = adSpends.reduce((s, a) => s + a.amount, 0);
  const totalPurchases = purchases.reduce((s, p) => s + p.totalCost, 0);
  const totalOutflow = totalExpenses + totalAdSpend + totalPurchases;

  const cashBalance = totalInflow - totalOutflow;

  const ledger = [
    ...investments.map(i => ({ date: i.date, type: 'Investment' as const, label: `${i.person}: ${i.note || 'Investment'}`, amount: i.amount, flow: 'in' as const })),
    ...orders.filter(o => o.status === 'Delivered').map(o => ({ date: typeof o.createdAt === 'string' ? o.createdAt.split('T')[0] : '', type: 'Sale' as const, label: `Sale: ${o.productName}`, amount: o.sellingPrice * o.quantity, flow: 'in' as const })),
    ...expenses.map(e => ({ date: e.date, type: 'Expense' as const, label: `${e.category}: ${e.note || ''}`, amount: e.amount, flow: 'out' as const })),
    ...adSpends.map(a => ({ date: a.date, type: 'Ad Spend' as const, label: `${a.platform} Ads: ${a.productName}`, amount: a.amount, flow: 'out' as const })),
    ...purchases.map(p => ({ date: p.date, type: 'Purchase' as const, label: `Stock: ${p.productName} (${p.quantity} pcs)`, amount: p.totalCost, flow: 'out' as const })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const TYPE_COLORS: Record<string, string> = {
    Investment: 'bg-emerald-100 text-emerald-700',
    Sale: 'bg-blue-100 text-blue-700',
    Expense: 'bg-red-100 text-red-600',
    'Ad Spend': 'bg-purple-100 text-purple-700',
    Purchase: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="page-container space-y-5">
      {/* Cash Balance hero */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
        <p className="text-sm text-emerald-100 font-medium">Current Cash Balance</p>
        <p className="text-4xl font-bold mt-1">৳{cashBalance.toLocaleString()}</p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <p className="text-emerald-200 text-xs">Total Inflow</p>
            <p className="font-bold flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" />৳{totalInflow.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-emerald-200 text-xs">Total Outflow</p>
            <p className="font-bold flex items-center gap-1"><ArrowDownRight className="w-3.5 h-3.5" />৳{totalOutflow.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Investment breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center py-3">
          <p className="text-xs text-gray-400">Total Investment</p>
          <p className="text-lg font-bold text-gray-900">৳{totalInvestment.toLocaleString()}</p>
        </div>
        <div className="stat-card text-center py-3 border-emerald-100">
          <p className="text-xs text-emerald-500">Nirob</p>
          <p className="text-lg font-bold text-emerald-700">৳{nirobTotal.toLocaleString()}</p>
        </div>
        <div className="stat-card text-center py-3 border-blue-100">
          <p className="text-xs text-blue-500">Partner</p>
          <p className="text-lg font-bold text-blue-700">৳{partnerTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Outflow breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center py-3">
          <p className="text-xs text-red-400">Expenses</p>
          <p className="text-lg font-bold text-red-600">৳{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="stat-card text-center py-3">
          <p className="text-xs text-purple-400">Ad Spend</p>
          <p className="text-lg font-bold text-purple-600">৳{totalAdSpend.toLocaleString()}</p>
        </div>
        <div className="stat-card text-center py-3">
          <p className="text-xs text-amber-500">Purchases</p>
          <p className="text-lg font-bold text-amber-700">৳{totalPurchases.toLocaleString()}</p>
        </div>
      </div>

      {/* Add investment */}
      <div className="flex justify-end">
        <button onClick={() => setShowDialog(true)} className="btn-emerald flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Investment
        </button>
      </div>

      {/* Ledger */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">Full Transaction Ledger</h2>
        <div className="stat-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Flow</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-400">No transactions yet</td></tr>}
              {ledger.slice(0, 50).map((entry, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{entry.date?.substring(0,10)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[entry.type] ?? 'bg-gray-100 text-gray-600'}`}>{entry.type}</span>
                      <span className="text-xs text-gray-600 truncate max-w-[160px]">{entry.label}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-bold text-sm ${entry.flow === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {entry.flow === 'in' ? '+' : '-'}৳{entry.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {entry.flow === 'in'
                      ? <TrendingUp className="w-4 h-4 text-emerald-500 ml-auto" />
                      : <TrendingDown className="w-4 h-4 text-red-400 ml-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddInvestmentDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
