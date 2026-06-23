'use client';

import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Sparkles, Loader2, User, Phone, MapPin, Package, FileText, ChevronDown } from 'lucide-react';
import { addOrder, generateOrderId } from '@/lib/firestore/orders';
import { syncCustomerFromOrder } from '@/lib/firestore/customerSync';
import { SmartOrderBox } from './SmartOrderBox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { OrderSource, ParsedOrder, Product } from '@/types';

interface OrderDrawerProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  initialData?: Partial<ParsedOrder>;
}

const SOURCES: OrderSource[] = ['Facebook', 'Telegram', 'Manual'];

export function OrderDrawer({ open, onClose, products, initialData }: OrderDrawerProps) {
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    productId: '',
    quantity: 1,
    source: 'Facebook' as OrderSource,
    note: '',
  });
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSmartBox, setShowSmartBox] = useState(true);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill from parsed order
  useEffect(() => {
    if (initialData) {
      setForm(f => ({
        ...f,
        customerName: initialData.customerName ?? f.customerName,
        phone:        initialData.phone        ?? f.phone,
        address:      initialData.address      ?? f.address,
        quantity:     initialData.quantity     ?? f.quantity,
      }));
      if (initialData.product) {
        const match = products.find(p =>
          p.name.toLowerCase().includes((initialData.product ?? '').toLowerCase())
        );
        if (match) setForm(f => ({ ...f, productId: match.id }));
      }
      setMissingFields(initialData.missingFields ?? []);
      setShowSmartBox(false); // hide smart box when data is pre-filled
    }
  }, [initialData, products]);

  // Focus first field when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleParsed = (data: ParsedOrder) => {
    setForm(f => ({
      ...f,
      customerName: data.customerName ?? f.customerName,
      phone:        data.phone        ?? f.phone,
      address:      data.address      ?? f.address,
      quantity:     data.quantity     ?? f.quantity,
    }));
    if (data.product) {
      const match = products.find(p =>
        p.name.toLowerCase().includes((data.product ?? '').toLowerCase())
      );
      if (match) setForm(f => ({ ...f, productId: match.id }));
    }
    setMissingFields(data.missingFields ?? []);
    setShowSmartBox(false);
  };

  const handleReset = () => {
    setForm({ customerName: '', phone: '', address: '', productId: '', quantity: 1, source: 'Facebook', note: '' });
    setMissingFields([]);
    setShowSmartBox(true);
  };

  const handleSave = async () => {
    if (!form.customerName.trim()) { toast.error('Customer name is required'); return; }
    if (!form.phone.trim())        { toast.error('Phone number is required');   return; }
    if (!form.productId)           { toast.error('Please select a product');     return; }
    const product = products.find(p => p.id === form.productId);
    if (!product) return;

    setSaving(true);
    try {
      const orderId = await generateOrderId();
      const orderData = {
        customerName:    form.customerName.trim(),
        phone:           form.phone.trim(),
        address:         form.address.trim(),
        productId:       form.productId,
        productName:     product.name,
        quantity:        form.quantity,
        sellingPrice:    product.sellingPrice,
        status:          'Pending' as const,
        source:          form.source,
        courierTracking: '',
        note:            form.note.trim(),
      };
      await addOrder(orderData);
      await syncCustomerFromOrder({ ...orderData, id: orderId, createdAt: new Date().toISOString() });
      toast.success(`Order ${orderId} created!`);
      handleReset();
      onClose();
    } catch {
      toast.error('Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => p.id === form.productId);
  const orderTotal = selectedProduct ? selectedProduct.sellingPrice * form.quantity : 0;

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="New Order">
        {/* Mobile handle */}
        <div className="drawer-handle md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Order</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill customer & product details</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Smart Order Box */}
          <div>
            <button
              onClick={() => setShowSmartBox(v => !v)}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-100 text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-emerald-700">AI Smart Parse</span>
                <span className="text-xs text-emerald-500">Paste → Auto-fill</span>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-emerald-500 transition-transform',
                showSmartBox && 'rotate-180'
              )} />
            </button>

            {showSmartBox && (
              <div className="mt-2">
                <SmartOrderBox onParsed={handleParsed} compact />
              </div>
            )}
          </div>

          {/* Missing fields warning */}
          {missingFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-700 font-medium">
                Please fill in: {missingFields.map(f => f.replace(/([A-Z])/g, ' $1').trim()).join(', ')}
              </span>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><User className="w-3 h-3" />Customer Name *</span>
              </label>
              <input
                ref={firstInputRef}
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className={cn('input', missingFields.includes('customerName') && 'border-amber-400 focus:border-amber-400')}
                placeholder="e.g. Fatema Akter"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />Phone Number *</span>
              </label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={cn('input', missingFields.includes('phone') && 'border-amber-400 focus:border-amber-400')}
                placeholder="01XXXXXXXXX"
                type="tel"
                inputMode="numeric"
              />
            </div>

            {/* Address */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />Delivery Address</span>
              </label>
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={cn('input', missingFields.includes('address') && 'border-amber-400 focus:border-amber-400')}
                placeholder="District, Thana, Village…"
              />
            </div>

            {/* Product & Quantity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="input-label">
                  <span className="flex items-center gap-1.5"><Package className="w-3 h-3" />Product *</span>
                </label>
                <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-400 ml-2">৳{p.sellingPrice}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="input-label">Qty</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))}
                  className="input text-center"
                />
              </div>
            </div>

            {/* Order total preview */}
            {selectedProduct && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-xs text-emerald-600 font-medium">Order Total</span>
                <span className="text-base font-bold text-emerald-700">৳{orderTotal.toLocaleString()}</span>
              </div>
            )}

            {/* Source */}
            <div>
              <label className="input-label">Order Source</label>
              <div className="flex gap-2">
                {SOURCES.map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, source: s }))}
                    className={cn(
                      'flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors',
                      form.source === s
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="input-label">
                <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" />Note (optional)</span>
              </label>
              <textarea
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="input"
                rows={2}
                placeholder="Color preference, special instructions…"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleReset} className="btn btn-ghost">
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-emerald flex-1 py-3 justify-center text-sm"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : (
              'Save Order'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
