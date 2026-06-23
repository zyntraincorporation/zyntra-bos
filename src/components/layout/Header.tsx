'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/orders':     'Orders',
  '/inventory':  'Inventory',
  '/purchases':  'Purchases',
  '/expenses':   'Expenses',
  '/ads':        'Ad Budget',
  '/customers':  'Customers',
  '/pnl':        'Profit & Loss',
  '/cashflow':   'Cash Flow',
  '/returns':    'Returns',
  '/assistant':  'AI Assistant',
};

interface HeaderProps {
  onMenuClick: () => void;
  pendingCount?: number;
}

export function Header({ onMenuClick, pendingCount = 0 }: HeaderProps) {
  const pathname = usePathname();

  // Resolve page title from current path
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => key !== '/' && pathname.startsWith(key))?.[1] ??
    'Puspaloy BOS';

  const today = format(new Date(), 'EEE, d MMM');

  return (
    <header
      className={cn(
        'shrink-0 flex items-center gap-3 px-4',
        'bg-white border-b border-gray-100',
        'h-14 md:h-16',
        'sticky top-0 z-30'
      )}
      style={{ boxShadow: '0 1px 0 var(--border)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
        <p className="text-[11px] text-gray-400 hidden sm:block">{today}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Pending orders badge */}
        {pendingCount > 0 && (
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 text-amber-600"
              title={`${pendingCount} pending orders`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          </div>
        )}

        {/* Date badge — desktop only */}
        <span className="hidden md:flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          {today}
        </span>
      </div>
    </header>
  );
}
