'use client';

import React from 'react';
import { AlertOctagon, RefreshCw, XCircle } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Button } from '../ui/Button';

export const DemoBanner: React.FC = () => {
  const { demoMode, setDemoMode } = useDemo();

  if (!demoMode) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm z-50 sticky top-0">
      <div className="flex items-center gap-2 flex-1 justify-center">
        <AlertOctagon className="w-4 h-4 text-amber-950 shrink-0" />
        <span className="tracking-wide uppercase">
          DEMO DATA — NOT LIVE GOVERNMENT DATA
        </span>
        <span className="hidden md:inline font-normal text-amber-900 border-l border-amber-600/40 pl-2">
          Deterministic SIH 2026 Evaluation Fixture Mode (Maharashtra State Innovation Society)
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDemoMode(false)}
        className="text-amber-950 hover:bg-amber-600/30 text-xs py-0.5 px-2 h-auto"
        leftIcon={<XCircle className="w-3.5 h-3.5" />}
      >
        Switch to Live API
      </Button>
    </div>
  );
};
