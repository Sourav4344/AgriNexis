"use client";

import React from "react";
import { useDemo } from "@/lib/context/DemoContext";
import { AlertTriangle, RefreshCw, Radio } from "lucide-react";

export function DemoBanner() {
  const { isDemoMode, setDemoMode, resetDemoData } = useDemo();

  if (!isDemoMode) {
    return (
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs font-medium flex flex-wrap gap-3 items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-slate-200 font-semibold">LIVE WORKSPACE UNAVAILABLE</span>
          <span className="hidden sm:inline text-slate-400">| Open the labelled demo to preview the product</span>
        </div>
        <button
          onClick={() => setDemoMode(true)}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium underline"
        >
          Switch to SIH Demo Mode
        </button>
      </div>
    );
  }

  return (
    <div
      role="banner"
      aria-label="Simulation and demo data indicator"
      className="bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-medium flex flex-wrap items-center justify-between shadow-inner border-b border-amber-600/20"
    >
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-950 flex-shrink-0 animate-pulse" />
        <span className="font-bold tracking-wide">DEMO DATA — NOT LIVE GOVERNMENT DATA</span>
        <span className="hidden md:inline text-amber-900">
          | SIH Deterministic Evaluation Scenario (data_mode: DEMO)
        </span>
      </div>
      <div className="flex items-center space-x-3 mt-1 sm:mt-0">
        <button
          onClick={resetDemoData}
          className="flex items-center space-x-1 px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 rounded text-amber-950 transition font-semibold text-xs"
          title="Reset to canonical SIH state (Rahul's Tomato 1,000kg listing, Buyer A vs B)"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Scenario</span>
        </button>
        <button
          onClick={() => setDemoMode(false)}
          className="text-xs bg-amber-900 text-amber-100 hover:bg-amber-950 px-2 py-0.5 rounded font-medium transition"
        >
          Exit Demo Mode
        </button>
      </div>
    </div>
  );
}
