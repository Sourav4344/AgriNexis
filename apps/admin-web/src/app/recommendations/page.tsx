'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Compass, Award, Search, Filter, Eye, AlertCircle, Clock } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { fetchListings, fetchListingRecommendations } from '../../lib/api/endpoints';
import { ProduceListing, RecommendationOption } from '../../lib/api/types';
import { formatINR } from '../../lib/utils/money';
import { formatDateTime } from '../../lib/utils/dates';
import { formatQuantity } from '../../lib/utils/units';

export default function RecommendationsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<RecommendationOption[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const list = await fetchListings(ctx);
        setListings(list);
        if (list.length > 0) {
          setSelectedListingId(list[0].id);
          const recs = await fetchListingRecommendations(ctx, list[0].id);
          setRecommendations(recs);
        }
      } catch (err) {
        console.error('Recommendations load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const handleListingChange = async (id: string) => {
    setSelectedListingId(id);
    setLoading(true);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      const recs = await fetchListingRecommendations(ctx, id);
      setRecommendations(recs);
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<RecommendationOption>[] = [
    {
      header: 'Rank & Decision',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              row.rank === 1 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
            }`}
          >
            #{row.rank}
          </span>
          <div>
            <Badge variant={row.sell_wait === 'SELL_NOW' ? 'success' : 'warning'} size="sm">
              {row.sell_wait}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      header: 'Candidate Opportunity',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {row.candidate_name || 'Buyer Participant'}
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            Engine: {row.engine_version} ({row.source_name})
          </div>
        </div>
      ),
    },
    {
      header: 'Offered Price & Gross',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">
            {formatINR(row.estimated_unit_price_per_kg)}/kg
          </div>
          <div className="text-[11px] text-slate-500">
            Gross: {formatINR(row.estimated_gross_selling_value)}
          </div>
        </div>
      ),
    },
    {
      header: 'Itemized Deductions',
      accessor: (row) => (
        <div className="text-xs text-rose-600 font-mono">
          <div>Total: -{formatINR(row.estimated_total_applicable_cost)}</div>
          <div className="text-[10px] text-slate-500">
            Trans: {formatINR(row.estimated_transportation_cost)} • Stor: {formatINR(row.estimated_storage_cost)}
          </div>
        </div>
      ),
    },
    {
      header: 'Net Farmer Realization (NFR)',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-extrabold text-emerald-800 text-sm">
            {formatINR(row.estimated_net_farmer_realization)}
          </div>
          <div className="text-[10px] text-slate-500">
            Diff from Best: {formatINR(row.difference_from_best || '0.00')}
          </div>
        </div>
      ),
    },
    {
      header: 'Provenance / Validity',
      accessor: (row) => (
        <div className="space-y-1">
          <ProvenanceBadge mode={row.data_mode} showSource={false} />
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Exp: {formatDateTime(row.expires_at)}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Recommendation Decision Inspection
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect derived recommendation records, confidence facts, and multi-buyer NFR rankings.
          </p>
        </div>
      </div>

      <Card
        title="Listing Recommendation Inspector"
        subtitle="Select a produce listing to review its persisted candidate opportunities"
        action={
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Listing:</label>
            <select
              value={selectedListingId}
              onChange={(e) => handleListingChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium max-w-xs"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.crop_name || 'Tomato'} ({formatQuantity(l.quantity)}) - {l.district}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={recommendations}
          isLoading={loading}
          emptyMessage="No recommendation options found for this listing"
        />
      </Card>
    </div>
  );
}
