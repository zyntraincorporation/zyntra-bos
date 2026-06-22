'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addPurchase } from '@/lib/firestore/purchases';
import { updateProduct, getProducts } from '@/lib/firestore/products';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import { format } from 'date-fns';

const schema = z.object({
  productId: z.string().min(1),
  supplier: z.string().min(1),
  quantity: z.number().min(1),
  purchasePricePerUnit: z.number().min(0),
  date: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; }

export function AddPurchaseDialog({ open, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd') },
  });

  useEffect(() => { getProducts().then(setProducts); }, [open]);

  const qty = watch('quantity') || 0;
  const price = watch('purchasePricePerUnit') || 0;
  const total = qty * price;
  const selectedProductId = watch('productId');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await addPurchase({
        productId: data.productId,
        productName: selectedProduct?.name ?? '',
        supplier: data.supplier,
        quantity: data.quantity,
        purchasePricePerUnit: data.purchasePricePerUnit,
        totalCost: total,
        date: data.date,
      });
      if (selectedProduct) {
        await updateProduct(data.productId, { stock: selectedProduct.stock + data.quantity });
      }
      toast.success(`Purchase recorded. Stock increased by ${data.quantity} pcs.`);
      reset({ date: format(new Date(), 'yyyy-MM-dd') });
      onClose();
    } catch { toast.error('Failed to record purchase'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label>Product *</Label>
            <Select onValueChange={v => setValue('productId', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Supplier *</Label>
            <Input {...register('supplier')} className="mt-1" placeholder="Supplier name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity *</Label>
              <Input type="number" {...register('quantity', { valueAsNumber: true })} className="mt-1" placeholder="50" />
            </div>
            <div>
              <Label>Price/Unit (৳) *</Label>
              <Input type="number" {...register('purchasePricePerUnit', { valueAsNumber: true })} className="mt-1" placeholder="70" />
            </div>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" {...register('date')} className="mt-1" />
          </div>
          {total > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3 flex justify-between">
              <span className="text-sm text-emerald-700">Total Cost</span>
              <span className="text-sm font-bold text-emerald-700">৳{total.toLocaleString()}</span>
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Record Purchase
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
