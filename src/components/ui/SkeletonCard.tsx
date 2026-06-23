'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton', className)} aria-hidden="true" />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card" aria-hidden="true">
      <div className="flex items-start justify-between mb-3">
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton skeleton-text w-16" />
      </div>
      <div className="skeleton skeleton-title w-24 mb-1.5" />
      <div className="skeleton skeleton-text w-16" />
    </div>
  );
}

export function SkeletonOrderCard() {
  return (
    <div className="stat-card space-y-3" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="skeleton skeleton-title w-32" />
          <div className="skeleton skeleton-text w-24" />
        </div>
        <div className="skeleton skeleton-text w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="skeleton skeleton-text w-full" />
        <div className="skeleton skeleton-text w-3/4" />
        <div className="skeleton skeleton-text w-1/2" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <div className="skeleton h-8 flex-1 rounded-lg" />
        <div className="skeleton h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="stat-card" aria-hidden="true">
      <div className="skeleton w-full h-32 rounded-lg mb-3" />
      <div className="skeleton skeleton-title w-3/4 mb-2" />
      <div className="skeleton skeleton-text w-1/2 mb-3" />
      <div className="flex gap-2">
        <div className="skeleton h-7 flex-1 rounded-lg" />
        <div className="skeleton h-7 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50" aria-hidden="true">
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton skeleton-title w-40" />
        <div className="skeleton skeleton-text w-28" />
      </div>
      <div className="skeleton skeleton-text w-20" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton skeleton-text w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
