'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number; // positive = up, negative = down
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

export function StatCard({
  label, value, icon: Icon, iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50', trend, prefix = '৳', suffix = '',
  loading = false,
}: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4.5 h-4.5', iconColor)} size={18} />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold',
            trend >= 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {trend >= 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-xl font-bold text-gray-900">
            {typeof value === 'number' && prefix ? prefix : ''}
            {typeof value === 'number' ? value.toLocaleString('en-BD') : value}
            {suffix}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </>
      )}
    </div>
  );
}
