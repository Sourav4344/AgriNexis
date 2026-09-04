"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDemo } from "@/lib/context/DemoContext";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { FinancialSnapshotCard } from "@/components/orders/FinancialSnapshotCard";
import { TransitionModal } from "@/components/orders/TransitionModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import {
  ArrowLeft,
  Truck,
  MapPin,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  Building,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { orders } = useDemo();
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  const orderId = params.id as string;
  const order = orders.find((o) => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Order not found</h2>
        <Link href="/orders">
          <Button variant="outline" size="sm" className="mt-4">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const isTerminal = ["COMPLETED", "CANCELLED"].includes(order.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/orders">
            <Button variant="outline" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Order #{order.id}
              </h1>
              <Badge variant="success">Version {order.version}</Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Accepted at {formatDateTime(order.accepted_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {!isTerminal && (
            <Button
              onClick={() => setIsTransitionModalOpen(true)}
              className="shadow-sm font-semibold"
            >
              Update Fulfillment State
            </Button>
          )}
          <Link href={`/grievances`}>
            <Button variant="outline" className="text-rose-700 border-rose-200 hover:bg-rose-50 font-medium">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Raise Dispute
            </Button>
          </Link>
        </div>
      </div>

      {/* Fulfillment Status Timeline Card */}
      <Card className="p-6 space-y-4 border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Fulfillment Lifecycle</h2>
            <p className="text-xs text-slate-500">
              Current state: <strong className="text-emerald-700">{order.status.replace(/_/g, " ")}</strong>
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-600">
            Carrier: {order.carrier_name}
          </span>
        </div>
        <OrderTimeline status={order.status} />
      </Card>

      {/* 2-Column Grid: Left Snapshot, Right Route & Parties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Immutable Financial Snapshot (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <FinancialSnapshotCard financials={order.financials} />
        </div>

        {/* Right Column: Parties & Logistics details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Party Details Card */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Contracting Parties</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-slate-400 block text-[11px] uppercase font-bold">Seller (Farmer)</span>
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>{order.farmer_name}</span>
                  <span className="text-emerald-700 text-xs font-medium">Verified Producer</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 pt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.farmer_phone}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-slate-400 block text-[11px] uppercase font-bold">Buyer (Procuring Party)</span>
                <div className="font-bold text-slate-900 text-sm">
                  {order.buyer_name}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Institutional Account • GSTIN Verified
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics & Route Card */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Logistics & Route</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Origin (Farm Gate)</span>
                    <span className="font-semibold text-slate-800">{order.origin_location}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Building className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Destination (Receiving Hub)</span>
                    <span className="font-semibold text-slate-800">{order.destination_location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Delivery Terms:</span>
                  <span className="font-semibold capitalize">{order.delivery_terms.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waybill / Tracking:</span>
                  <span className="font-mono font-bold text-slate-900">{order.tracking_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        order={order}
      />
    </div>
  );
}
