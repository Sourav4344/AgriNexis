"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useDemo } from "@/lib/context/DemoContext";
import {
  Bell,
  Building2,
  Users,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Search,
  Lock,
} from "lucide-react";
import Link from "next/link";

export function AppHeader() {
  const { user, role, switchRole } = useAuth();
  const { isDemoMode } = useDemo();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-3 py-3 min-h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-500/20">
                🌱
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Agri<span className="text-emerald-600">Nexis</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                    Trade Hub
                  </span>
                </span>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Transparent Direct Agriculture Marketplace
                </p>
              </div>
            </Link>
          </div>

          {/* Right section: Persona switcher, Notifications, Profile */}
          <div className="flex items-center space-x-4">
            {/* Persona Switcher Dropdown (DEMO ONLY) or Static Role Badge (LIVE) */}
            {isDemoMode ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition ${
                    role === "FPO"
                      ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                  }`}
                  aria-haspopup="true"
                  aria-expanded={showRoleMenu}
                >
                  {role === "FPO" ? (
                    <Users className="w-4 h-4 text-amber-700" />
                  ) : (
                    <Building2 className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>{role === "FPO" ? "FPO" : "Buyer"}</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.5 rounded ml-1">
                    Demo Switcher
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {showRoleMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
                      Demo role preview
                    </div>
                    <button
                      onClick={() => {
                        switchRole("BUYER");
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left flex items-start space-x-2.5 p-2.5 rounded-lg text-sm transition ${
                        role === "BUYER" ? "bg-emerald-50 text-emerald-950 font-medium" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Building2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Institutional Buyer</div>
                        <div className="text-xs text-slate-500">
                          Create demands, place offers, manage procurement & fulfillment
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        switchRole("FPO");
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left flex items-start space-x-2.5 p-2.5 rounded-lg text-sm transition mt-1 ${
                        role === "FPO" ? "bg-amber-50 text-amber-950 font-medium" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Users className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">FPO Operator</div>
                        <div className="text-xs text-slate-500">
                          Aggregate member farmer supply, pool orders & logistics
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800">
                {role === "FPO" ? (
                  <Users className="w-4 h-4 text-amber-700" />
                ) : (
                  <Building2 className="w-4 h-4 text-emerald-700" />
                )}
                <span>{role === "FPO" ? "FPO" : "Buyer"}</span>
                <Lock className="w-3 h-3 text-slate-400 ml-1" />
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />

              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-sm">
                  <p className="font-semibold">Notifications unavailable</p>
                  <p className="mt-1 text-slate-600">Open Orders to check the latest order and payment status.</p>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                {role === "FPO" ? "SF" : "FD"}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  {user.organization_name || user.display_name}
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {user.trade_reference}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
