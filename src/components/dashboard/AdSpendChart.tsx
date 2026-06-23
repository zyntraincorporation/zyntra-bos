'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';
import type { DailyChartPoint } from '@/types';

interface Props { data: DailyChartPoint[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-800">৳{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function AdSpendChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
        No ad spend recorded this month
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradAd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="adSpend"
          name="Ad Spend"
          stroke="#8B5CF6"
          strokeWidth={2}
          fill="url(#gradAd)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: '#8B5CF6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
