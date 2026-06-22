'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Package, Filter } from 'lucide-react';
import { subscribeProducts } from '@/lib/firestore/products';
import { deleteProduct } from '@/lib/firestore/products';
import { ProductCard } from '@/components/inventory/ProductCard';
import { ProductDialog } from '@/components/inventory/ProductDialog';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';
import { toast } from 'sonner';
import type { Product, ProductCategory } from '@/types';

const CATEGORIES: (ProductCategory | 'All')[] = ['All', 'Cosmetics', 'Gift', 'Fashion', 'Others'];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'All'>('All');
  const [showDialog, setShowDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  useEffect(() => subscribeProducts(setProducts), []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await deleteProduct(p.id);
    toast.success('Product deleted');
  };

  return (
    <div className="page-container space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <div className="stat-card flex-1 min-w-[140px] flex items-center gap-3 py-3">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Products</p>
            <p className="text-lg font-bold text-gray-900">{products.length}</p>
          </div>
        </div>
        <div className="stat-card flex-1 min-w-[140px] flex items-center gap-3 py-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Inventory Value</p>
            <p className="text-lg font-bold text-gray-900">৳{totalValue.toLocaleString()}</p>
          </div>
        </div>
        {lowStockCount > 0 && (
          <div className="stat-card flex-1 min-w-[140px] flex items-center gap-3 py-3 border-red-200">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-red-400">Low Stock Alert</p>
              <p className="text-lg font-bold text-red-600">{lowStockCount} products</p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === c
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditProduct(undefined); setShowDialog(true); }}
          className="btn-emerald flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No products found</p>
          <p className="text-sm">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={prod => { setEditProduct(prod); setShowDialog(true); }}
              onDelete={handleDelete}
              onAdjustStock={setAdjustProduct}
            />
          ))}
        </div>
      )}

      <ProductDialog
        open={showDialog}
        onClose={() => { setShowDialog(false); setEditProduct(undefined); }}
        product={editProduct}
      />
      <StockAdjustmentDialog
        open={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
      />
    </div>
  );
}
