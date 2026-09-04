"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { MOCK_WAREHOUSES, MOCK_TRANSPORTERS } from "@/lib/mockData";
import {
  Warehouse,
  Truck,
  MapPin,
  ShieldCheck,
  Snowflake,
  Calculator,
  Phone,
  Layers,
} from "lucide-react";

export default function LogisticsPage() {
  const [distanceKm, setDistanceKm] = useState<string>("65");
  const [weightKg, setWeightKg] = useState<string>("1000");
  const [needColdChain, setNeedColdChain] = useState<boolean>(true);

  // Quote calculation
  const dist = parseFloat(distanceKm) || 0;
  const wt = parseFloat(weightKg) || 0;
  const baseRatePerKm = needColdChain ? 35 : 25;
  const estFreight = Math.max(800, dist * baseRatePerKm);
  const estHandling = Math.round((wt / 1000) * 300);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-600" />
            Logistics, Cold Storage & Warehouses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access verified agricultural storage facilities, cold-chain packhouses, and regional freight carriers across Maharashtra.
          </p>
        </div>
      </div>

      {/* Status Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Logistics & Distance Engine:</span> Live dynamic carrier routing and authoritative freight quotes are marked <span className="font-mono bg-amber-200 px-1 py-0.5 rounded text-amber-900 font-bold">BACKEND_NOT_AVAILABLE</span> (Logistics Engine pending Agent 9). The deterministic estimator below is for client prototype simulation only.
        </div>
      </div>

      {/* Interactive Freight & Logistics Cost Estimator */}
      <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <CardTitle className="text-base text-slate-900">
                Logistics Deduction Simulator
              </CardTitle>
            </div>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              Demo Prototype Only
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Simulate standard transport slab deductions for Net Farmer Realization (NFR) modeling. Not an authoritative carrier binding quote.
          </p>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Estimated Transit Distance (km)
              </label>
              <input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Cargo Weight (kg)
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Vehicle Reefer Type
              </label>
              <select
                value={needColdChain ? "cold" : "ambient"}
                onChange={(e) => setNeedColdChain(e.target.value === "cold")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 bg-white"
              >
                <option value="cold">Temperature Controlled (Reefer 4°C)</option>
                <option value="ambient">Ambient Ventilated Truck</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Simulated Logistics Deduction</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(estFreight + estHandling)}
              </span>
              <span className="text-slate-400 ml-2">
                (Freight: {formatCurrency(estFreight)} • Handling: {formatCurrency(estHandling)})
              </span>
            </div>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-mono">
              Demo Simulation: Slab(dist × rate) + Handling(wt)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Verified Warehouses */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Verified Cold Storage & Warehouses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_WAREHOUSES.map((wh) => (
            <Card key={wh.id} className="hover:border-slate-300 transition flex flex-col justify-between">
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {wh.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{wh.operator_name}</p>
                  </div>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center text-slate-600 gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{wh.district}, {wh.state}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Available Space</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {wh.available_capacity_mt} / {wh.total_capacity_mt} MT
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Storage Rate</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      ₹{wh.rate_per_quintal_per_month} / qtl / mo
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 block">Supported Commodities:</span>
                  <div className="flex flex-wrap gap-1">
                    {wh.supported_crops.map((c) => (
                      <span key={c} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transport Providers */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Certified Transport Providers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_TRANSPORTERS.map((tp) => (
            <Card key={tp.id} className="hover:border-slate-300 transition">
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {tp.company_name}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-500 pt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{tp.contact_number}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    ₹{tp.base_rate_per_km} / km
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500">Fleet Vehicles:</span>
                  <div className="flex flex-wrap gap-1">
                    {tp.vehicle_types.map((v) => (
                      <span key={v} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  Coverage: {tp.service_districts.join(", ")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
