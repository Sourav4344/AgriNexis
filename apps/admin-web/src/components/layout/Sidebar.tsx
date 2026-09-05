'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Users2,
  Package,
  TrendingUp,
  Activity,
  ArrowLeftRight,
  Calculator,
  Compass,
  Truck,
  ShoppingCart,
  CreditCard,
  Sparkles,
  LifeBuoy,
  ShieldAlert,
  BarChart3,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Judge Demo Hub', href: '/demo', icon: Sparkles, badge: 'SIH 2026' },
      { label: 'Overview', href: '/', icon: LayoutDashboard },
      { label: 'NFR Explainability', href: '/nfr-explainability', icon: Calculator, badge: 'CORE' },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Market Linkages & Catalog',
    items: [
      { label: 'Produce Listings', href: '/listings', icon: Package },
      { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Recommendations', href: '/recommendations', icon: Compass },
      { label: 'Market Prices', href: '/markets', icon: TrendingUp },
      { label: 'Market Data Health', href: '/markets/health', icon: Activity },
      { label: 'Logistics Quotes', href: '/logistics', icon: Truck },
    ],
  },
  {
    title: 'Entities & Verification',
    items: [
      { label: 'Users & Profiles', href: '/users', icon: Users },
      { label: 'Buyer Verification', href: '/buyers', icon: Building2, badge: 'QUEUE' },
      { label: 'FPO Collectives', href: '/fpos', icon: Users2 },
    ],
  },
  {
    title: 'Fulfillment & Oversight',
    items: [
      { label: 'Orders (Snapshots)', href: '/orders', icon: ShoppingCart },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Quality AI Oversight', href: '/quality', icon: Sparkles },
      { label: 'Grievances', href: '/grievances', icon: LifeBuoy },
      { label: 'Audit & System Logs', href: '/audit', icon: ShieldAlert },
      { label: 'System Settings', href: '/settings', icon: SlidersHorizontal },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible lg:translate-x-0'
        }`}
      >
        {/* Brand Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
              AN
            </div>
            <div>
              <div className="font-extrabold text-white text-base leading-tight tracking-tight">
                AgriNexis
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                Admin & Oversight
              </div>
            </div>
          </Link>
        </div>

        <button type="button" onClick={onClose} className="lg:hidden p-3 text-white">Close navigation</button>
        {/* Navigation items scrollable list */}
        <nav aria-label="Admin workspace" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          item.badge === 'CORE'
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* SIH 2026 Problem Statement Footer */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
          <div className="font-semibold text-white flex items-center justify-between">
            <span>SIH 2026</span>
            <span className="text-[10px] text-amber-400 font-mono">PS ID: 26132</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-tight">
            Dept of Skills, Employment, Entrepreneurship & Innovation, Govt of Maharashtra
          </p>
        </div>
      </aside>
    </>
  );
};
