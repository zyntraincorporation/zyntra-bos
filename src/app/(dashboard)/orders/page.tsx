'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, ClipboardList } from 'lucide-react';
import { subscribeOrders } from '@/lib/firestore/orders';
import { subscribeCustomers } from '@/lib/firestore/customers';
import { getProducts } from '@/lib/firestore/products';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderDrawer } from '@/components/orders/OrderDrawer';
import { CourierSubmitModal } from '@/components/orders/CourierSubmitModal';
import { SkeletonOrderCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, Product, Customer } from '@/types';

const STATUS_TABS: (OrderStatus | 'All')[] = [
  'All', 'Pending', 'Confirmed', 'Packed', 'Courier Submitted', 'Delivered', 'Returned', 'Cancelled',
];

const STATUS_TAB_STYLE: Partial<Record<OrderStatus | 'All', string>> = {
  Pending:           'text-amber-600  bg-amber-50   border-amber-200',
  Confirmed:         'text-blue-600   bg-blue-50    border-blue-200',
  Packed:            'text-purple-600 bg-purple-50  border-purple-200',
  'Courier Submitted': 'text-cyan-600 bg-cyan-50    border-cyan-200',
  Delivered:         'text-emerald-600 bg-emerald-50 border-emerald-200',
  Returned:          'text-red-600    bg-red-50     border-red-200',
  Cancelled:         'text-gray-500   bg-gray-50    border-gray-200',
};

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [orders, setOrders]         = useState<Order[]>([]);
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [search, setSearch]         = useState('');
  const [drawerOpen, setDrawerOpen] = useState(isNew);
  const [courierOrder, setCourierOrder] = useState<Order | null>(null);

  // Sync state if URL changes
  useEffect(() => {
    if (isNew) {
      setDrawerOpen(true);
    }
  }, [isNew]);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    if (isNew) {
      router.replace('/orders'); // Remove ?new=true from URL
    }
  };

  useEffect(() => {
    const u1 = subscribeOrders(data => { setOrders(data); setLoading(false); }, 300);
    const u2 = subscribeCustomers(setCustomers);
    getProducts().then(setProducts);
    return () => { u1(); u2(); };
  }, []);

  const customerOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach(c => { map[c.phone] = c.totalOrders; });
    return map;
  }, [customers]);

  const filtered = useMemo(() =>
    orders.filter(o => {
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !search
        || o.customerName.toLowerCase().includes(q)
        || o.phone.includes(q)
        || o.id.toLowerCase().includes(q)
        || o.productName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    }),
    [orders, statusFilter, search]
  );

  // Counts per status for tab badges
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  const pendingCount = countByStatus['Pending'] ?? 0;
  const todayCount   = orders.filter(o => {
    const d = o.createdAt;
    if (!d) return false;
    const date = typeof d === 'object' && 'seconds' in d
      ? new Date((d as any).seconds * 1000)
      : new Date(d as string);
    return date.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="page-container space-y-4">

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="metric-label">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{orders.length}</p>
        </div>
        <div className="card text-center py-3 border-amber-100">
          <p className="metric-label text-amber-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
        </div>
        <div className="card text-center py-3 border-emerald-100">
          <p className="metric-label text-emerald-600">Today</p>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">{todayCount}</p>
        </div>
      </div>

      {/* Search + New Order button */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, order ID…"
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn-emerald flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">New Order</span>
        </button>
      </div>

      {/* Status tabs — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {STATUS_TABS.map(s => {
          const count  = countByStatus[s] ?? 0;
          const active = statusFilter === s;
          const style  = STATUS_TAB_STYLE[s as OrderStatus];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap',
                'border transition-all shrink-0',
                active
                  ? (style ?? 'bg-gray-800 text-white border-gray-800')
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              {s}
              {count > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                  active ? 'bg-white/30' : 'bg-gray-100 text-gray-500'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonOrderCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList className="empty-state-icon" />
          <p className="empty-state-title">No orders found</p>
          <p className="empty-state-description">
            {search ? 'Try a different search term' : 'Create your first order using the button above'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              orderCount={customerOrderMap[o.phone] ?? 1}
              onCourierSubmit={setCourierOrder}
            />
          ))}
        </div>
      )}

      {/* Order Drawer */}
      <OrderDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        products={products}
      />

      {/* Courier Submit Modal */}
      <CourierSubmitModal
        order={courierOrder}
        onClose={() => setCourierOrder(null)}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading orders...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
