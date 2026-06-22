'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { getCustomers } from '@/lib/firestore/customers';
import { getOrders } from '@/lib/firestore/orders';
import type { Customer, Order } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  Pending: 'status-pending', Confirmed: 'status-confirmed',
  Packed: 'status-packed', 'Courier Submitted': 'status-courier',
  Delivered: 'status-delivered', Returned: 'status-returned', Cancelled: 'status-cancelled',
};

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomers(), getOrders()]).then(([customers, allOrders]) => {
      const c = customers.find(c => c.id === id) ?? null;
      setCustomer(c);
      if (c) setOrders(allOrders.filter(o => o.phone === c.phone));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="page-container"><div className="h-8 w-48 bg-gray-100 rounded animate-pulse" /></div>;
  if (!customer) return <div className="page-container text-gray-500">Customer not found.</div>;

  return (
    <div className="page-container space-y-5">
      <Link href="/customers" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      {/* Profile header */}
      <div className="stat-card flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shrink-0">
          {customer.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">{customer.name}</h1>
            {customer.totalOrders > 1 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                {customer.totalOrders} Orders · Repeat Buyer
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>
            {customer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.address}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center py-3">
          <ShoppingBag className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
          <p className="text-xs text-gray-400">Total Orders</p>
        </div>
        <div className="stat-card text-center py-3">
          <DollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-700">৳{customer.totalSpending.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Spent</p>
        </div>
        <div className="stat-card text-center py-3">
          <Calendar className="w-4 h-4 text-purple-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-gray-900">
            {customer.lastOrderDate ? formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true }) : '—'}
          </p>
          <p className="text-xs text-gray-400">Last Order</p>
        </div>
      </div>

      {/* Order history */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">Purchase History</h2>
        <div className="stat-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Product</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No orders found</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.id}</td>
                  <td className="px-4 py-3 text-gray-800 hidden sm:table-cell">{o.productName} × {o.quantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">৳{(o.sellingPrice * o.quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', STATUS_STYLE[o.status] ?? '')}>{o.status}</span>
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
