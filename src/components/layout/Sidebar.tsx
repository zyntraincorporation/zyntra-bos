'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Megaphone,
  ClipboardList, Users, TrendingUp, DollarSign,
  RotateCcw, Bot, LogOut, X, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/orders',    icon: ClipboardList,   label: 'Orders' },
      { href: '/customers', icon: Users,           label: 'Customers' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/inventory', icon: Package,     label: 'Products' },
      { href: '/purchases', icon: ShoppingCart, label: 'Purchases' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/expenses',  icon: Receipt,     label: 'Expenses' },
      { href: '/ads',       icon: Megaphone,   label: 'Ad Budget' },
      { href: '/pnl',       icon: TrendingUp,  label: 'Profit & Loss' },
      { href: '/cashflow',  icon: DollarSign,  label: 'Cash Flow' },
      { href: '/returns',   icon: RotateCcw,   label: 'Returns' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/assistant', icon: Bot, label: 'AI Assistant', premium: true },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
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
          'md:translate-x-0 md:static md:z-auto md:h-screen md:sticky md:top-0'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Puspaloy</p>
              <p className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase">Business OS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                        'text-sm font-medium transition-all duration-150 group relative',
                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {/* Active indicator */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                          style={{ background: 'var(--primary)' }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {'premium' in item && item.premium && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-100 p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg bg-gray-50 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white"
              style={{ background: 'var(--primary)' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.email ?? 'Owner'}</p>
              <p className="text-[10px] text-gray-400">Admin</p>
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
