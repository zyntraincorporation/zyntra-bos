'use client';

import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { subscribeCustomers } from '@/lib/firestore/customers';
import type { Customer } from '@/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="page-container space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center py-3">
          <p className="text-xs text-gray-400">Total Customers</p>
          <p className="text-xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="stat-card text-center py-3">
          <p className="text-xs text-emerald-600">Repeat Buyers</p>
          <p className="text-xl font-bold text-emerald-700">{repeatBuyers}</p>
        </div>
        <div className="stat-card text-center py-3">
          <p className="text-xs text-blue-500">Total Revenue</p>
          <p className="text-lg font-bold text-blue-700">৳{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>

      {/* Customer list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No customers yet</p>
          <p className="text-sm">Customers are auto-created when you save orders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link href={`/customers/${c.id}`} key={c.id}
              className="stat-card flex items-center gap-4 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer block">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{c.name}</p>
                  {c.totalOrders > 1 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                      {c.totalOrders} Orders
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-400">{c.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">৳{c.totalSpending.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">
                  {c.lastOrderDate ? formatDistanceToNow(new Date(c.lastOrderDate), { addSuffix: true }) : '—'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
