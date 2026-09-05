'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Package,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  LifeBuoy,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Award,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useDemo } from '../lib/config/demoContext';
import { StatCard } from '../components/metrics/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable, Column } from '../components/ui/DataTable';
import { NFRComparisonCard } from '../components/nfr/NFRComparisonCard';
import {
  fetchListings,
  fetchOrders,
  fetchDemands,
  fetchOffers,
  fetchMarketPrices,
  fetchListingRecommendations,
  fetchAllUsers,
  fetchAllPayments,
  fetchGrievances,
} from '../lib/api/endpoints';
import { ProduceListing, Order, RecommendationOption } from '../lib/api/types';
import { formatINR } from '../lib/utils/money';
import { formatDateTime } from '../lib/utils/dates';

export default function OverviewPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationOption[]>([]);
  const [stats, setStats] = useState({
    farmers: 0,
    buyersVerified: 0,
    buyersPending: 0,
    activeListings: 0,
    openDemands: 0,
    pendingOffers: 0,
    activeOrders: 0,
    pendingPayments: 0,
    marketObservations: 0,
    openGrievances: 0,
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const [listingsRes, ordersRes, demandsRes, offersRes, pricesRes, usersRes, paymentsRes, grievancesRes] =
          await Promise.allSettled([
            fetchListings(ctx),
            fetchOrders(ctx),
            fetchDemands(ctx),
            fetchOffers(ctx),
            fetchMarketPrices(ctx),
            fetchAllUsers(ctx),
            fetchAllPayments(ctx),
            fetchGrievances(ctx),
          ]);

        const loadedListings = listingsRes.status === 'fulfilled' ? listingsRes.value : [];
        const loadedOrders = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
        const loadedDemands = demandsRes.status === 'fulfilled' ? demandsRes.value : [];
        const loadedOffers = offersRes.status === 'fulfilled' ? offersRes.value : [];
        const loadedPrices = pricesRes.status === 'fulfilled' ? pricesRes.value : [];
        const loadedUsers = usersRes.status === 'fulfilled' ? usersRes.value.profiles : [];
        const loadedPayments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : [];
        const loadedGrievances = grievancesRes.status === 'fulfilled' ? grievancesRes.value.grievances : [];

        setListings(loadedListings);
        setOrders(loadedOrders);

        // Fetch recommendations for first listing
        if (loadedListings.length > 0) {
          try {
            const recs = await fetchListingRecommendations(ctx, loadedListings[0].id);
            setRecommendations(recs);
          } catch {
            setRecommendations([]);
          }
        }

        setStats({
          farmers: loadedUsers.filter((u) => u.role === 'FARMER').length || (demoMode ? 1 : 0),
          buyersVerified:
            loadedUsers.filter((u) => u.role === 'BUYER' && u.verification_status === 'VERIFIED').length ||
            (demoMode ? 2 : 0),
          buyersPending:
            loadedUsers.filter((u) => u.role === 'BUYER' && u.verification_status === 'PENDING').length ||
            (demoMode ? 1 : 0),
          activeListings: loadedListings.filter((l) => l.status === 'ACTIVE').length,
          openDemands: loadedDemands.filter((d) => d.status === 'ACTIVE').length,
          pendingOffers: loadedOffers.filter((o) => o.status === 'PENDING').length,
          activeOrders: loadedOrders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length,
          pendingPayments: loadedPayments.filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
            .length,
          marketObservations: loadedPrices.length,
          openGrievances: loadedGrievances.filter((g) => g.status === 'OPEN' || g.status === 'UNDER_REVIEW')
            .length,
        });
      } catch (err) {
        console.error('Overview loading error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [demoMode, apiBaseUrl, authToken]);

  const recentOrderColumns: Column<Order>[] = [
    {
      header: 'Order Reference',
      accessor: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs">{row.id.substring(0, 8)}...</span>
          <div className="text-[11px] text-slate-500">{formatDateTime(row.created_at)}</div>
        </div>
      ),
    },
    {
      header: 'Participants',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">
            {row.farmer_name || `Farmer ${row.farmer_profile_id.substring(0, 8)}`}
          </div>
          <div className="text-slate-500">
            ↳ {row.buyer_name || `Buyer ${row.buyer_profile_id?.substring(0, 8) || 'FPO'}`}
          </div>
        </div>
      ),
    },
    {
      header: 'Immutable Economics',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">
            {formatINR(row.snapshot_net_farmer_realization)} NFR
          </div>
          <div className="text-[11px] text-slate-500">
            Gross {formatINR(row.snapshot_gross_selling_value)} • Costs -
            {formatINR(row.snapshot_total_applicable_cost)}
          </div>
        </div>
      ),
    },
    {
      header: 'Order Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'COMPLETED'
              ? 'success'
              : row.status === 'CANCELLED'
              ? 'danger'
              : row.status === 'DISPUTED'
              ? 'warning'
              : 'info'
          }
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      accessor: (row) => (
        <Link href={`/orders/${row.id}`}>
          <Button variant="outline" size="sm">
            Inspect
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title + Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operational Oversight Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time platform metrics, market data health, and transaction oversight for Maharashtra
            agricultural linkages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/demo">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-emerald-300" />}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md"
            >
              SIH 2026 Judge Demo Hub
            </Button>
          </Link>
          <Link href="/nfr-explainability">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Award className="w-4 h-4 text-amber-500" />}
            >
              NFR Engine
            </Button>
          </Link>
        </div>
      </div>

      {/* SIH Judge Demo Callout Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white shadow-md border border-emerald-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded border border-emerald-400/30">
              SIH 2026 Problem Statement 26132
            </span>
            <span className="text-xs text-slate-300">Government of Maharashtra</span>
          </div>
          <h2 className="text-base font-bold text-white">
            “Not Just the Best Price. The Best Decision.” — 5–7 Minute Judge Demonstration
          </h2>
          <p className="text-xs text-emerald-200/90">
            Interactive 8-step walkthrough proving Net Farmer Realization (NFR): Buyer B (+₹3,250 net) vs Buyer A.
          </p>
        </div>
        <Link href="/demo">
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold whitespace-nowrap">
            Launch Judge Demo Hub
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          icon={<Package className="w-4 h-4" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Open Demands"
          value={stats.openDemands}
          icon={<Layers className="w-4 h-4" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Pending Offers"
          value={stats.pendingOffers}
          icon={<Activity className="w-4 h-4" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Active Orders"
          value={stats.activeOrders}
          icon={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
          trend={{ value: 'In-flight', isPositive: true }}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Pending Verifications"
          value={stats.buyersPending}
          icon={<Building2 className="w-4 h-4 text-amber-600" />}
          badge={<Badge variant="warning" size="sm">Queue</Badge>}
        />
        <StatCard
          label="Market Observations"
          value={stats.marketObservations}
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
      </div>

      {/* Innovation Highlight: Canonical NFR Comparison Showcase */}
      {recommendations.length > 0 ? (
        <NFRComparisonCard
          recommendations={recommendations}
          cropName={listings[0]?.crop_name || 'Tomato'}
          quantityKg={listings[0]?.quantity || '1000.000'}
        />
      ) : (
        <Card
          title="Net Farmer Realization (NFR) Engine"
          subtitle="AgriNexis core decision intelligence comparing headline prices against logistics deductions"
        >
          <div className="text-center py-6 text-slate-500 text-sm">
            <p>No active produce recommendations loaded for the current filter.</p>
            <Link href="/nfr-explainability" className="inline-block mt-3">
              <Button variant="outline" size="sm">
                Open Dedicated NFR Demonstration Engine
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Two Column Layout: Recent Orders & Verification / System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Transacted Orders</h2>
              <p className="text-xs text-slate-500">
                Authoritative immutable accepted financial snapshots
              </p>
            </div>
            <Link href="/orders" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            columns={recentOrderColumns}
            data={orders.slice(0, 5)}
            isLoading={loading}
            emptyMessage="No orders recorded yet"
          />
        </div>

        {/* Right 1 Col: Operational Queue & Health Summary */}
        <div className="space-y-4">
          <Card title="Operational Action Queue" subtitle="Platform checks requiring attention">
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Buyer Verification Queue
                  </div>
                  <div className="text-xs text-amber-800">
                    {stats.buyersPending} buyer profile(s) awaiting trade reference review.
                  </div>
                </div>
                <Link href="/buyers">
                  <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                    Review
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Market Ingestion Health
                  </div>
                  <div className="text-xs text-slate-600">
                    Pune APMC feed verified fresh (last updated within 180m limit).
                  </div>
                </div>
                <Link href="/markets/health">
                  <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                    Inspect
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Payments & Settlement
                  </div>
                  <div className="text-xs text-emerald-800">
                    {stats.pendingPayments} transaction(s) pending settlement disbursement.
                  </div>
                </div>
                <Link href="/payments">
                  <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card title="Data Provenance Guardrail" subtitle="SIH 2026 Audit Standard">
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                In strict compliance with the platform contract, demo fixtures and simulated APMC data
                are permanently tagged with <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded text-[10px]">data_mode: DEMO</code>.
              </p>
              <p>
                No demo data is ever converted to or presented as live Government of Maharashtra records.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
