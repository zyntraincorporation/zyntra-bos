'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addInvestment } from '@/lib/firestore/investments';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { InvestmentPerson } from '@/types';
import { format } from 'date-fns';

const schema = z.object({
  person: z.enum(['Nirob', 'Partner']),
  amount: z.number().min(1),
  note: z.string().optional(),
  date: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; }

export function AddInvestmentDialog({ open, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { person: 'Nirob', date: format(new Date(), 'yyyy-MM-dd') },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await addInvestment({ person: data.person, amount: data.amount, note: data.note ?? '', date: data.date });
      toast.success('Investment recorded');
      reset({ person: 'Nirob', date: format(new Date(), 'yyyy-MM-dd') });
      onClose();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record Investment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label>Person *</Label>
            <Select defaultValue="Nirob" onValueChange={v => setValue('person', v as InvestmentPerson)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Nirob">Nirob (Owner)</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (৳) *</Label>
            <Input type="number" {...register('amount', { valueAsNumber: true })} className="mt-1" placeholder="10000" />
          </div>
          <div>
            <Label>Note</Label>
            <Input {...register('note')} className="mt-1" placeholder="e.g. Initial capital injection" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" {...register('date')} className="mt-1" />
          </div>
          <button type="submit" disabled={saving} className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Record Investment
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
