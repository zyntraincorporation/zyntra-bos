'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, ClipboardList, AlertTriangle } from 'lucide-react';
import { subscribeOrders, addOrder, generateOrderId } from '@/lib/firestore/orders';
import { subscribeCustomers } from '@/lib/firestore/customers';
import { getProducts } from '@/lib/firestore/products';
import { syncCustomerFromOrder } from '@/lib/firestore/customerSync';
import { SmartOrderBox } from '@/components/orders/SmartOrderBox';
import { OrderCard } from '@/components/orders/OrderCard';
import { CourierSubmitModal } from '@/components/orders/CourierSubmitModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, OrderSource, ParsedOrder, Product } from '@/types';

const STATUSES: (OrderStatus | 'All')[] = ['All','Pending','Confirmed','Packed','Courier Submitted','Delivered','Returned','Cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [courierOrder, setCourierOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    customerName: '', phone: '', address: '',
    productId: '', quantity: 1, source: 'Manual' as OrderSource, note: '',
  });
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    const u1 = subscribeOrders(setOrders);
    const u2 = subscribeCustomers(setCustomers);
    getProducts().then(setProducts);
    return () => { u1(); u2(); };
  }, []);

  const handleParsed = (data: ParsedOrder) => {
    setForm(f => ({
      ...f,
      customerName: data.customerName ?? f.customerName,
      phone: data.phone ?? f.phone,
      address: data.address ?? f.address,
      quantity: data.quantity ?? f.quantity,
    }));
    // Try to match product name
    if (data.product) {
      const match = products.find(p => p.name.toLowerCase().includes((data.product ?? '').toLowerCase()));
      if (match) setForm(f => ({ ...f, productId: match.id ?? '' }));
    }
    setMissingFields(data.missingFields ?? []);
    setShowForm(true);
  };

  const handleSaveOrder = async () => {
    if (!form.customerName || !form.phone) {
      toast.error('Customer name and phone are required');
      return;
    }
    if (!form.productId) { toast.error('Please select a product'); return; }
    const product = products.find(p => p.id === form.productId);
    if (!product) return;
    setSaving(true);
    try {
      const id = await generateOrderId();
      const order: Omit<Order, 'id' | 'createdAt'> = {
        customerName: form.customerName, phone: form.phone,
        address: form.address, productId: form.productId,
        productName: product.name, quantity: form.quantity,
        sellingPrice: product.sellingPrice, status: 'Pending',
        source: form.source, courierTracking: '', note: form.note,
      };
      await addOrder({ ...order });
      // Sync customer
      await syncCustomerFromOrder({ ...order, id, createdAt: new Date().toISOString() });
      toast.success(`Order ${id} created!`);
      setForm({ customerName:'',phone:'',address:'',productId:'',quantity:1,source:'Manual',note:'' });
      setShowForm(false);
      setMissingFields([]);
    } catch { toast.error('Failed to create order'); }
    finally { setSaving(false); }
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchSearch = !search || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search) || o.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const customerOrderCount = (phone: string) => customers.find(c => c.phone === phone)?.totalOrders ?? 1;

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const todayCount = orders.filter(o => {
    const d = o.createdAt; if (!d) return false;
    const date = typeof d === 'object' && 'seconds' in d ? new Date((d as any).seconds*1000) : new Date(d as string);
    return date.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="page-container space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center py-3">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="stat-card text-center py-3 border-amber-100">
          <p className="text-xs text-amber-500">Pending</p>
          <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="stat-card text-center py-3 border-emerald-100">
          <p className="text-xs text-emerald-600">Today</p>
          <p className="text-xl font-bold text-emerald-700">{todayCount}</p>
        </div>
      </div>

      {/* Smart Order Box */}
      <SmartOrderBox onParsed={handleParsed} />

      {/* Order Form */}
      {showForm && (
        <div className="stat-card border-emerald-100 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">New Order</p>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
          </div>

          {missingFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missingFields.map(f => (
                <span key={f} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> {f} missing
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
              <input value={form.customerName} onChange={e => setForm(f => ({...f, customerName: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Customer name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone *</label>
              <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Delivery address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Product *</label>
              <Select value={form.productId} onValueChange={v => setForm(f => ({...f, productId: v || ''}))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — ৳{p.sellingPrice}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({...f, quantity: Number(e.target.value)}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Source</label>
              <Select value={form.source} onValueChange={v => setForm(f => ({...f, source: v as OrderSource}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Telegram">Telegram</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Note</label>
              <input value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Optional" />
            </div>
          </div>

          <button onClick={handleSaveOrder} disabled={saving}
            className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? 'Saving…' : '✓ Save Order'}
          </button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or order ID…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All','Pending','Confirmed','Packed','Courier Submitted','Delivered'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s as any)}
              className={cn('px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors',
                statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-emerald flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => (
            <OrderCard key={o.id} order={o} orderCount={customerOrderCount(o.phone)} onCourierSubmit={setCourierOrder} />
          ))}
        </div>
      )}

      <CourierSubmitModal order={courierOrder} onClose={() => setCourierOrder(null)} />
    </div>
  );
}
