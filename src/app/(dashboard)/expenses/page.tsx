'use client';

import { useEffect, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { subscribeExpenses, deleteExpense } from '@/lib/firestore/expenses';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/types';
import { format, isSameMonth } from 'date-fns';

const CATEGORIES: (ExpenseCategory | 'All')[] = ['All','Facebook Ads','Packaging','Courier','Website Maintenance','Domain','Hosting','Internet','Misc','Others'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [catFilter, setCatFilter] = useState<ExpenseCategory | 'All'>('All');

  useEffect(() => subscribeExpenses(setExpenses), []);

  const filtered = expenses.filter(e => catFilter === 'All' || e.category === catFilter);
  const thisMonth = expenses.filter(e => {
    try { return isSameMonth(new Date(e.date), new Date()); } catch { return false; }
  });
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const allTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page-container space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card flex items-center gap-3 py-3">
          <Receipt className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-xs text-gray-400">This Month</p>
            <p className="text-lg font-bold text-red-600">৳{monthTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 py-3">
          <Receipt className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-400">All Time</p>
            <p className="text-lg font-bold text-gray-800">৳{allTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.slice(0, 6).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${catFilter === c ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setShowDialog(true)} className="btn-emerald flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Note</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No expenses recorded</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500">{e.date}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2 py-1 rounded-full">{e.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{e.note || '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">৳{e.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={async () => { await deleteExpense(e.id); toast.success('Deleted'); }}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-600">Total ({catFilter})</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">৳{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <AddExpenseDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
