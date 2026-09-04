"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useDemo } from "@/lib/context/DemoContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { MOCK_FPO_MEMBERS } from "@/lib/mockData";
import {
  Users2,
  Package,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin,
  Phone,
  CheckCircle2,
  Plus,
  Truck,
} from "lucide-react";
import Link from "next/link";

export default function FPOHubPage() {
  const { user } = useAuth();
  const { listings, demands } = useDemo();
  const [selectedTab, setSelectedTab] = useState<"aggregation" | "members">("aggregation");

  // Aggregate stats
  const totalMembers = MOCK_FPO_MEMBERS.length;
  const totalPooledStockKg = MOCK_FPO_MEMBERS.reduce((acc, m) => acc + m.active_supply_kg, 0);
  const totalListings = MOCK_FPO_MEMBERS.reduce((acc, m) => acc + m.active_listings_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users2 className="w-6 h-6 text-amber-600" />
              FPO Aggregation & Pooling Hub
            </h1>
            <Badge variant="warning">FPO Operator</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregate individual smallholder produce into high-volume commercial lots, coordinate shared cold storage, and negotiate higher net farmer payouts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/demands/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20">
              <Plus className="w-4 h-4 mr-1.5" />
              Post FPO Pooled Demand
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Active Member Farmers
              </span>
              <Users2 className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {totalMembers} Registered
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalListings} Active farmer produce listings across Nashik & Pune
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Pooled Supply Volume
              </span>
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {formatQuantity(totalPooledStockKg)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ready for bulk truckload dispatch (15.5 MT)
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-200 bg-sky-50/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                Pooled Freight Economics
              </span>
              <Truck className="w-5 h-5 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 text-emerald-700">
              ₹38,500 / mo
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ~22% higher NFR realization via pooled 16T transport
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setSelectedTab("aggregation")}
          className={`pb-3 border-b-2 transition ${
            selectedTab === "aggregation"
              ? "border-amber-600 text-amber-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Collective Pools (2 Lots)
        </button>
        <button
          onClick={() => setSelectedTab("members")}
          className={`pb-3 border-b-2 transition ${
            selectedTab === "members"
              ? "border-amber-600 text-amber-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Member Farmer Roster ({MOCK_FPO_MEMBERS.length})
        </button>
      </div>

      {/* Tab 1: Aggregation pools */}
      {selectedTab === "aggregation" && (
        <div className="space-y-4">
          {/* Pool 1 */}
          <Card>
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    Pooled Lot #FPO-MH-TOM-01: Tomato
                  </CardTitle>
                  <Badge variant="success">Aggregation Ready</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated from 2 member farms in Haveli & Dindori • Total Target: 10,000 kg
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded">
                Target: ₹33.00/kg
              </span>
            </CardHeader>
            <CardContent className="p-5 pt-1 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Pooled Volume</span>
                  <span className="font-bold text-slate-900 text-sm">3,500 kg (35% filled)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Consolidation Hub</span>
                  <span className="font-bold text-slate-900">Sahyadri Packhouse Bay 2</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated Pooled Freight</span>
                  <span className="font-bold text-emerald-700">₹1.20 / kg (vs ₹3.50 individual)</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Member Farmer</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3 text-right">Committed Qty</th>
                      <th className="py-2 px-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-semibold">Rahul Patil</td>
                      <td className="py-2 px-3 text-slate-500">Pune, Maharashtra</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">1,000 kg</td>
                      <td className="py-2 px-3"><Badge variant="default" size="sm">Lead Farmer</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold">Sunita Gaikwad</td>
                      <td className="py-2 px-3 text-slate-500">Nashik, Maharashtra</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">2,500 kg</td>
                      <td className="py-2 px-3"><Badge variant="default" size="sm">Member</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pool 2 */}
          <Card>
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    Pooled Lot #FPO-MH-ONI-02: Nashik Garwa Onion
                  </CardTitle>
                  <Badge variant="info">In Dispatch</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated from Suresh Deshmukh & cluster members • Total: 12,000 kg
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded">
                Contracted: ₹29.00/kg
              </span>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tab 2: Member roster */}
      {selectedTab === "members" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Farmer Name</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Membership Role</th>
                  <th className="py-3 px-4">Primary Crops</th>
                  <th className="py-3 px-4 text-right">Available Supply</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_FPO_MEMBERS.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.farmer_name}
                      <span className="block text-[11px] font-normal text-slate-500 font-mono">
                        {m.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {m.district}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" size="sm">
                        {m.membership_role.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {m.primary_crops.map((c) => (
                          <span key={c} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                      {formatQuantity(m.active_supply_kg)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
