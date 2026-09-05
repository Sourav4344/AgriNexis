'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Layers,
  Award,
  CheckCircle2,
  DollarSign,
  Truck,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/metrics/StatCard';
import {
  fetchListings,
  fetchOrders,
  fetchDemands,
  fetchOffers,
  fetchMarketPrices,
  fetchAllUsers,
} from '../../lib/api/endpoints';
import { ProduceListing, Order, BuyerDemand, MandiPrice, Profile } from '../../lib/api/types';
import { formatINR, moneyToNumber } from '../../lib/utils/money';

export default function AnalyticsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [demands, setDemands] = useState<BuyerDemand[]>([]);
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const [l, o, d, p, u] = await Promise.all([
          fetchListings(ctx),
          fetchOrders(ctx),
          fetchDemands(ctx),
          fetchMarketPrices(ctx),
          fetchAllUsers(ctx),
        ]);
        setListings(l);
        setOrders(o);
        setDemands(d);
        setPrices(p);
        setUsers(u.profiles);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  // Defensible metric computations
  const totalVolumeKg = listings.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0), 0);
  const transactedVolumeKg = orders.reduce((acc, o) => acc + (parseFloat(o.snapshot_quantity_kg) || 0), 0);
  const totalNFRTransacted = orders.reduce(
    (acc, o) => acc + moneyToNumber(o.snapshot_net_farmer_realization),
    0
  );
  const totalLogisticsDeductions = orders.reduce(
    (acc, o) => acc + moneyToNumber(o.snapshot_total_applicable_cost),
    0
  );

  const listingsByStatus = listings.reduce((acc: Record<string, number>, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const ordersByStatus = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const dataModeDistribution = prices.reduce((acc: Record<string, number>, p) => {
    acc[p.data_mode] = (acc[p.data_mode] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operational Analytics & Volume Distribution
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Defensible data metrics derived strictly from authoritative backend transactions and market feeds.
          </p>
        </div>
        {demoMode && (
          <Badge variant="demo" size="md">
            DEMO DATA — NOT LIVE GOVERNMENT DATA
          </Badge>
        )}
      </div>

      {/* Aggregate Volume & Financial Realization KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Listed Supply"
          value={`${totalVolumeKg.toLocaleString()} kg`}
          icon={<Layers className="w-4 h-4 text-emerald-700" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Transacted Volume"
          value={`${transactedVolumeKg.toLocaleString()} kg`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Total Accepted NFR Snapshot"
          value={formatINR(totalNFRTransacted, false)}
          icon={<DollarSign className="w-4 h-4 text-emerald-700" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
        <StatCard
          label="Optimized Logistics Cost"
          value={formatINR(totalLogisticsDeductions, false)}
          icon={<Truck className="w-4 h-4 text-rose-600" />}
          dataMode={demoMode ? 'DEMO' : 'LIVE'}
        />
      </div>

      {/* Distributions Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Listings by Status */}
        <Card title="Listing Status Distribution" subtitle="Active produce catalog breakdown">
          <div className="space-y-3 text-xs">
            {Object.entries(listingsByStatus).length > 0 ? (
              Object.entries(listingsByStatus).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">{status}</span>
                    <span className="text-slate-900 font-mono font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${(count / listings.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 py-4 text-center">No listings recorded</div>
            )}
          </div>
        </Card>

        {/* Orders by Status */}
        <Card title="Order Lifecycle Distribution" subtitle="Fulfillment pipeline status">
          <div className="space-y-3 text-xs">
            {Object.entries(ordersByStatus).length > 0 ? (
              Object.entries(ordersByStatus).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">{status}</span>
                    <span className="text-slate-900 font-mono font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(count / orders.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 py-4 text-center">No orders recorded</div>
            )}
          </div>
        </Card>

        {/* Market Data Mode Provenance */}
        <Card title="Market Provenance Modes" subtitle="Data mode distribution in mandi feeds">
          <div className="space-y-3 text-xs">
            {Object.entries(dataModeDistribution).length > 0 ? (
              Object.entries(dataModeDistribution).map(([mode, count]) => (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">{mode}</span>
                    <span className="text-slate-900 font-mono font-bold">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        mode === 'LIVE'
                          ? 'bg-emerald-600'
                          : mode === 'CACHED'
                          ? 'bg-cyan-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${(count / prices.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 py-4 text-center">No market prices recorded</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
