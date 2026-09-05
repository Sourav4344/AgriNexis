"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/lib/context/DemoContext";
import { useAuth } from "@/lib/context/AuthContext";
import {
  LayoutDashboard,
  Store,
  Megaphone,
  Handshake,
  PackageCheck,
  Users2,
  TrendingUp,
  Warehouse,
  AlertCircle,
  Settings,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const { listings, orders } = useDemo();

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Produce Marketplace",
      href: "/marketplace",
      icon: Store,
      badge: `${listings.filter((listing) => listing.status === "ACTIVE").length} Active`,
    },
    {
      label: "Procurement Demands",
      href: "/demands",
      icon: Megaphone,
    },
    {
      label: "Offers & Bids",
      href: "/offers",
      icon: Handshake,
    },
    {
      label: "Orders & Fulfillment",
      href: "/orders",
      icon: PackageCheck,
      badge: `${orders.filter((order) => order.status === "CONFIRMED").length} Confirmed`,
    },
    ...(role === "FPO"
      ? [
          {
            label: "FPO Aggregation Hub",
            href: "/fpo",
            icon: Users2,
            highlight: true,
          },
        ]
      : []),
    {
      label: "Market Intelligence",
      href: "/intelligence",
      icon: TrendingUp,
    },
    {
      label: "Logistics & Storage",
      href: "/logistics",
      icon: Warehouse,
    },
    {
      label: "Disputes & Support",
      href: "/grievances",
      icon: AlertCircle,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between flex border-r border-slate-800">
      <div className="p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Trade Operations
        </div>
        <nav aria-label="Buyer workspace" className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:block md:space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition group ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                    : item.highlight
                    ? "text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 border border-amber-500/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? "text-white"
                        : item.highlight
                        ? "text-amber-400"
                        : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-emerald-800 text-emerald-100"
                        : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom info section */}
      <div className="hidden md:block p-4 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-400">
          <div className="flex items-center justify-between text-slate-200 font-semibold mb-1">
            <span>Farmer earnings</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
              Active
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All prices and contracts calculated with transparent net farmer realization deductions.
          </p>
        </div>
      </div>
    </aside>
  );
}
