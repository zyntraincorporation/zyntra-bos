'use client';

import { useState } from 'react';
import { Package, Edit3, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
}

function getStockStatus(product: Product) {
  if (product.stock === 0)                     return { label: 'Out of Stock', class: 'badge-red',   icon: true };
  if (product.stock <= product.lowStockThreshold) return { label: 'Low Stock',   class: 'badge-amber', icon: true };
  return { label: 'In Stock', class: 'badge-green', icon: false };
}

export function ProductCard({ product, onEdit, onDelete, onAdjustStock }: ProductCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const stockStatus  = getStockStatus(product);
  const margin       = product.sellingPrice > 0
    ? Math.round(((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100)
    : 0;
  const profit       = product.sellingPrice - product.purchasePrice;

  return (
    <div className="card flex flex-col gap-0 group">
      {/* Product image */}
      <div className="relative mb-3 rounded-xl overflow-hidden bg-gray-50 aspect-square">
        {product.image && !imgErr ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}

        {/* Stock badge overlay */}
        <span className={cn('badge absolute top-2 left-2', stockStatus.class)}>
          {stockStatus.icon && <AlertTriangle className="w-2.5 h-2.5" />}
          {stockStatus.label}
        </span>

        {/* Category badge */}
        <span className="badge badge-gray absolute top-2 right-2">{product.category}</span>
      </div>

      {/* Product info */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-0.5 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-[10px] font-mono text-gray-400 mb-3">{product.sku}</p>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-[10px] text-gray-400 mb-0.5">Buy Price</p>
            <p className="text-sm font-bold text-gray-700">৳{product.purchasePrice.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2">
            <p className="text-[10px] text-emerald-600 mb-0.5">Sell Price</p>
            <p className="text-sm font-bold text-emerald-700">৳{product.sellingPrice.toLocaleString()}</p>
          </div>
        </div>

        {/* Margin + profit */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="font-semibold text-emerald-600">৳{profit.toLocaleString()} profit</span>
          </div>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            margin >= 30 ? 'bg-emerald-100 text-emerald-700' :
            margin >= 15 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-600'
          )}>
            {margin}% margin
          </span>
        </div>
      </div>

      {/* Stock + actions */}
      <div className="border-t border-gray-100 pt-3 mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Stock</span>
          <button
            onClick={() => onAdjustStock(product)}
            className={cn(
              'text-base font-bold transition-colors hover:underline',
              product.stock === 0 ? 'text-red-600' :
              product.stock <= product.lowStockThreshold ? 'text-amber-600' :
              'text-gray-900'
            )}
          >
            {product.stock} pcs
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onAdjustStock(product)}
            className="flex-1 h-8 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Adjust Stock
          </button>
          <button
            onClick={() => onEdit(product)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Edit product"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Delete product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
