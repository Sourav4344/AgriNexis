'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Clock,
  Database,
  ShieldCheck,
  AlertTriangle,
  Server,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useDemo } from '../../../lib/config/demoContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatCard } from '../../../components/metrics/StatCard';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge';
import { fetchMarketPrices, fetchMarkets } from '../../../lib/api/endpoints';
import { MandiPrice, Mandi } from '../../../lib/api/types';
import { formatDateTime, getFreshnessBadge } from '../../../lib/utils/dates';

export default function MarketHealthPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [markets, setMarkets] = useState<Mandi[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const [p, m] = await Promise.all([fetchMarketPrices(ctx), fetchMarkets(ctx)]);
        setPrices(p);
        setMarkets(m);
      } catch (err) {
        console.error('Market health load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const liveRecords = prices.filter((p) => p.data_mode === 'LIVE');
  const cachedRecords = prices.filter((p) => p.data_mode === 'CACHED');
  const demoRecords = prices.filter((p) => p.data_mode === 'DEMO');

  const latestObservation = prices.length > 0
    ? [...prices].sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0]
    : null;

  const freshness = latestObservation ? getFreshnessBadge(latestObservation.observed_at) : null;

  const providerColumns: Column<{ name: string; records: number; modes: any[]; latestTime: string }>[] = [
    {
      header: 'Provider / Adapter',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.name}</div>
          <div className="text-[11px] text-slate-500">Market Engine Ingestion Pipeline</div>
        </div>
      ),
    },
    {
      header: 'Observed Records',
      accessor: (row) => <span className="font-mono font-bold text-xs">{row.records}</span>,
    },
    {
      header: 'Data Modes',
      accessor: (row) => (
        <div className="flex gap-1">
          {row.modes.map((m) => (
            <ProvenanceBadge key={m} mode={m} showSource={false} />
          ))}
        </div>
      ),
    },
    {
      header: 'Latest Observation',
      accessor: (row) => <span className="text-xs text-slate-600">{formatDateTime(row.latestTime)}</span>,
    },
  ];

  const providerSummary = [
    {
      name: demoMode ? 'AGRINEXIS_DEMO (SIH Fixture)' : 'AGMARKNET / Maharashtra State APMC Adapter',
      records: prices.length,
      modes: Array.from(new Set(prices.map((p) => p.data_mode))),
      latestTime: latestObservation ? latestObservation.observed_at : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/markets">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Market Observations
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Market Data Health & Provenance
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational provenance verification, observation freshness audit, and fallback state monitoring.
          </p>
        </div>
      </div>

      {/* Honest Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Observations"
          value={prices.length}
          subValue="records"
          icon={<Database className="w-4 h-4 text-slate-500" />}
        />
        <StatCard
          label="Live Ingested"
          value={liveRecords.length}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          badge={<Badge variant="live" size="sm">LIVE</Badge>}
        />
        <StatCard
          label="Cached / Fallback"
          value={cachedRecords.length}
          icon={<Clock className="w-4 h-4 text-cyan-600" />}
          badge={<Badge variant="cached" size="sm">CACHED</Badge>}
        />
        <StatCard
          label="Deterministic Demo"
          value={demoRecords.length}
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          badge={<Badge variant="demo" size="sm">DEMO</Badge>}
        />
      </div>

      {/* Observation Freshness Status */}
      <Card title="Ingestion Freshness Audit" subtitle="Derived transparently from observation timestamps">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase">
                Latest Feed Timestamp
              </div>
              <div className="text-base font-bold text-slate-900">
                {latestObservation ? formatDateTime(latestObservation.observed_at) : 'No observations recorded'}
              </div>
              <div className="text-xs text-slate-600">
                Mandi: {latestObservation?.mandi_name || 'Pune Gultekdi APMC'} • Crop: {latestObservation?.crop_name || 'Tomato'}
              </div>
            </div>

            {freshness && (
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Freshness Classification
                </div>
                <Badge variant={freshness.status === 'fresh' ? 'success' : 'warning'} size="md">
                  <Clock className="w-3.5 h-3.5" />
                  {freshness.label}
                </Badge>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-700" />
              Operational Freshness Invariant
            </div>
            <p className="text-[11px] leading-relaxed">
              In accordance with <code>docs/DATABASE.md</code> (Phase 3A), observations are considered
              fresh within <strong>180 minutes</strong> (<code>MARKET_LIVE_MAX_AGE_MINUTES</code>) and eligible for cached fallback up to <strong>48 hours</strong>.
              Records older than 48h are stored as historical data and never silently substituted as current pricing.
            </p>
          </div>
        </div>
      </Card>

      {/* Provider Ingestion Table */}
      <Card title="Provider & Adapter Status" subtitle="Active data pipelines in Agent 6 Market Engine">
        <DataTable
          columns={providerColumns}
          data={providerSummary}
          isLoading={loading}
          emptyMessage="No providers active"
        />
      </Card>
    </div>
  );
}
