'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/':           'Dashboard',
  '/inventory':  'Inventory',
  '/purchases':  'Purchases',
  '/expenses':   'Expenses',
  '/ads':        'Ad Budget',
  '/orders':     'Orders',
  '/customers':  'Customers',
  '/pnl':        'Profit & Loss',
  '/cashflow':   'Cash Flow',
  '/returns':    'Returns',
  '/assistant':  'AI Assistant',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const baseRoute = '/' + (pathname.split('/')[1] ?? '');
  const title = pageTitles[baseRoute] ?? 'Puspaloy Business OS';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <h1 className="flex-1 text-base font-bold text-gray-900">{title}</h1>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </button>
          <div className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('en-BD', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
    </header>
  );
}
