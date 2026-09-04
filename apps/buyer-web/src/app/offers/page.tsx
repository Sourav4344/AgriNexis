"use client";

import React from "react";
import Link from "next/link";
import { useDemo } from "@/lib/context/DemoContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate, timeAgo } from "@/lib/utils/date";
import { Handshake, Store, ArrowUpRight, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

export default function OffersPage() {
  const { offers, withdrawOffer, listings } = useDemo();

  const getStatusVariant = (st: string) => {
    switch (st) {
      case "ACCEPTED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Handshake className="w-6 h-6 text-sky-600" />
            Offers & Contract Bids
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track binding purchase offers submitted to farmers, monitor acceptance status, and manage active commitments.
          </p>
        </div>
        <Link href="/marketplace">
          <Button variant="outline" className="font-semibold">
            <Store className="w-4 h-4 mr-1.5" />
            Make New Offer on Marketplace
          </Button>
        </Link>
      </div>

      {/* Offers Table / Card List */}
      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Handshake className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 mt-2">No active offers yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Browse the produce marketplace and place bids directly to farmers.
            </p>
          </div>
        ) : (
          offers.map((offer) => {
            const listing =
              offer.listing || listings.find((l) => l.id === offer.listing_id);
            const totalValue =
              parseFloat(offer.quantity_kg) * parseFloat(offer.unit_price_per_kg);

            return (
              <Card key={offer.id} className="hover:border-slate-300 transition">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {listing ? `${listing.crop_name} (${listing.variety_name})` : "Produce Lot"}
                        </h3>
                        <Badge variant={getStatusVariant(offer.status)} size="sm">
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Offer ID: <span className="font-mono">{offer.id}</span> • Sent {timeAgo(offer.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {offer.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => withdrawOffer(offer.id)}
                          className="text-rose-700 hover:bg-rose-50 border-rose-200"
                        >
                          Withdraw Offer
                        </Button>
                      )}
                      {offer.status === "ACCEPTED" && offer.order_id && (
                        <Link href={`/orders/${offer.order_id}`}>
                          <Button size="sm" className="font-semibold bg-emerald-700 hover:bg-emerald-800">
                            View Order Contract
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Offered Volume</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatQuantity(offer.quantity_kg)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Offered Unit Price</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{offer.unit_price_per_kg} / kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gross Contract Value</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {formatCurrency(totalValue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Delivery Terms</span>
                      <span className="font-medium text-slate-800 text-[11px] capitalize">
                        {offer.delivery_terms.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Expiry note */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Farmer: <strong>{listing?.farmer_name || "Rahul Patil"}</strong></span>
                    <span>Valid until: <strong>{formatDate(offer.expires_at)}</strong></span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
