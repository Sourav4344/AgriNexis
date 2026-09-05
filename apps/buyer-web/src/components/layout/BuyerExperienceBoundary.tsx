"use client";
import React from 'react';
import { useDemo } from '@/lib/context/DemoContext';

/** The existing workspace uses local fixtures; never present it as a live account. */
export function BuyerExperienceBoundary({ children }: { children: React.ReactNode }) {
  const { isDemoMode, setDemoMode } = useDemo();
  if (isDemoMode) return <>{children}</>;
  return <main id="main-content" tabIndex={-1} className="max-w-2xl mx-auto my-12 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl space-y-4">
    <p className="text-sm font-semibold text-amber-800">Buyer / FPO workspace</p>
    <h1 className="text-3xl font-bold">Live workspace unavailable</h1>
    <p className="text-slate-600">This interface currently uses a local demo. Live sign-in, listings, offers, orders, and payments are not connected here.</p>
    <button className="px-5 py-3 rounded-lg bg-emerald-800 text-white font-semibold" onClick={() => setDemoMode(true)}>Open labelled SIH demo</button>
  </main>;
}
