'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
  /** Optional: positive = green trend, negative = red trend */
  trend?: number;
  /** Format as integer (default) or decimal */
  decimals?: number;
}

function formatValue(value: number, prefix: string, decimals = 0): string {
  if (prefix === '৳') {
    if (value >= 100000) return `৳${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `৳${(value / 1000).toFixed(1)}K`;
    return `৳${value.toFixed(decimals)}`;
  }
  return `${prefix}${value.toLocaleString('en-BD', { maximumFractionDigits: decimals })}`;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  prefix = '',
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50',
  loading = false,
  trend,
  decimals = 0,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card" aria-hidden="true">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton skeleton-text w-12 rounded-full" />
        </div>
        <div className="skeleton skeleton-title w-20 mb-1.5" />
        <div className="skeleton skeleton-text w-14" />
      </div>
    );
  }

  const isNegative = value < 0;

  return (
    <div className="stat-card animate-fade-in">
      {/* Icon + optional trend */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} strokeWidth={2} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              trend >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            )}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className={cn(
          'metric-value',
          isNegative ? 'text-red-600' : 'text-gray-900'
        )}
      >
        {formatValue(value, prefix, decimals)}
      </p>

      {/* Label */}
      <p className="metric-label mt-1">{label}</p>
    </div>
  );
}
