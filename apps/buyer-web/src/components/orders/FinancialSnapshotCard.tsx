import React from "react";
import { OrderFinancialSnapshot } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { formatCurrency, formatQuantity } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { Lock, ShieldCheck, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

interface FinancialSnapshotCardProps {
  financials?: OrderFinancialSnapshot | null;
}

export function FinancialSnapshotCard({ financials }: FinancialSnapshotCardProps) {
  if (!financials || !financials.snapshot_net_farmer_realization) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-amber-900 text-white p-4 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-300" />
            <CardTitle className="text-white text-sm">
              Contract Financial Economics
            </CardTitle>
          </div>
          <span className="text-[11px] font-mono bg-amber-950 text-amber-200 border border-amber-800 px-2 py-0.5 rounded-full">
            NFR_ECONOMICS_NOT_AVAILABLE
          </span>
        </CardHeader>
        <CardContent className="p-5 space-y-2 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p>
              <strong>NFR Economics:</strong> Not available for this record.
              Gross offer value and terms are recorded, and itemized transportation deductions and net farmer realization will be populated once finalized.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-slate-300 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <CardTitle className="text-white text-sm">
            Immutable Contract Financial Snapshot
          </CardTitle>
        </div>
        <span className="text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          NFR Locked
        </span>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Core terms */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Accepted Quantity</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatQuantity(financials.snapshot_quantity_kg)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Accepted Unit Price</span>
            <span className="font-bold text-emerald-800 font-mono">
              {formatCurrency(financials.snapshot_unit_price_per_kg, true, financials.snapshot_currency)} / kg
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Contract Currency</span>
            <span className="font-bold text-slate-900 font-mono">
              {financials.snapshot_currency}
            </span>
          </div>
        </div>

        {/* Detailed Itemized Snapshot Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Financial Component</th>
                <th className="py-2.5 px-4 text-right">Amount ({financials.snapshot_currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white font-medium">
                <td className="py-2.5 px-4 text-slate-900">Gross Selling Value</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                  {formatCurrency(financials.snapshot_gross_selling_value, false, financials.snapshot_currency)}
                </td>
              </tr>
              <tr className="bg-slate-50/50 text-slate-600">
                <td className="py-2 px-4 pl-6">↳ Transportation Cost</td>
                <td className="py-2 px-4 text-right font-mono text-slate-600">
                  - {formatCurrency(financials.snapshot_transportation_cost, false, financials.snapshot_currency)}
                </td>
              </tr>
              <tr className="bg-slate-50/50 text-slate-600">
                <td className="py-2 px-4 pl-6">↳ Storage & Packhouse Cost</td>
                <td className="py-2 px-4 text-right font-mono text-slate-600">
                  - {formatCurrency(financials.snapshot_storage_cost, false, financials.snapshot_currency)}
                </td>
              </tr>
              <tr className="bg-slate-50/50 text-slate-600">
                <td className="py-2 px-4 pl-6">↳ Loading & Handling Cost</td>
                <td className="py-2 px-4 text-right font-mono text-slate-600">
                  - {formatCurrency(financials.snapshot_handling_cost, false, financials.snapshot_currency)}
                </td>
              </tr>
              <tr className="bg-slate-50/50 text-slate-600">
                <td className="py-2 px-4 pl-6">↳ Other Applicable Costs</td>
                <td className="py-2 px-4 text-right font-mono text-slate-600">
                  - {formatCurrency(financials.snapshot_other_applicable_cost, false, financials.snapshot_currency)}
                </td>
              </tr>
              <tr className="bg-rose-50/50 font-semibold text-rose-900">
                <td className="py-2.5 px-4">Total Deductions</td>
                <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                  - {formatCurrency(financials.snapshot_total_applicable_cost, false, financials.snapshot_currency)}
                </td>
              </tr>
              <tr className="bg-emerald-50 font-bold text-emerald-950 border-t-2 border-emerald-300">
                <td className="py-3 px-4 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Net Farmer Realization (NFR)</span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-base text-emerald-700">
                  {formatCurrency(financials.snapshot_net_farmer_realization, false, financials.snapshot_currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Audit & provenance metadata */}
        <div className="text-[11px] text-slate-500 flex flex-wrap justify-between items-center pt-2 border-t border-slate-100">
          <span>
            Snapshot Engine: <strong className="text-slate-700 font-mono">{financials.snapshot_calculation_version}</strong>
          </span>
          <span>
            Calculated: {formatDateTime(financials.snapshot_calculated_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
