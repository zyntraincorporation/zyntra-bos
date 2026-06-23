'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { subscribeProducts, deleteProduct } from '@/lib/firestore/products';
import { ProductCard } from '@/components/inventory/ProductCard';
import { ProductDialog } from '@/components/inventory/ProductDialog';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';
import { SkeletonProductCard } from '@/components/ui/SkeletonCard';
import { toast } from 'sonner';
import type { Product, ProductCategory } from '@/types';

const CATEGORIES: (ProductCategory | 'All')[] = ['All', 'Cosmetics', 'Gift', 'Fashion', 'Others'];

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest' },
  { value: 'stock-asc', label: 'Stock ↑' },
  { value: 'stock-desc',label: 'Stock ↓' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc',label: 'Price ↓' },
];

type SortOption = 'newest' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc';

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'stock-asc':  return copy.sort((a, b) => a.stock - b.stock);
    case 'stock-desc': return copy.sort((a, b) => b.stock - a.stock);
    case 'price-asc':  return copy.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case 'price-desc': return copy.sort((a, b) => b.sellingPrice - a.sellingPrice);
    default:           return copy; // newest = Firestore order
  }
}

export default function InventoryPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'All'>('All');
  const [sort, setSort]             = useState<SortOption>('newest');
  const [showDialog, setShowDialog] = useState(false);
  const [editProduct, setEditProduct]   = useState<Product | undefined>();
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);

  useEffect(() => subscribeProducts(data => { setProducts(data); setLoading(false); }), []);

  const filtered = sortProducts(
    products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      return matchSearch && matchCat;
    }),
    sort
  );

  const totalValue     = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
  const lowStockCount  = products.filter(p => p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const handleDelete = async (p: Product) => {
    await deleteProduct(p.id);
    toast.success(`"${p.name}" deleted`);
  };

  return (
    <div className="page-container space-y-4">

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card py-3">
          <p className="metric-label">Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{products.length}</p>
        </div>
        <div className="card py-3">
          <p className="metric-label">Inventory Value</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">৳{totalValue.toLocaleString()}</p>
        </div>
        <div className="card py-3 border-amber-100">
          <p className="metric-label text-amber-500">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600 mt-0.5">{lowStockCount}</p>
        </div>
        <div className="card py-3 border-red-100">
          <p className="metric-label text-red-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-0.5">{outOfStockCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="input pl-9"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="input w-auto"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={() => { setEditProduct(undefined); setShowDialog(true); }}
            className="btn-emerald flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 h-7 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              categoryFilter === c
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" />
          <p className="empty-state-title">No products found</p>
          <p className="empty-state-description">
            {search ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
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
