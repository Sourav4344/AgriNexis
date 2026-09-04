"use client";

import React from "react";
import Link from "next/link";
import { useDemo } from "@/lib/context/DemoContext";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Megaphone,
  Plus,
  Calendar,
  MapPin,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function DemandsPage() {
  const { demands, closeDemand, listings } = useDemo();
  const { role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-600" />
            Procurement Demands
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Broadcast institutional buying requirements to regional farmers and FPOs with target pricing and quality thresholds.
          </p>
        </div>
        <Link href="/demands/new">
          <Button className="shadow-md shadow-emerald-600/20 font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            Post New Demand
          </Button>
        </Link>
      </div>

      {/* Demands List */}
      <div className="space-y-4">
        {demands.map((demand) => {
          // Find matching supply
          const matchingListings = listings.filter(
            (l) =>
              l.crop_name.toLowerCase() === demand.crop_name.toLowerCase() &&
              l.status === "ACTIVE"
          );

          const maxVal = parseFloat(demand.maximum_quantity) || 1;
          const fulfilledVal = parseFloat(demand.fulfilled_quantity_kg || "0");
          const fulfilledPct = Math.min(100, (fulfilledVal / maxVal) * 100);

          return (
            <Card key={demand.id} className="hover:border-slate-300 transition">
              <CardContent className="p-5 space-y-4">
                {/* Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {demand.crop_name}
                      </h3>
                      {demand.variety_name && (
                        <span className="text-xs text-slate-500 font-medium">
                          ({demand.variety_name})
                        </span>
                      )}
                      <Badge
                        variant={demand.status === "ACTIVE" ? "success" : "default"}
                        size="sm"
                      >
                        {demand.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Demand Ref: <span className="font-mono">{demand.id}</span> • Posted by {demand.organization_name}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {demand.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeDemand(demand.id)}
                        className="text-rose-700 hover:bg-rose-50 border-rose-200"
                      >
                        Close Demand
                      </Button>
                    )}
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Quantity Target</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatQuantity(demand.minimum_quantity)} - {formatQuantity(demand.maximum_quantity)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Indicative Unit Price</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {demand.indicative_price ? `₹${demand.indicative_price} / kg` : "Negotiable"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Min Quality Grade</span>
                    <span className="font-bold text-slate-900 text-sm">
                      Grade {demand.quality_requirements?.min_grade || "A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Delivery Window</span>
                    <span className="font-medium text-slate-800 text-[11px]">
                      {formatDate(demand.delivery_from)} to {formatDate(demand.delivery_until)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Fulfilled: <strong>{formatQuantity(demand.fulfilled_quantity_kg || "0")}</strong></span>
                    <span>{fulfilledPct.toFixed(0)}% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${fulfilledPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer notes & matching supply */}
                <div className="p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Destination: <strong>{demand.delivery_district || "District Hub"}, {demand.delivery_state}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-800 font-semibold">
                      {matchingListings.length} Matching Farmer Lots Available
                    </span>
                    <Link
                      href={`/marketplace?crop=${demand.crop_name}`}
                      className="text-emerald-700 underline font-semibold"
                    >
                      View Supply →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
