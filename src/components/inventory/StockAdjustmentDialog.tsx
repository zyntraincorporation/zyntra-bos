'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateProduct } from '@/lib/firestore/products';
import { toast } from 'sonner';
import { Loader2, Plus, Minus } from 'lucide-react';
import type { Product } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function StockAdjustmentDialog({ open, onClose, product }: Props) {
  const [delta, setDelta] = useState<number>(0);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const newStock = mode === 'add' ? product.stock + delta : Math.max(0, product.stock - delta);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProduct(product.id, { stock: newStock });
      toast.success(`Stock updated to ${newStock} pcs`);
      onClose();
      setDelta(0); setNote('');
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Product</p>
            <p className="text-sm font-bold text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500 mt-1">Current stock: <span className="font-bold text-gray-800">{product.stock} pcs</span></p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setMode('add')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'add' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Plus className="w-4 h-4" /> Add
            </button>
            <button onClick={() => setMode('remove')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'remove' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Minus className="w-4 h-4" /> Remove
            </button>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input type="number" min={0} value={delta} onChange={e => setDelta(Number(e.target.value))} className="mt-1" />
          </div>

          <div>
            <Label>Reason / Note</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} className="mt-1" placeholder="e.g. New stock received" />
          </div>

          <div className="bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs text-emerald-700 font-medium">New Stock</span>
            <span className="text-lg font-bold text-emerald-700">{newStock} pcs</span>
          </div>

          <button onClick={handleSave} disabled={saving || delta === 0} className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Adjustment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
