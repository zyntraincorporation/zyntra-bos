'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Truck, Loader2, Copy, CheckCheck } from 'lucide-react';
import { updateOrder } from '@/lib/firestore/orders';
import { toast } from 'sonner';
import type { Order } from '@/types';

interface Props {
  order: Order | null;
  onClose: () => void;
}

export function CourierSubmitModal({ order, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courier/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          productName: order.productName,
          quantity: order.quantity,
          amount: order.sellingPrice * order.quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Courier submission failed');
      const tracking = data.trackingCode ?? data.consignment_id ?? `SFT-${Date.now()}`;
      await updateOrder(order.id, {
        courierTracking: tracking,
        courierSubmittedAt: new Date().toISOString(),
        status: 'Courier Submitted',
      });
      setTrackingCode(tracking);
      toast.success('Parcel submitted to Steadfast!');
    } catch (e: any) {
      toast.error(e.message ?? 'Submission failed');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-600" /> Submit to Steadfast
          </DialogTitle>
        </DialogHeader>

        {!trackingCode ? (
          <div className="space-y-4 mt-2">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-semibold text-gray-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-mono text-gray-800">{order.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="text-gray-800 text-right max-w-[200px]">{order.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Product</span>
                <span className="font-semibold text-gray-900">{order.productName} × {order.quantity}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-emerald-700">৳{(order.sellingPrice * order.quantity).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-emerald w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 bg-cyan-500 hover:bg-cyan-600"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Truck className="w-4 h-4" /> Confirm & Submit</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <p className="text-emerald-600 text-xs font-semibold mb-1">✅ Parcel Submitted Successfully</p>
              <p className="text-xs text-gray-500 mb-2">Tracking Code</p>
              <p className="font-mono font-bold text-lg text-gray-900">{trackingCode}</p>
            </div>
            <button onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {copied ? <><CheckCheck className="w-4 h-4 text-emerald-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Tracking Code</>}
            </button>
            <button onClick={onClose} className="btn-emerald w-full py-2.5">Done</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
