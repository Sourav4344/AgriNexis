"use client";

import React, { useState, useMemo } from "react";
import { useDemo } from "@/lib/context/DemoContext";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { QualityGrade } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Filter, SlidersHorizontal, Store, Sparkles } from "lucide-react";

export default function MarketplacePage() {
  const { listings } = useDemo();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("DATE_DESC");

  // Extract unique filters
  const crops = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.crop_name)));
  }, [listings]);

  const districts = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.district)));
  }, [listings]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((l) => {
        if (l.status !== "ACTIVE") return false;
        if (selectedCrop !== "ALL" && l.crop_name !== selectedCrop) return false;
        if (selectedDistrict !== "ALL" && l.district !== selectedDistrict) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCrop = l.crop_name.toLowerCase().includes(q);
          const matchVariety = l.variety_name.toLowerCase().includes(q);
          const matchFarmer = l.farmer_name.toLowerCase().includes(q);
          const matchDistrict = l.district.toLowerCase().includes(q);
          if (!matchCrop && !matchVariety && !matchFarmer && !matchDistrict) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "PRICE_ASC") {
          return parseFloat(a.expected_price_per_kg) - parseFloat(b.expected_price_per_kg);
        }
        if (sortBy === "PRICE_DESC") {
          return parseFloat(b.expected_price_per_kg) - parseFloat(a.expected_price_per_kg);
        }
        if (sortBy === "QTY_DESC") {
          return parseFloat(b.available_quantity_kg) - parseFloat(a.available_quantity_kg);
        }
        if (sortBy === "DISTANCE_ASC") {
          return (a.distance_km || 999) - (b.distance_km || 999);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [listings, selectedCrop, selectedDistrict, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" />
            Produce Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover verified farm-gate produce listings with farmer-declared specs, structured quality facts, and transparent NFR terms.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200">
            {filteredListings.length} Available Listings
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          {/* Top row: search & sorting */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by crop, variety, farmer name, district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="DATE_DESC">Newest First</option>
                <option value="DISTANCE_ASC">Nearest Distance (km)</option>
                <option value="PRICE_ASC">Lowest Price (₹/kg)</option>
                <option value="PRICE_DESC">Highest Price (₹/kg)</option>
                <option value="QTY_DESC">Highest Quantity</option>
              </select>
            </div>
          </div>

          {/* Bottom row: pill filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Crop:</span>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-800"
              >
                <option value="ALL">All Commodities</option>
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-800"
              >
                <option value="ALL">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCrop !== "ALL" ||
              selectedDistrict !== "ALL" ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCrop("ALL");
                  setSelectedDistrict("ALL");
                  setSearchQuery("");
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Produce Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No matching produce listings</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or clear the filters to view all available agricultural lots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
