'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Layers,
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { fetchDemands, fetchOffers } from '../../lib/api/endpoints';
import { BuyerDemand, Offer } from '../../lib/api/types';
import { formatINR } from '../../lib/utils/money';
import { formatDateOnly, formatDateTime } from '../../lib/utils/dates';
import { formatQuantity } from '../../lib/utils/units';

export default function TransactionsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [activeTab, setActiveTab] = useState<'demands' | 'offers'>('demands');
  const [loading, setLoading] = useState(true);
  const [demands, setDemands] = useState<BuyerDemand[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const [d, o] = await Promise.all([fetchDemands(ctx), fetchOffers(ctx)]);
        setDemands(d);
        setOffers(o);
      } catch (err) {
        console.error('Transactions load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const demandColumns: Column<BuyerDemand>[] = [
    {
      header: 'Procurement Intent / Demand',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {row.crop_name || 'Crop'} (Demand)
          </div>
          <div className="font-mono text-[11px] text-slate-400">{row.id.substring(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Buyer / FPO Entity',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.buyer_name || 'Buyer Entity'}</div>
          <div className="text-slate-500">
            {row.delivery_district || 'Pune'}, {row.delivery_state}
          </div>
        </div>
      ),
    },
    {
      header: 'Required Quantity Range',
      accessor: (row) => (
        <div className="text-xs font-mono">
          <span className="font-semibold text-slate-900">
            {formatQuantity(row.minimum_quantity)} - {formatQuantity(row.maximum_quantity)}
          </span>
        </div>
      ),
    },
    {
      header: 'Delivery Window',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <div>{formatDateOnly(row.delivery_from)}</div>
          <div className="text-[11px] text-slate-400">to {formatDateOnly(row.delivery_until)}</div>
        </div>
      ),
    },
    {
      header: 'Indicative Price',
      accessor: (row) => (
        <span className="font-bold text-slate-900 text-xs">
          {row.indicative_price ? `${formatINR(row.indicative_price)}/kg` : 'Open'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'ACTIVE'
              ? 'success'
              : row.status === 'PARTIALLY_FILLED'
              ? 'warning'
              : row.status === 'FULFILLED'
              ? 'purple'
              : 'outline'
          }
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const offerColumns: Column<Offer>[] = [
    {
      header: 'Actionable Offer',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.crop_name || 'Tomato Offer'}</div>
          <div className="font-mono text-[11px] text-slate-400">{row.id.substring(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Buyer Proposer',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.buyer_name || 'Buyer Participant'}</div>
          <div className="text-slate-500 text-[11px]">
            {row.buyer_profile_id ? `${row.buyer_profile_id.substring(0, 12)}...` : 'Buyer Entity'}
          </div>
        </div>
      ),
    },
    {
      header: 'Offered Price & Quantity',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900 text-sm">
            {formatINR(row.unit_price)}/kg
          </div>
          <div className="text-[11px] text-slate-500">
            {formatQuantity(row.offered_quantity)} ({row.delivery_terms})
          </div>
        </div>
      ),
    },
    {
      header: 'Expires At',
      accessor: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <div>{formatDateTime(row.expires_at)}</div>
          <div className="text-[10px] text-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Valid Proposal
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'ACCEPTED'
              ? 'success'
              : row.status === 'PENDING'
              ? 'warning'
              : row.status === 'REJECTED'
              ? 'danger'
              : 'outline'
          }
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Transaction Workflow Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor the distinct lifecycle of Procurement Demands, Actionable Offers, and Accepted Orders.
          </p>
        </div>
      </div>

      {/* Concept Architecture Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            1. Buyer Demand
          </span>
          <p className="text-slate-500 mt-1">
            Procurement intent and aggregate requirements published by verified buyers and FPOs.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4 text-amber-600" />
            2. Actionable Offer
          </span>
          <p className="text-slate-500 mt-1">
            Binding commercial proposal tied to a listing with price, delivery terms, and expiry time.
          </p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            3. Accepted Order
          </span>
          <p className="text-slate-500 mt-1">
            Atomic lock creating an immutable financial snapshot. Economics can never silently change.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('demands')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'demands'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Buyer Demands ({demands.length})
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'offers'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Actionable Offers ({offers.length})
        </button>
      </div>

      {/* Active Tab Table */}
      {activeTab === 'demands' ? (
        <Card title="Published Procurement Demands" subtitle="Active requirements from buyers & FPO collectives">
          <DataTable
            columns={demandColumns}
            data={demands}
            isLoading={loading}
            emptyMessage="No procurement demands found"
          />
        </Card>
      ) : (
        <Card title="Submitted Actionable Offers" subtitle="Binding offers awaiting farmer decision or order snapshot">
          <DataTable
            columns={offerColumns}
            data={offers}
            isLoading={loading}
            emptyMessage="No offers found"
          />
        </Card>
      )}
    </div>
  );
}
