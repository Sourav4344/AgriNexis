'use client';

import React, { useState } from 'react';
import './globals.css';
import { DemoProvider } from '../lib/config/demoContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { DemoBanner } from '../components/layout/DemoBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>AgriNexis Admin & Oversight | Government of Maharashtra SIH 2026</title>
        <meta
          name="description"
          content="Administrative oversight and price discovery monitoring for AgriNexis - Strengthening market linkages for farmers."
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <DemoProvider>
            <a href="#main-content" className="skip-link">Skip to content</a>
          <DemoBanner />
          <div className="flex flex-1 min-h-0">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
              <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
              <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                {children}
              </main>
              <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
                AgriNexis • Smart India Hackathon 2026 • Problem Statement 26132 • Maharashtra State Innovation Society
              </footer>
            </div>
          </div>
        </DemoProvider>
      </body>
    </html>
  );
}
