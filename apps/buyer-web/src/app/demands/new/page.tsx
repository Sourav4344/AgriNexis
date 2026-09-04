"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/context/DemoContext";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QualityGrade } from "@/lib/types";
import { Megaphone, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NewDemandPage() {
  const router = useRouter();
  const { createDemand } = useDemo();
  const { user, role } = useAuth();

  const [cropName, setCropName] = useState("Tomato");
  const [varietyName, setVarietyName] = useState("Hybrid Red / Abhinav");
  const [minQty, setMinQty] = useState("2000");
  const [maxQty, setMaxQty] = useState("10000");
  const [targetPrice, setTargetPrice] = useState("32.00");
  const [minGrade, setMinGrade] = useState<QualityGrade>("A");
  const [maxDefects, setMaxDefects] = useState("5");
  const [windowStart, setWindowStart] = useState("2026-09-06");
  const [windowEnd, setWindowEnd] = useState("2026-09-18");
  const [destDistrict, setDestDistrict] = useState("Pune Distribution Hub");
  const [destState, setDestState] = useState("Maharashtra");
  const [notes, setNotes] = useState("Firm, deep red, no fruit borer damage. Direct intake at packhouse bay.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const min = parseFloat(minQty);
    const max = parseFloat(maxQty);
    const price = parseFloat(targetPrice);

    if (min <= 0 || max < min) {
      setError("Max quantity must be greater than or equal to min quantity.");
      return;
    }
    if (price <= 0) {
      setError("Target price must be positive.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createDemand({
        created_by_role: role === "FPO" ? "FPO" : "BUYER",
        organization_name: user.organization_name || user.display_name,
        crop_id: `crop-${cropName.toLowerCase()}`,
        crop_name: cropName,
        variety_name: varietyName,
        minimum_quantity: min.toFixed(3),
        maximum_quantity: max.toFixed(3),
        indicative_price: price.toFixed(2),
        currency: "INR",
        quality_requirements: {
          min_grade: minGrade,
          max_defects_percent: parseFloat(maxDefects) || 5,
          notes,
        },
        delivery_from: windowStart,
        delivery_until: windowEnd,
        delivery_district: destDistrict,
        delivery_state: destState,
      });
      setIsSubmitting(false);
      router.push("/demands");
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Failed to post demand.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/demands">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Post Institutional Procurement Demand
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish your purchase volume requirements to registered local farmers and FPO clusters.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Commodity details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                1. Commodity Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Commodity / Crop *
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Pomegranate">Pomegranate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Variety Specification
                  </label>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                    placeholder="e.g. Hybrid Red, Nashik Garwa, Kufri Jyoti"
                  />
                </div>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                2. Volume & Target Pricing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Volume (kg) *
                  </label>
                  <input
                    type="number"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Volume (kg) *
                  </label>
                  <input
                    type="number"
                    value={maxQty}
                    onChange={(e) => setMaxQty(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Indicative Price (₹/kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Quality thresholds */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                3. Quality Standards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimum Grade Required *
                  </label>
                  <select
                    value={minGrade}
                    onChange={(e) => setMinGrade(e.target.value as QualityGrade)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Processing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Defects Allowed (%)
                  </label>
                  <input
                    type="number"
                    value={maxDefects}
                    onChange={(e) => setMaxDefects(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quality & Packaging Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                />
              </div>
            </div>

            {/* Delivery and destination */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                4. Delivery Logistics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Window Start Date *
                  </label>
                  <input
                    type="date"
                    value={windowStart}
                    onChange={(e) => setWindowStart(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Window End Date *
                  </label>
                  <input
                    type="date"
                    value={windowEnd}
                    onChange={(e) => setWindowEnd(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination District / Hub *
                  </label>
                  <input
                    type="text"
                    value={destDistrict}
                    onChange={(e) => setDestDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Destination State *
                  </label>
                  <input
                    type="text"
                    value={destState}
                    onChange={(e) => setDestState(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Link href="/demands">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                <Megaphone className="w-4 h-4 mr-1.5" />
                Publish Procurement Demand
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
