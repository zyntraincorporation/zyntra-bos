'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Package, Users, Bot, Plus, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeOrders } from '@/lib/firestore/orders';
import { useAuth } from '@/contexts/AuthContext';

const mobileNavItems = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory', icon: Package,         label: 'Stock' },
  { href: '/orders',    icon: ClipboardList,   label: 'Orders' },
  { href: '/customers', icon: Users,           label: 'CRM' },
  { href: '/assistant', icon: Bot,             label: 'AI' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pathname = usePathname();

  // Subscribe to pending order count for the notification badge
  useEffect(() => {
    if (!user) return; // Only subscribe if authenticated to prevent permission-denied errors
    const unsub = subscribeOrders((orders) => {
      setPendingCount(orders.filter(o => o.status === 'Pending').length);
    }, 200);
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect to /login
  }

  return (
    <div className="flex h-dvh bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} pendingCount={pendingCount} />

        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <div className="animate-fade-in">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Action Button — New Order */}
      <Link
        href="/orders?new=true"
        className="fab md:hidden"
        aria-label="New Order"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </Link>

      {/* Desktop FAB */}
      <Link
        href="/orders?new=true"
        className="fab hidden md:flex"
        aria-label="New Order"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </Link>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" role="navigation" aria-label="Main navigation">
        {mobileNavItems.map(item => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 relative"
              aria-label={item.label}
            >
              {/* Active dot */}
              {active && (
                <span
                  className="absolute top-1 w-1 h-1 rounded-full"
                  style={{ background: 'var(--primary)' }}
                />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-emerald-600' : 'text-gray-400'
                )}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold transition-colors',
                  active ? 'text-emerald-600' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Toaster position="top-center" richColors expand={false} />
    </div>
  );
}
