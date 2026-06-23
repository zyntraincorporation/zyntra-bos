'use client';

import { useEffect, useState } from 'react';
import { Plus, Receipt, Trash2, Calendar, FileText } from 'lucide-react';
import { subscribeExpenses, deleteExpense } from '@/lib/firestore/expenses';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/types';
import { isSameMonth } from 'date-fns';

const CATEGORIES: (ExpenseCategory | 'All')[] = [
  'All','Facebook Ads','Packaging','Courier','Website Maintenance','Domain','Hosting','Internet','Misc','Others'
];

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
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page-container space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="metric-label">This Month</p>
            <p className="text-xl font-bold text-red-600 truncate">৳{monthTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="card py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="metric-label">All Time</p>
            <p className="text-xl font-bold text-gray-800 truncate">৳{allTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 scrollbar-hide">
          {CATEGORIES.slice(0, 6).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                catFilter === c
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setShowDialog(true)} className="btn-emerald shrink-0 h-8">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Receipt className="empty-state-icon" />
          <p className="empty-state-title">No expenses found</p>
          <p className="empty-state-description">Add an expense to start tracking your outgoings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(e => (
              <div key={e.id} className="card p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-gray">{e.category}</span>
                  </div>
                  <button 
                    onClick={async () => { await deleteExpense(e.id); toast.success('Deleted'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex-1 min-w-0 mt-1">
                  <p className="text-lg font-bold text-red-600 mb-2">৳{e.amount.toLocaleString()}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{e.date}</span>
                  </div>
                  
                  {e.note && (
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{e.note}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="card flex items-center justify-between bg-gray-50 border-gray-200">
            <span className="text-sm font-semibold text-gray-600">Total ({catFilter})</span>
            <span className="text-lg font-bold text-gray-900">৳{filteredTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      <AddExpenseDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
