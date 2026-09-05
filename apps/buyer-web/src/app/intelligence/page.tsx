"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity, kgToQuintals } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { MOCK_MANDI_PRICES, MOCK_PRICE_PREDICTIONS } from "@/lib/mockData";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function MarketIntelligencePage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("ALL");

  const filteredMandis =
    selectedCrop === "ALL"
      ? MOCK_MANDI_PRICES
      : MOCK_MANDI_PRICES.filter((m) => m.crop_name === selectedCrop);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "RISING":
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case "FALLING":
        return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case "INSUFFICIENT_DATA":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "RISING":
        return <Badge variant="success">RISING (&gt; +2%)</Badge>;
      case "FALLING":
        return <Badge variant="danger">FALLING (&lt; -2%)</Badge>;
      case "INSUFFICIENT_DATA":
        return <Badge variant="warning">INSUFFICIENT DATA</Badge>;
      default:
        return <Badge variant="default">STABLE (±2%)</Badge>;
    }
  };

  const getAdvisoryBadge = (signal: string) => {
    switch (signal) {
      case "WAIT":
        return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-bold">WAIT</span>;
      case "SELL_NOW":
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">SELL NOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-bold">INSUFFICIENT DATA</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Market Intelligence & APMC Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time APMC Mandi arrivals, benchmark modal prices, and AI-driven 1-day and 3-day price movement predictions (Agent 7 Prediction Contract).
          </p>
        </div>
      </div>

      {/* AI Price Prediction Forecast Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Price Prediction Engine (1 & 3-Day Forecast Horizons)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_PRICE_PREDICTIONS.map((pred) => (
            <Card key={pred.crop_name} className="border-slate-200 shadow-sm flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {pred.crop_name}
                    </h3>
                    <p className="text-xs text-slate-500">{pred.variety_name}</p>
                  </div>
                  {getTrendBadge(pred.trend)}
                </div>

                {/* Rates comparison: 1d and 3d horizons only */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Modal</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{pred.current_modal_price}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">1-Day (24h)</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ₹{pred.forecast_days_1}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">3-Day (72h)</span>
                    <span className="font-bold text-slate-700 text-sm">
                      ₹{pred.forecast_days_3}
                    </span>
                  </div>
                </div>

                {/* Warnings if any */}
                {pred.warnings && pred.warnings.length > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 space-y-1">
                    {pred.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Drivers */}
                <div className="space-y-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-600 block">Identified Drivers:</span>
                  <ul className="text-slate-600 space-y-1 text-[11px]">
                    {pred.drivers.map((d, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Confidence: {pred.confidence_score !== null ? `${(pred.confidence_score * 100).toFixed(0)}%` : "Uncalibrated / Not Available"}
                  </span>
                  <div>{getAdvisoryBadge(pred.sell_wait_signal)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* APMC Benchmark Rates Table */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Live APMC Mandi Daily Observations
          </h2>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-2.5 py-1 border border-slate-300 rounded-md text-slate-800 bg-white"
            >
              <option value="ALL">All Crops</option>
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
            </select>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Market (APMC)</th>
                  <th className="py-3 px-4">District / State</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4 text-right">Min Rate</th>
                  <th className="py-3 px-4 text-right">Modal Rate</th>
                  <th className="py-3 px-4 text-right">Max Rate</th>
                  <th className="py-3 px-4 text-right">Today Arrivals (kg & qtl)</th>
                  <th className="py-3 px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMandis.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.mandi_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {m.district}, {m.state}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {m.crop_name} <span className="font-normal text-slate-500">({m.variety_name})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{m.min_price_per_kg}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{m.modal_price_per_kg} / kg
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{m.max_price_per_kg}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 font-semibold">
                      {kgToQuintals(m.arrival_quantity_kg)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                        {m.data_mode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
