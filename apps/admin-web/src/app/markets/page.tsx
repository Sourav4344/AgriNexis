'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { fetchMarketPrices, fetchMarkets, fetchCrops } from '../../lib/api/endpoints';
import { MandiPrice, Mandi, Crop } from '../../lib/api/types';
import { formatINR } from '../../lib/utils/money';
import { formatDateTime, getFreshnessBadge } from '../../lib/utils/dates';
import { kgToQuintals, kgPriceToQuintalPrice } from '../../lib/utils/units';

export default function MarketsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [markets, setMarkets] = useState<Mandi[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [unitMode, setUnitMode] = useState<'kg' | 'quintal'>('kg');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const [pricesRes, marketsRes, cropsRes] = await Promise.all([
          fetchMarketPrices(ctx),
          fetchMarkets(ctx),
          fetchCrops(ctx),
        ]);
        setPrices(pricesRes);
        setMarkets(marketsRes);
        setCrops(cropsRes);
      } catch (err) {
        console.error('Market prices load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const filteredPrices = prices.filter((p) => {
    if (selectedCrop === 'ALL') return true;
    return p.crop_id === selectedCrop;
  });

  const columns: Column<MandiPrice>[] = [
    {
      header: 'Market / APMC',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.mandi_name || 'Pune Gultekdi APMC'}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Provider: {row.source_name} ({row.dataset_id || 'v1'})
          </div>
        </div>
      ),
    },
    {
      header: 'Crop / Variety',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{row.crop_name || 'Tomato'}</div>
          <div className="text-[11px] text-slate-500">{row.variety_name || 'Standard Variety'}</div>
        </div>
      ),
    },
    {
      header: `Modal Price (${unitMode === 'kg' ? '₹/kg' : '₹/quintal'})`,
      accessor: (row) => {
        const modal = unitMode === 'kg' ? formatINR(row.modal_price) : formatINR(kgPriceToQuintalPrice(row.modal_price));
        const min = unitMode === 'kg' ? formatINR(row.min_price) : formatINR(kgPriceToQuintalPrice(row.min_price));
        const max = unitMode === 'kg' ? formatINR(row.max_price) : formatINR(kgPriceToQuintalPrice(row.max_price));
        return (
          <div className="text-xs">
            <div className="font-bold text-slate-900 text-sm">{modal}</div>
            <div className="text-[10px] text-slate-500">
              Range: {min} - {max}
            </div>
          </div>
        );
      },
    },
    {
      header: `Arrivals (${unitMode === 'kg' ? 'kg' : 'quintals'})`,
      accessor: (row) => {
        const kg = row.arrival_quantity_kg || '15000.000';
        if (unitMode === 'quintal') {
          return (
            <div className="text-xs font-mono font-medium text-slate-800">
              {kgToQuintals(kg)} qtl
              <div className="text-[10px] text-slate-400">({parseFloat(kg).toLocaleString()} kg)</div>
            </div>
          );
        }
        return (
          <div className="text-xs font-mono font-medium text-slate-800">
            {parseFloat(kg).toLocaleString()} kg
          </div>
        );
      },
    },
    {
      header: 'Observed Time & Freshness',
      accessor: (row) => {
        const fresh = getFreshnessBadge(row.observed_at);
        return (
          <div className="text-xs space-y-1">
            <div className="text-slate-700">{formatDateTime(row.observed_at)}</div>
            <Badge variant={fresh.status === 'fresh' ? 'success' : 'warning'} size="sm">
              <Clock className="w-3 h-3" />
              {fresh.label}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Provenance / Mode',
      accessor: (row) => (
        <ProvenanceBadge mode={row.data_mode} source={row.source_name} showSource={false} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Market & APMC Observations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor mandi price benchmarks, arrival volumes, and data freshness across Maharashtra mandis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/markets/health">
            <Button variant="outline" size="sm" leftIcon={<Activity className="w-4 h-4 text-emerald-600" />}>
              Data Ingestion Health
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Callout for Unit Conversion & Provenance */}
      <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            Canonical internal arrival unit is <strong>kilograms (kg)</strong>. Converted to quintals via standard factor (1 Quintal = 100 kg).
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 font-semibold">
          <button
            onClick={() => setUnitMode('kg')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              unitMode === 'kg' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            INR / kg
          </button>
          <button
            onClick={() => setUnitMode('quintal')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              unitMode === 'quintal' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            INR / Quintal
          </button>
        </div>
      </div>

      <Card
        title="Observed Mandi Prices"
        subtitle="Benchmark price observations ingested by Agent 6 Market Data Engine"
        action={
          <div className="flex items-center gap-2">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="ALL">All Crops</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en} ({c.name_hi})
                </option>
              ))}
            </select>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filteredPrices}
          isLoading={loading}
          emptyMessage="No market price observations found"
        />
      </Card>
    </div>
  );
}
