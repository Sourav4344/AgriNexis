"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useDemo } from "@/lib/context/DemoContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { MOCK_MANDI_PRICES, MOCK_PRICE_PREDICTIONS } from "@/lib/mockData";
import {
  Megaphone,
  Store,
  PackageCheck,
  Handshake,
  TrendingUp,
  ArrowUpRight,
  Truck,
  Sparkles,
  Building2,
  Users,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { listings, demands, offers, orders } = useDemo();

  // Calculate high-level stats
  const activeDemandsCount = demands.filter((d) => d.status === "ACTIVE").length;
  const pendingOffersCount = offers.filter((o) => o.status === "PENDING").length;
  const inProgressOrders = orders.filter((o) =>
    ["CONFIRMED", "PICKUP_SCHEDULED", "IN_TRANSIT"].includes(o.status)
  );
  const totalProcuredValue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((acc, o) => acc + parseFloat(o.financials.snapshot_gross_selling_value), 0);

  const tomatoPrediction = MOCK_PRICE_PREDICTIONS.find((p) => p.crop_name === "Tomato");

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold">
            {role === "FPO" ? (
              <Users className="w-3.5 h-3.5" />
            ) : (
              <Building2 className="w-3.5 h-3.5" />
            )}
            <span>Active Persona: {role === "FPO" ? "FPO Operator Hub" : "Institutional Buyer"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {user.organization_name || user.display_name}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
            Real-time direct farm procurement with transparent Net Farmer Realization (NFR) calculations and verifiable fulfillment tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/demands/new">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Megaphone className="w-4 h-4 mr-1.5" />
              Post Procurement Demand
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold">
              <Store className="w-4 h-4 mr-1.5" />
              Browse Listings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-emerald-500/40 transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Demands
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {activeDemandsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Looking for ~45 MT</span>
              <Link href="/demands" className="text-emerald-700 font-semibold hover:underline">
                View Demands →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Bids & Offers
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {pendingOffersCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Awaiting farmer acceptance</span>
              <Link href="/offers" className="text-sky-700 font-semibold hover:underline">
                Track Offers →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Deliveries
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {inProgressOrders.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>1 pickup scheduled today</span>
              <Link href="/orders" className="text-amber-700 font-semibold hover:underline">
                Track Deliveries →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Procurement
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {formatCurrency(totalProcuredValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Across {orders.length} contracted lots</span>
              <span className="text-emerald-700 font-semibold">100% NFR audited</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* APMC Mandi Rates Live Ticker */}
      <Card className="border-slate-200 shadow-sm bg-slate-900 text-white">
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              APMC Mandi Benchmark Rates
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Simulated Market Feed
              </span>
            </h2>
          </div>
          <Link
            href="/intelligence"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
          >
            Full Market Analysis & Prediction Hub <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 p-2">
          {MOCK_MANDI_PRICES.map((mp) => (
            <div key={mp.id} className="p-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">{mp.crop_name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{mp.district}</span>
              </div>
              <div className="text-base font-black text-emerald-400 font-mono">
                ₹{mp.modal_price_per_kg} <span className="text-xs font-normal text-slate-400">/ kg</span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Range: ₹{mp.min_price_per_kg}-{mp.max_price_per_kg}</span>
                <span>{mp.mandi_name.split(" ")[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Featured Farmer Supply & Direct Marketplace */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Fresh Farm Lots Available for Procurement
              </h2>
              <p className="text-xs text-slate-500">
                Verified listings with AI Produce Quality grading and direct NFR transparency.
              </p>
            </div>
            <Link href="/marketplace">
              <Button variant="outline" size="sm">
                View All ({listings.length})
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.slice(0, 2).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Canonical SIH Highlight Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-xs text-emerald-950">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 text-sm">
                SIH Canonical Demo Scenario Ready
              </span>
              <p className="text-emerald-800 mt-1 leading-relaxed">
                Rahul Patil&apos;s 1,000 kg Tomato listing is available in Pune. In this test scenario, Buyer B&apos;s offer of ₹31/kg yields higher Net Realization (₹28,750) than Buyer A&apos;s ₹32/kg offer (₹25,500) due to ₹4,250 lower logistics deductions.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Active Order Deliveries & Price Signal */}
        <div className="space-y-6">
          {/* Active Orders Widget */}
          <Card>
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Ongoing Fulfillments</CardTitle>
              <Link href="/orders" className="text-xs text-emerald-700 font-semibold hover:underline">
                All Orders →
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0 divide-y divide-slate-100">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">
                      {ord.crop_name} ({formatQuantity(ord.financials.snapshot_quantity_kg)})
                    </span>
                    <Badge
                      variant={
                        ord.status === "DELIVERED" || ord.status === "COMPLETED"
                          ? "success"
                          : ord.status === "DISPUTED"
                          ? "danger"
                          : "warning"
                      }
                      size="sm"
                    >
                      {ord.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Farmer: {ord.farmer_name}</span>
                    <span className="font-mono font-bold text-slate-700">
                      {formatCurrency(ord.financials.snapshot_gross_selling_value)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-slate-400">Trk: {ord.tracking_number}</span>
                    <Link
                      href={`/orders/${ord.id}`}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      View Details & Snapshot →
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Price Prediction Advisory Widget */}
          {tomatoPrediction && (
            <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Price Trend Forecast</span>
                  </div>
                  <Badge variant="success" size="sm">
                    {tomatoPrediction.trend}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-1 text-slate-900">
                  {tomatoPrediction.crop_name} ({tomatoPrediction.variety_name})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                  <span className="text-slate-500">Current Modal:</span>
                  <span className="font-bold text-slate-900">₹{tomatoPrediction.current_modal_price}/kg</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                  <span className="text-slate-500">1-Day / 3-Day Forecast:</span>
                  <span className="font-bold text-emerald-700">₹{tomatoPrediction.forecast_days_1} / ₹{tomatoPrediction.forecast_days_3}</span>
                </div>
                <div className="pt-1 text-slate-600 text-[11px]">
                  <strong>Key Driver:</strong> {tomatoPrediction.drivers[0]}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
