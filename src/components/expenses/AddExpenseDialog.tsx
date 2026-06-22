'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addExpense } from '@/lib/firestore/expenses';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { ExpenseCategory } from '@/types';
import { format } from 'date-fns';

const CATEGORIES: ExpenseCategory[] = ['Facebook Ads','Packaging','Courier','Website Maintenance','Domain','Hosting','Internet','Misc','Others'];

const schema = z.object({
  category: z.enum(['Facebook Ads','Packaging','Courier','Website Maintenance','Domain','Hosting','Internet','Misc','Others']),
  amount: z.number().min(1),
  note: z.string().optional(),
  date: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; }

export function AddExpenseDialog({ open, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Facebook Ads', date: format(new Date(), 'yyyy-MM-dd') },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await addExpense({ category: data.category, amount: data.amount, note: data.note ?? '', date: data.date });
      toast.success('Expense recorded');
      reset({ category: 'Facebook Ads', date: format(new Date(), 'yyyy-MM-dd') });
      onClose();
    } catch { toast.error('Failed to save expense'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label>Category *</Label>
            <Select defaultValue="Facebook Ads" onValueChange={v => setValue('category', v as ExpenseCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (৳) *</Label>
            <Input type="number" {...register('amount', { valueAsNumber: true })} className="mt-1" placeholder="500" />
          </div>
          <div>
            <Label>Note</Label>
            <Input {...register('note')} className="mt-1" placeholder="Optional description" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" {...register('date')} className="mt-1" />
          </div>
          <button type="submit" disabled={saving} className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Expense
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
