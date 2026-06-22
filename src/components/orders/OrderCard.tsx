'use client';

import { useState } from 'react';
import { Phone, MapPin, Package, ChevronDown, Truck, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { updateOrderStatus } from '@/lib/firestore/orders';
import { addReturn } from '@/lib/firestore/returns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, ReturnReason } from '@/types';

const STATUS_FLOW: OrderStatus[] = ['Pending','Confirmed','Packed','Courier Submitted','Delivered'];

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending:          'status-pending',
  Confirmed:        'status-confirmed',
  Packed:           'status-packed',
  'Courier Submitted': 'status-courier',
  Delivered:        'status-delivered',
  Returned:         'status-returned',
  Cancelled:        'status-cancelled',
};

interface OrderCardProps {
  order: Order;
  orderCount?: number;
  onCourierSubmit?: (order: Order) => void;
}

export function OrderCard({ order, orderCount = 1, onCourierSubmit }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const nextStatus = (): OrderStatus | null => {
    const idx = STATUS_FLOW.indexOf(order.status);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const handleAdvance = async () => {
    const next = nextStatus();
    if (!next) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, next);
      toast.success(`Status → ${next}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'Cancelled');
      toast.success('Order cancelled');
    } catch { toast.error('Failed'); }
    finally { setUpdating(false); }
  };

  const handleReturn = async () => {
    if (!confirm('Mark as returned?')) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'Returned');
      await addReturn({
        orderId: order.id,
        customerName: order.customerName,
        phone: order.phone,
        productName: order.productName,
        quantity: order.quantity,
        amount: order.sellingPrice * order.quantity,
        returnReason: 'Customer refused',
        returnedAt: new Date().toISOString(),
      });
      toast.success('Order marked as returned');
    } catch { toast.error('Failed'); }
    finally { setUpdating(false); }
  };

  const next = nextStatus();
  const isNew = orderCount <= 1;

  return (
    <div className="stat-card animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
            {!isNew && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                {orderCount} Orders
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-400 mt-0.5">{order.id}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', STATUS_STYLE[order.status])}>
          {order.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone className="w-3 h-3 text-gray-300" />
          <a href={`tel:${order.phone}`} className="hover:text-emerald-600">{order.phone}</a>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3 text-gray-300" />
          <span className="line-clamp-1">{order.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Package className="w-3 h-3 text-gray-300" />
          <span>{order.productName} × {order.quantity}</span>
          <span className="ml-auto font-bold text-gray-800">৳{(order.sellingPrice * order.quantity).toLocaleString()}</span>
        </div>
      </div>

      {/* Tracking */}
      {order.courierTracking && (
        <div className="bg-cyan-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-cyan-600" />
          <span className="text-xs font-mono text-cyan-700">{order.courierTracking}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        {order.status === 'Packed' && onCourierSubmit && (
          <button onClick={() => onCourierSubmit(order)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
            <Truck className="w-3.5 h-3.5" /> Submit Courier
          </button>
        )}
        {next && next !== 'Delivered' && order.status !== 'Courier Submitted' && (
          <button onClick={handleAdvance} disabled={updating}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60">
            <CheckCircle2 className="w-3.5 h-3.5" /> → {next}
          </button>
        )}
        {order.status === 'Delivered' && (
          <button onClick={handleReturn} disabled={updating}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Return
          </button>
        )}
        {!['Delivered','Returned','Cancelled'].includes(order.status) && (
          <button onClick={handleCancel} disabled={updating}
            className="flex items-center justify-center gap-1 py-1.5 px-3 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
