'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Server,
  Key,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
  const {
    demoMode,
    setDemoMode,
    apiBaseUrl,
    setApiBaseUrl,
    authToken,
    setAuthToken,
  } = useDemo();

  const [inputUrl, setInputUrl] = useState(apiBaseUrl);
  const [inputToken, setInputToken] = useState(authToken);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(inputUrl.trim());
    setAuthToken(inputToken.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemo = () => {
    if (!confirm('Reset SIH Demo Scenario state to default baseline?')) return;
    setResetting(true);
    setTimeout(() => {
      setDemoMode(true);
      setResetting(false);
      alert('SIH Deterministic Demo state restored: Farmer Rahul, Buyer A, Buyer B.');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System & Environment Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure backend connection endpoints, manage evaluation demo mode, and audit API credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demo Mode Configuration */}
        <Card
          title="Evaluation Demo Mode (SIH 2026)"
          subtitle="Governs deterministic fixture isolation vs live FastAPI backend calls"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 text-sm">Deterministic Demo Mode</span>
                <p className="text-slate-500">
                  Current Status:{' '}
                  <strong className={demoMode ? 'text-amber-700' : 'text-emerald-700'}>
                    {demoMode ? 'ACTIVE (Demo Fixtures)' : 'INACTIVE (Live Backend API)'}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setDemoMode(!demoMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  demoMode ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    demoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                Demo Isolation Standard (docs/DEMO.md)
              </div>
              <p className="text-[11px] leading-relaxed">
                Default production behavior is <strong>DEMO OFF</strong>. Live API failures (401, 403, 404, 500, 503)
                must surface honestly and <strong>never silently fall back</strong> to demo data.
                When Demo Mode is explicitly enabled for judging, all views clearly display{' '}
                <code>DEMO DATA — NOT LIVE GOVERNMENT DATA</code>.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
                isLoading={resetting}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Rehearsal Reset (Restore Demo Baseline)
              </Button>
            </div>
          </div>
        </Card>

        {/* API Backend Connection Settings */}
        <Card
          title="Backend API Connection"
          subtitle="Configure FastAPI /api/v1 base URL and administrative JWT authorization"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                FastAPI Base URL
              </label>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8000/api/v1"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Bearer Access Token (Admin JWT)
              </label>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Paste Supabase JWT access token..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tokens are preserved strictly in browser localStorage and are never logged or committed.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button variant="primary" size="sm" type="submit">
                Save Connection Settings
              </Button>
              {savedSuccess && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved
                </span>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
