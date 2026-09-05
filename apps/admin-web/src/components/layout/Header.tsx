'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Settings,
  Bell,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { demoMode, toggleDemoMode } = useDemo();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Project context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              AN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  AgriNexis
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider border border-slate-200">
                  Admin Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Govt of Maharashtra • SIH 2026 PS ID: 26132
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mode Toggle + Status + Admin profile */}
        <div className="flex items-center gap-3">
          {/* Data Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => toggleDemoMode()}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                demoMode
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DEMO MODE
            </button>
            <button
              onClick={() => toggleDemoMode()}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                !demoMode
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              LIVE API
            </button>
          </div>

          {/* Mode Badge Indicator */}
          {demoMode ? (
            <Badge variant="demo" size="sm" className="hidden md:inline-flex">
              DEMO DATA ACTIVE
            </Badge>
          ) : (
            <Badge variant="live" size="sm" className="hidden md:inline-flex">
              FASTAPI /api/v1
            </Badge>
          )}

          {/* Admin Identity Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">Platform Admin</div>
              <div className="text-[10px] text-emerald-700 font-medium">Role: ADMIN (Auth)</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
