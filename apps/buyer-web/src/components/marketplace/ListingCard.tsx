"use client";

import React, { useState } from "react";
import { ProduceListing } from "@/lib/types";
import { Card, CardContent, CardFooter } from "../ui/Card";
import { Button } from "../ui/Button";
import { QualityBadge } from "./QualityBadge";
import { MakeOfferModal } from "./MakeOfferModal";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { useDemo } from "@/lib/context/DemoContext";
import {
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Truck,
  CheckCircle,
} from "lucide-react";

interface ListingCardProps {
  listing: ProduceListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { isDemoMode } = useDemo();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [showQualityDetails, setShowQualityDetails] = useState(false);

  const isDemoCanonical = listing.farmer_name.includes("Rahul Patil");
  const hasLiveQuality = Boolean(listing.quality_summary && Object.keys(listing.quality_summary).length > 0);
  const hasDemoQuality = isDemoMode && Boolean(listing.quality_report || listing.quality_summary);

  return (
    <>
      <Card className="hover:shadow-md transition border-slate-200 flex flex-col justify-between group">
        <CardContent className="p-5 space-y-3.5">
          {/* Header row: Crop, Variety, Grade */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  {listing.crop_name}
                </h3>
                {isDemoCanonical && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    SIH Canonical
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{listing.variety_name}</p>
            </div>
            <QualityBadge summary={listing.quality_summary || (isDemoMode ? listing.quality_report?.observations : undefined)} />
          </div>

          {/* Farmer & Location details */}
          <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span className="flex items-center gap-1">
                👤 {listing.farmer_name}
              </span>
              {listing.distance_km && (
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Truck className="w-3 h-3 text-slate-400" />
                  {listing.distance_km} km away
                </span>
              )}
            </div>
            <div className="flex items-center text-slate-500 text-[11px] gap-1">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>
                {listing.district}, {listing.state} {listing.postal_area && `(${listing.postal_area})`}
              </span>
            </div>
          </div>

          {/* Quantity & Asking Price */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Available Stock</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatQuantity(listing.available_quantity_kg)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Asking Price</span>
              <span className="font-bold text-emerald-700 text-sm">
                ₹{listing.expected_price_per_kg} / kg
              </span>
            </div>
          </div>

          {/* Structured Quality Facts summary toggle */}
          {hasLiveQuality ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowQualityDetails(!showQualityDetails)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{showQualityDetails ? "Hide Quality Observations" : "View Structured Quality Facts"}</span>
              </button>

              {showQualityDetails && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-slate-900 font-bold">
                    <span>Backend Quality Facts</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono">
                      Authoritative
                    </span>
                  </div>
                  <ul className="text-slate-700 space-y-1 text-[11px]">
                    {Object.entries(listing.quality_summary || {}).map(([k, v]) => (
                      <li key={k}>• <strong>{k.replace(/_/g, " ")}:</strong> {String(v)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : hasDemoQuality && listing.quality_report ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowQualityDetails(!showQualityDetails)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{showQualityDetails ? "Hide Quality Observations" : "View Structured Quality Facts (Demo)"}</span>
              </button>

              {showQualityDetails && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-slate-900 font-bold">
                    <span>Synthetic Visual Observations</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-mono">
                      Demo Fixture
                    </span>
                  </div>
                  <ul className="text-slate-700 space-y-1 text-[11px]">
                    <li>• <strong>Color:</strong> {listing.quality_report.observations.color_uniformity}</li>
                    <li>• <strong>Surface Defects:</strong> {listing.quality_report.observations.surface_defects_percent}%</li>
                    <li>• <strong>Size:</strong> {listing.quality_report.observations.size_consistency}</li>
                    <li>• <strong>Ripeness:</strong> {listing.quality_report.observations.ripeness}</li>
                  </ul>
                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
                    Visual AI assistance prototype only. Not a certified lab assay or safety guarantee (Agent 10 Research).
                  </p>
                </div>
              )}
            </div>
          ) : !isDemoMode ? (
            <div className="pt-1 text-[11px] text-slate-400">
              Quality Data: <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">QUALITY_DATA_NOT_AVAILABLE</span>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Avail: {formatDate(listing.available_from)}</span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsOfferModalOpen(true)}
            className="shadow-sm font-semibold"
          >
            Make Offer
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      <MakeOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        listing={listing}
      />
    </>
  );
}
