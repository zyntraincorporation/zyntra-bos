'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Package, Users, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { href: '/',          icon: LayoutDashboard, label: 'Home' },
  { href: '/orders',    icon: ClipboardList,   label: 'Orders' },
  { href: '/inventory', icon: Package,         label: 'Stock' },
  { href: '/customers', icon: Users,           label: 'CRM' },
  { href: '/assistant', icon: Bot,             label: 'AI' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop + Mobile Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {mobileNavItems.map(item => {
          const active = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
            >
              <item.icon className={cn(
                'w-5 h-5 transition-colors',
                active ? 'text-emerald-600' : 'text-gray-400'
              )} />
              <span className={cn(
                'text-[10px] font-medium',
                active ? 'text-emerald-600' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Toaster position="top-right" richColors />
    </div>
  );
}
