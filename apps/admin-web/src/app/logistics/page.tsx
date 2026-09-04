'use client';

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Warehouse, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';
import { fetchLogisticsQuotes } from '../../lib/api/endpoints';
import { LogisticsQuote } from '../../lib/api/types';
import { formatINR } from '../../lib/utils/money';
import { formatDateTime } from '../../lib/utils/dates';

export default function LogisticsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<LogisticsQuote[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const q = await fetchLogisticsQuotes(ctx);
        setQuotes(q);
      } catch (err) {
        console.error('Logistics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const columns: Column<LogisticsQuote>[] = [
    {
      header: 'Route & Distance',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-700" />
            {row.distance_km} km
          </div>
          <div className="text-[11px] text-slate-500">
            {row.assumptions?.route || 'Standard transit corridor'}
          </div>
        </div>
      ),
    },
    {
      header: 'Transportation Cost',
      accessor: (row) => (
        <div className="text-xs font-mono font-bold text-slate-900">
          {formatINR(row.transportation_cost)}
        </div>
      ),
    },
    {
      header: 'Storage & Handling',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <div>Storage: {formatINR(row.storage_cost)}</div>
          <div className="text-[11px] text-slate-400">Handling: {formatINR(row.handling_cost)}</div>
        </div>
      ),
    },
    {
      header: 'Total Logistics Deduction',
      accessor: (row) => (
        <div className="text-xs font-mono font-extrabold text-rose-700">
          {formatINR(row.total_applicable_cost)}
        </div>
      ),
    },
    {
      header: 'Method & Assumptions',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {row.assumptions?.method || 'DISTANCE_SLAB'}
          </span>
        </div>
      ),
    },
    {
      header: 'Provenance / Validity',
      accessor: (row) => (
        <div className="space-y-1">
          <ProvenanceBadge mode={row.data_mode} source={row.source_name} showSource={false} />
          <div className="text-[10px] text-slate-500">Exp: {formatDateTime(row.expires_at)}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Logistics & Storage Visibility
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Inspect distance estimation slabs, transport quotes, and warehouse rate parameters.
        </p>
      </div>

      {/* Backend Limitation Notice for Agent 9 */}
      <BackendUnavailable
        featureName="Live Logistics Quote Generation (POST /logistics/quotes)"
        plannedEndpoint="POST /logistics/quotes"
        assignedAgent="Agent 9 (Logistics & Storage Engine)"
        description="Dynamic routing and live rate calculation engine is currently under development by Agent 9. Pre-calculated deterministic distance slab estimates are displayed for evaluation."
      />

      <Card
        title="Persisted Logistics Quotes"
        subtitle="Distance-slab cost models bound to active produce recommendations"
      >
        <DataTable
          columns={columns}
          data={quotes}
          isLoading={loading}
          emptyMessage="No logistics quotes available"
        />
      </Card>
    </div>
  );
}
