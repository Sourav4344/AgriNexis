"use client";

import React, { useState } from "react";
import { useDemo } from "@/lib/context/DemoContext";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import {
  AlertCircle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

export default function GrievancesPage() {
  const { grievances, createGrievance, orders } = useDemo();
  const { user, role } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || "");
  const [category, setCategory] = useState<any>("QUALITY_MISMATCH");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await createGrievance({
        order_id: selectedOrderId,
        complainant_role: role === "FPO" ? "FPO" : "BUYER",
        complainant_name: user.organization_name || user.display_name,
        category,
        description,
      });
      setIsSubmitting(false);
      setIsCreating(false);
      setDescription("");
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            Dispute Resolution & Grievances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auditable dispute mediation for quality variance, weighbridge transit loss, or fulfillment delays.
          </p>
        </div>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Raise New Grievance
          </Button>
        )}
      </div>

      {/* New Grievance Form */}
      {isCreating && (
        <Card className="border-rose-200 bg-rose-50/20 animate-in fade-in duration-150">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base text-slate-900">
              Submit Dispute Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Related Contract / Order *
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} - {o.crop_name} ({o.farmer_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispute Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="QUALITY_MISMATCH">Quality Mismatch / Grading Dispute</option>
                    <option value="WEIGHT_DISCREPANCY">Weight Discrepancy / Transit Loss</option>
                    <option value="DELIVERY_DELAY">Logistics / Delivery Delay</option>
                    <option value="PAYMENT_ISSUE">Payment Escrow / Bank Settlement</option>
                    <option value="OTHER">Other Contract Dispute</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Description & Proof Details *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the discrepancy clearly, citing weighbridge slip numbers, visual inspection notes, or batch IDs."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700"
                  isLoading={isSubmitting}
                >
                  Submit for Mediation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grievances List */}
      <div className="space-y-4">
        {grievances.map((g) => (
          <Card key={g.id} className="hover:border-slate-300 transition">
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {g.category.replace(/_/g, " ")}
                    </h3>
                    <Badge
                      variant={g.status === "RESOLVED" ? "success" : "warning"}
                      size="sm"
                    >
                      {g.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Ticket Ref: <span className="font-mono">{g.id}</span> • Associated Order: <span className="font-mono">{g.order_id}</span>
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  Logged: {formatDateTime(g.created_at)}
                </span>
              </div>

              <div className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                {g.description}
              </div>

              {g.resolution && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mediation Resolution</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {g.resolution}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
