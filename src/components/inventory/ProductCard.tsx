'use client';

import Image from 'next/image';
import { Package, Edit2, Trash2, AlertTriangle, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onAdjustStock: (p: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete, onAdjustStock }: ProductCardProps) {
  const isLowStock = product.stock <= product.lowStockThreshold;
  const inventoryValue = product.stock * product.purchasePrice;

  return (
    <div className="stat-card flex flex-col gap-3 animate-fade-in">
      {/* Image */}
      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gray-50">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.sku}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{product.category}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-[10px] text-gray-400">Buy Price</p>
            <p className="text-xs font-bold text-gray-800">৳{product.purchasePrice.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2">
            <p className="text-[10px] text-emerald-600">Sell Price</p>
            <p className="text-xs font-bold text-emerald-700">৳{product.sellingPrice.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-[10px] text-gray-400">Stock</p>
            <p className={cn('text-sm font-bold', isLowStock ? 'text-red-600' : 'text-gray-800')}>
              {product.stock} pcs
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Value</p>
            <p className="text-xs font-semibold text-gray-600">৳{inventoryValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onAdjustStock(product)}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-3 h-3" /> Stock
        </button>
        <button
          onClick={() => onEdit(product)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(product)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
