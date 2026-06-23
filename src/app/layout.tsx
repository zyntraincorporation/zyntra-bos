import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#10B981',
};

export const metadata: Metadata = {
  title: {
    template: '%s | Puspaloy Business OS',
    default: 'Puspaloy Business OS',
  },
  description: 'F-Commerce Business Management Platform — Inventory, Orders, Courier, Finance & AI',
  applicationName: 'Puspaloy BOS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Puspaloy BOS',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
