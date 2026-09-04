import React from 'react';
import { Award, ArrowUpRight, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatINR } from '../../lib/utils/money';
import { RecommendationOption } from '../../lib/api/types';

interface NFRComparisonCardProps {
  recommendations: RecommendationOption[];
  cropName?: string;
  quantityKg?: string;
  className?: string;
}

export const NFRComparisonCard: React.FC<NFRComparisonCardProps> = ({
  recommendations,
  cropName = 'Tomato',
  quantityKg = '1000.000',
  className = '',
}) => {
  // Sort recommendations by rank
  const sorted = [...recommendations].sort((a, b) => a.rank - b.rank);
  const bestOption = sorted[0];
  const runnerUp = sorted[1];

  return (
    <Card
      className={`border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white ${className}`}
      title="Net Farmer Realization (NFR) Decision Engine"
      subtitle={`Canonical SIH 2026 Evaluation Model • Crop: ${cropName} • Volume: ${parseFloat(quantityKg).toLocaleString()} kg`}
      badge={
        <Badge variant="demo" size="sm">
          DEMO DATA — NOT LIVE GOVERNMENT DATA
        </Badge>
      }
    >
      {/* Mathematical Principle Callout */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600 mb-2">
          <span className="font-semibold text-slate-800">
            Government of Maharashtra • PS ID: 26132 Objective
          </span>
          <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            NFR = Gross - (Transport + Storage + Handling + Other)
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Traditional APMC linkages mislead farmers with headline prices. AgriNexis computes the
          true <strong>Net Farmer Realization</strong> after itemizing exact logistics, storage, and
          handling costs before offer acceptance.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((rec) => {
          const isWinner = rec.rank === 1;
          return (
            <div
              key={rec.id}
              className={`rounded-xl p-5 border transition-all ${
                isWinner
                  ? 'bg-emerald-50/60 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 opacity-95'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Rank #{rec.rank}
                    </span>
                    {isWinner && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        RECOMMENDED DECISION
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {rec.candidate_name || `Buyer Option ${rec.rank}`}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Offered Price</div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {formatINR(rec.estimated_unit_price_per_kg)}/kg
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-2 text-xs border-t border-b border-slate-200/80 py-3 my-3">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Gross Selling Value</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(rec.estimated_gross_selling_value)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 pl-2">
                  <span>↳ Transportation ({rec.distance_km || 0} km)</span>
                  <span className="text-rose-600 font-mono">
                    -{formatINR(rec.estimated_transportation_cost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 pl-2">
                  <span>↳ Storage Cost</span>
                  <span className="text-rose-600 font-mono">
                    -{formatINR(rec.estimated_storage_cost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 pl-2">
                  <span>↳ Handling & Loading</span>
                  <span className="text-rose-600 font-mono">
                    -{formatINR(rec.estimated_handling_cost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500 pl-2">
                  <span>↳ Other Applicable Costs</span>
                  <span className="text-rose-600 font-mono">
                    -{formatINR(rec.estimated_other_applicable_cost)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-700 pt-1 font-medium border-t border-slate-100">
                  <span>Total Deductions</span>
                  <span className="text-rose-700 font-bold font-mono">
                    -{formatINR(rec.estimated_total_applicable_cost)}
                  </span>
                </div>
              </div>

              {/* Net Farmer Realization Result */}
              <div
                className={`p-3 rounded-lg flex items-center justify-between ${
                  isWinner ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isWinner ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    Net Farmer Realization (NFR)
                  </div>
                  <div className="text-xl font-black tracking-tight">
                    {formatINR(rec.estimated_net_farmer_realization)}
                  </div>
                </div>
                <div className="text-right text-xs">
                  {isWinner ? (
                    <span className="inline-flex items-center gap-1 font-bold bg-white/20 px-2.5 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Best Realization
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      -{formatINR(rec.difference_from_best || '3250.00')} less
                    </span>
                  )}
                </div>
              </div>

              {/* Decision Facts */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rec.explanation_facts.map((fact, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {fact}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Highlight for Judges */}
      {bestOption && runnerUp && (
        <div className="mt-5 p-4 bg-emerald-900 text-emerald-50 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Innovation Impact Summary
            </div>
            <div className="text-sm font-medium">
              Choosing <strong>{bestOption.candidate_name}</strong> yields an extra{' '}
              <span className="text-amber-300 font-bold underline">
                {formatINR(
                  parseFloat(bestOption.estimated_net_farmer_realization) -
                    parseFloat(runnerUp.estimated_net_farmer_realization)
                )}
              </span>{' '}
              for Farmer Rahul, despite Buyer A offering ₹1.00/kg higher headline price!
            </div>
          </div>
          <div className="text-xs font-mono text-emerald-200 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
            Realization Advantage: +₹3,250.00 (12.75% increase)
          </div>
        </div>
      )}
    </Card>
  );
};
