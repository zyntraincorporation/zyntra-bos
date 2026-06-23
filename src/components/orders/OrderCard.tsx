'use client';

import { useState } from 'react';
import {
  Phone, MapPin, Package, Truck, CheckCircle2,
  XCircle, RotateCcw, Clock, Share2, MessageCircle, Edit3
} from 'lucide-react';
import { updateOrderStatus } from '@/lib/firestore/orders';
import { addReturn } from '@/lib/firestore/returns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const STATUS_FLOW: OrderStatus[] = ['Pending', 'Confirmed', 'Packed', 'Courier Submitted', 'Delivered'];

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending:           'status-pending',
  Confirmed:         'status-confirmed',
  Packed:            'status-packed',
  'Courier Submitted': 'status-courier',
  Delivered:         'status-delivered',
  Returned:          'status-returned',
  Cancelled:         'status-cancelled',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  Pending:   'Confirm',
  Confirmed: 'Pack',
  Packed:    'Submit Courier',
};

const SOURCE_ICON: Record<string, React.ReactNode> = {
  Facebook: <Share2 className="w-3 h-3" />,
  Telegram: <MessageCircle className="w-3 h-3" />,
  Manual:   <Edit3 className="w-3 h-3" />,
};

function getBadge(orderCount: number) {
  if (orderCount >= 5) return { label: 'VIP', class: 'badge-purple' };
  if (orderCount >= 3) return { label: 'Regular', class: 'badge-blue' };
  if (orderCount >= 2) return { label: 'Repeat', class: 'badge-green' };
  return null;
}

function toDateSafe(v: unknown): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  if (typeof v === 'object' && 'seconds' in (v as object)) {
    return new Date((v as { seconds: number }).seconds * 1000);
  }
  return new Date();
}

interface OrderCardProps {
  order: Order;
  orderCount?: number;
  onCourierSubmit?: (order: Order) => void;
}

export function OrderCard({ order, orderCount = 1, onCourierSubmit }: OrderCardProps) {
  const [updating, setUpdating] = useState(false);

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;
  const nextLabel = nextStatus ? NEXT_LABEL[order.status] ?? `→ ${nextStatus}` : null;

  const badge = getBadge(orderCount);
  const isTerminal = ['Delivered', 'Returned', 'Cancelled'].includes(order.status);
  const createdAt = toDateSafe(order.createdAt);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    if (order.status === 'Packed' && onCourierSubmit) {
      onCourierSubmit(order);
      return;
    }
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      toast.success(`Order → ${nextStatus}`);
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'Cancelled');
      toast.success('Order cancelled');
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const handleReturn = async () => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, 'Returned');
      await addReturn({
        orderId:      order.id,
        customerName: order.customerName,
        phone:        order.phone,
        productName:  order.productName,
        quantity:     order.quantity,
        amount:       order.sellingPrice * order.quantity,
        returnReason: 'Customer refused',
        returnedAt:   new Date().toISOString(),
      });
      toast.success('Order marked as returned');
    } catch {
      toast.error('Failed to mark return');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card animate-fade-in flex flex-col gap-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">{order.customerName}</p>
            {badge && (
              <span className={cn('badge', badge.class)}>{badge.label}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] font-mono text-gray-400">{order.id}</p>
            {order.source && SOURCE_ICON[order.source] && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                {SOURCE_ICON[order.source]}
                {order.source}
              </span>
            )}
          </div>
        </div>
        <span className={cn('badge shrink-0 mt-0.5', STATUS_STYLE[order.status])}>
          {order.status}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        <a
          href={`tel:${order.phone}`}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-600 transition-colors group"
        >
          <Phone className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-400 shrink-0" />
          <span className="font-mono">{order.phone}</span>
        </a>

        {order.address && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{order.address}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Package className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span className="flex-1 truncate">{order.productName} × {order.quantity}</span>
          <span className="font-bold text-gray-800 shrink-0">
            ৳{(order.sellingPrice * order.quantity).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
        </div>
      </div>

      {/* Courier tracking */}
      {order.courierTracking && (
        <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 rounded-lg border border-cyan-100 mb-3">
          <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span className="text-xs font-mono text-cyan-700 truncate">{order.courierTracking}</span>
        </div>
      )}

      {/* Note */}
      {order.note && (
        <p className="text-xs text-gray-400 italic mb-3 truncate">"{order.note}"</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto">
        {/* Advance button */}
        {nextLabel && (
          <button
            onClick={handleAdvance}
            disabled={updating}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold rounded-lg transition-colors',
              order.status === 'Packed'
                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white',
              'disabled:opacity-50'
            )}
          >
            {order.status === 'Packed'
              ? <><Truck className="w-3.5 h-3.5" />{nextLabel}</>
              : <><CheckCircle2 className="w-3.5 h-3.5" />{nextLabel}</>
            }
          </button>
        )}

        {/* Return (for delivered orders) */}
        {order.status === 'Delivered' && (
          <button
            onClick={handleReturn}
            disabled={updating}
            className="flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Return
          </button>
        )}

        {/* Cancel (non-terminal only) */}
        {!isTerminal && (
          <button
            onClick={handleCancel}
            disabled={updating}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            aria-label="Cancel order"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
