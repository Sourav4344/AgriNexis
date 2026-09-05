"use client";

import React from "react";
import Link from "next/link";
import { useDemo } from "@/lib/context/DemoContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate, timeAgo } from "@/lib/utils/date";
import {
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  Truck,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function OrdersPage() {
  const { orders } = useDemo();

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "COMPLETED":
      case "DELIVERED":
        return <Badge variant="success">{st.replace(/_/g, " ")}</Badge>;
      case "IN_TRANSIT":
      case "PICKUP_SCHEDULED":
        return <Badge variant="warning">{st.replace(/_/g, " ")}</Badge>;
      case "DISPUTED":
      case "CANCELLED":
        return <Badge variant="danger">{st.replace(/_/g, " ")}</Badge>;
      default:
        return <Badge variant="info">{st.replace(/_/g, " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            Orders & Contract Fulfillment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track binding trade contracts, verify immutable financial snapshots, manage logistics transit, and confirm receipts.
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:border-slate-300 transition">
            <CardContent className="p-5 space-y-4">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {order.crop_name} ({order.variety_name})
                    </h3>
                    {getStatusBadge(order.status)}
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      Payment: {order.payment_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Order ID: {order.id} • Accepted {timeAgo(order.accepted_at)}
                  </p>
                </div>

                <Link href={`/orders/${order.id}`}>
                  <Button size="sm" className="font-semibold">
                    View Snapshot & Manage
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Order Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Contracted Quantity</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatQuantity(order.financials.snapshot_quantity_kg)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Agreed Unit Price</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ₹{order.financials.snapshot_unit_price_per_kg} / kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Gross Contract Value</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {formatCurrency(order.financials.snapshot_gross_selling_value)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Net Farmer Realization (NFR)</span>
                  <span className="font-bold text-emerald-700 text-sm font-mono">
                    {formatCurrency(order.financials.snapshot_net_farmer_realization)}
                  </span>
                </div>
              </div>

              {/* Route and carrier */}
              <div className="p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2 border border-slate-100">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    Carrier: <strong>{order.carrier_name || "AgriSpeed Logistics"}</strong> • Tracking: <strong className="font-mono">{order.tracking_number}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Farmer: <strong>{order.farmer_name}</strong> ({order.farmer_phone})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
