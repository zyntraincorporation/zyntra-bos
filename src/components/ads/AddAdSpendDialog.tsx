'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addAdSpend } from '@/lib/firestore/adSpend';
import { getProducts } from '@/lib/firestore/products';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { AdPlatform, CampaignType, Product } from '@/types';
import { format } from 'date-fns';

const schema = z.object({
  productId: z.string().min(1),
  platform: z.enum(['Facebook', 'Instagram']),
  campaignType: z.enum(['Messaging Campaign','Website Sales','Engagement','Awareness','Retargeting']),
  amount: z.number().min(1),
  date: z.string().min(1),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; }

export function AddAdSpendDialog({ open, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { platform: 'Facebook', campaignType: 'Messaging Campaign', date: format(new Date(), 'yyyy-MM-dd') },
  });

  useEffect(() => { if (open) getProducts().then(setProducts); }, [open]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const product = products.find(p => p.id === data.productId);
      await addAdSpend({ ...data, productName: product?.name ?? '', note: data.note ?? '' });
      toast.success('Ad spend recorded');
      reset({ platform: 'Facebook', campaignType: 'Messaging Campaign', date: format(new Date(), 'yyyy-MM-dd') });
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record Ad Spend</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label>Product *</Label>
            <Select onValueChange={v => setValue('productId', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform *</Label>
              <Select defaultValue="Facebook" onValueChange={v => setValue('platform', v as AdPlatform)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (৳) *</Label>
              <Input type="number" {...register('amount', { valueAsNumber: true })} className="mt-1" placeholder="500" />
            </div>
          </div>
          <div>
            <Label>Campaign Type *</Label>
            <Select defaultValue="Messaging Campaign" onValueChange={v => setValue('campaignType', v as CampaignType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Messaging Campaign','Website Sales','Engagement','Awareness','Retargeting'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" {...register('date')} className="mt-1" />
          </div>
          <div>
            <Label>Note</Label>
            <Input {...register('note')} className="mt-1" placeholder="Optional note" />
          </div>
          <button type="submit" disabled={saving} className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Ad Spend
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
