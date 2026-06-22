'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Megaphone,
  ClipboardList, Truck, Users, TrendingUp, DollarSign,
  RotateCcw, Bot, LogOut, X, ChevronRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory',    icon: Package,          label: 'Inventory' },
  { href: '/purchases',    icon: ShoppingCart,     label: 'Purchases' },
  { href: '/expenses',     icon: Receipt,          label: 'Expenses' },
  { href: '/ads',          icon: Megaphone,        label: 'Ad Budget' },
  { href: '/orders',       icon: ClipboardList,    label: 'Orders' },
  { href: '/customers',    icon: Users,            label: 'Customers' },
  { href: '/pnl',          icon: TrendingUp,       label: 'Profit & Loss' },
  { href: '/cashflow',     icon: DollarSign,       label: 'Cash Flow' },
  { href: '/returns',      icon: RotateCcw,        label: 'Returns' },
  { href: '/assistant',    icon: Bot,              label: 'AI Assistant', premium: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'bg-white border-r border-gray-100',
          'transition-transform duration-300 ease-in-out',
          'w-[260px]',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:static md:z-auto'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Puspaloy</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">BUSINESS OS</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5',
                  'text-sm font-medium transition-all duration-150 group',
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                )} />
                <span className="flex-1">{item.label}</span>
                {item.premium && (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    AI
                  </span>
                )}
                {active && <ChevronRight className="w-3 h-3 text-emerald-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User + Sign out */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.email ?? 'User'}</p>
              <p className="text-[10px] text-gray-400">Owner</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
