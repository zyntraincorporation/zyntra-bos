'use client';

import { useEffect, useState } from 'react';
import { Search, Users, Crown } from 'lucide-react';
import { subscribeCustomers } from '@/lib/firestore/customers';
import type { Customer } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => subscribeCustomers(setCustomers), []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpending, 0);
  const repeatBuyers = customers.filter(c => c.totalOrders > 1).length;

  return (
    <div className="page-container space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="metric-label">Total Customers</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{customers.length}</p>
        </div>
        <div className="card text-center py-3 border-emerald-100">
          <p className="metric-label text-emerald-600">Repeat Buyers</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{repeatBuyers}</p>
        </div>
        <div className="card text-center py-3 border-blue-100">
          <p className="metric-label text-blue-500">Total Revenue</p>
          <p className="text-lg font-bold text-blue-700 mt-0.5">৳{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="input pl-9"
        />
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <p className="empty-state-title">No customers yet</p>
          <p className="empty-state-description">Customers are auto-created when you save orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const isVip = c.totalOrders >= 5;
            const isRepeat = c.totalOrders > 1 && !isVip;
            
            return (
              <Link href={`/customers/${c.id}`} key={c.id} className="card p-3 flex items-center gap-3 hover:border-emerald-200 transition-colors cursor-pointer group">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                  isVip ? 'bg-purple-100 text-purple-700' :
                  isRepeat ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700'
                )}>
                  {isVip ? <Crown className="w-4 h-4" /> : c.name[0]?.toUpperCase() || 'U'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{c.name}</p>
                    {isVip && <span className="badge badge-purple">VIP</span>}
                    {isRepeat && <span className="badge badge-blue">Repeat</span>}
                  </div>
                  <p className="text-xs font-mono text-gray-500">{c.phone}</p>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">৳{c.totalSpending.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {c.lastOrderDate ? formatDistanceToNow(new Date(c.lastOrderDate), { addSuffix: true }) : '—'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
