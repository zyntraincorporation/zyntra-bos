'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addProduct, updateProduct } from '@/lib/firestore/products';
import { toast } from 'sonner';
import { Loader2, ImagePlus } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';

const schema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.enum(['Cosmetics', 'Gift', 'Fashion', 'Others']),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stock: z.number().min(0),
  lowStockThreshold: z.number().min(0),
  supplier: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product;
}

export function ProductDialog({ open, onClose, product }: Props) {
  const isEdit = !!product;
  const [imageUrl, setImageUrl] = useState(product?.image ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name, sku: product.sku,
      category: product.category, purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice, stock: product.stock,
      lowStockThreshold: product.lowStockThreshold, supplier: product.supplier,
    } : { category: 'Cosmetics', stock: 0, lowStockThreshold: 5 },
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY || '';
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body: fd });
      const json = await res.json();
      setImageUrl(json.data.url);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = { ...data, image: imageUrl, supplier: data.supplier ?? '' };
      if (isEdit && product) {
        await updateProduct(product.id, payload);
        toast.success('Product updated');
      } else {
        await addProduct(payload);
        toast.success('Product added');
      }
      onClose();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Image Upload */}
          <div>
            <Label>Product Image</Label>
            <div className="mt-1.5 flex items-center gap-3">
              {imageUrl
                ? <img src={imageUrl} alt="Product" className="w-16 h-16 object-cover rounded-lg border" />
                : <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center"><ImagePlus className="w-5 h-5 text-gray-400" /></div>
              }
              <label className="flex-1">
                <span className="block w-full text-center text-xs font-medium py-2 px-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                  {uploading ? 'Uploading…' : 'Choose image'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product Name *</Label>
              <Input {...register('name')} className="mt-1" placeholder="Lipstick Pro" />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
              <Label>SKU *</Label>
              <Input {...register('sku')} className="mt-1" placeholder="PSL-001" />
            </div>
          </div>

          <div>
            <Label>Category *</Label>
            <Select defaultValue={product?.category ?? 'Cosmetics'} onValueChange={v => setValue('category', v as ProductCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Cosmetics', 'Gift', 'Fashion', 'Others'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Purchase Price (৳) *</Label>
              <Input type="number" {...register('purchasePrice', { valueAsNumber: true })} className="mt-1" placeholder="70" />
            </div>
            <div>
              <Label>Selling Price (৳) *</Label>
              <Input type="number" {...register('sellingPrice', { valueAsNumber: true })} className="mt-1" placeholder="150" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Initial Stock</Label>
              <Input type="number" {...register('stock', { valueAsNumber: true })} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Low Stock Alert</Label>
              <Input type="number" {...register('lowStockThreshold', { valueAsNumber: true })} className="mt-1" placeholder="5" />
            </div>
          </div>

          <div>
            <Label>Supplier</Label>
            <Input {...register('supplier')} className="mt-1" placeholder="Supplier name" />
          </div>

          <button type="submit" disabled={saving || uploading} className="btn-emerald w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
