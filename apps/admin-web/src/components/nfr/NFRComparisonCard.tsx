import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { formatINR, subtractMoney } from '../../lib/utils/money';
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
      title="Not Just the Best Price. The Best Decision."
      subtitle={`Net Farmer Realization • ${cropName} • ${parseFloat(quantityKg).toLocaleString('en-IN')} kg`}
    >
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 space-y-2">
        <p className="font-semibold text-slate-900">Higher price ≠ higher farmer earnings.</p>
        <p className="text-sm text-slate-600">Gross Selling Value − Transportation − Storage − Handling − Other Applicable Cost = Net Farmer Realization (NFR)</p>
        <p className="text-sm text-slate-600">Compare estimated earnings after all applicable costs. The farmer owns the acceptance decision.</p>
      </div>
      {sorted.length === 0 && <p role="status" className="p-6 text-slate-600">No selling options available. Select a listing and request recommendations.</p>}

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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Rank #{rec.rank}
                    </span>
                    {isWinner && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        #1 Recommended
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
              <div className="space-y-2 text-sm border-t border-b border-slate-200/80 py-3 my-3">
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
                className={`p-3 rounded-lg flex flex-wrap gap-3 items-center justify-between ${
                  isWinner ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-800'
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
                  <div className="text-3xl font-bold tracking-tight">
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
                      {formatINR(subtractMoney(bestOption.estimated_net_farmer_realization, rec.estimated_net_farmer_realization))} below rank #1
                    </span>
                  )}
                </div>
              </div>

              {/* Decision Facts */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <ProvenanceBadge mode={rec.data_mode} />
                {rec.explanation_facts.map((fact, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {({ LOWER_TOTAL_COST: 'Lower total cost', HIGHER_NET_REALIZATION: 'Higher net earnings', CLOSER_BUYER: 'Closer buyer' } as Record<string, string>)[fact] || fact.replaceAll('_', ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {bestOption && runnerUp && (
        <div className="mt-5 p-5 bg-emerald-900 text-white rounded-xl space-y-2">
          <p className="text-sm">{bestOption.candidate_name || 'Rank #1'} compared with {runnerUp.candidate_name || 'Rank #2'}</p>
          <p className="text-2xl font-bold">Realization Advantage: {subtractMoney(bestOption.estimated_net_farmer_realization, runnerUp.estimated_net_farmer_realization).startsWith('-') ? '' : '+'}{formatINR(subtractMoney(bestOption.estimated_net_farmer_realization, runnerUp.estimated_net_farmer_realization))}</p>
          <p className="text-sm text-emerald-100">Difference in estimated net earnings after costs. Review the current amounts before acceptance.</p>
        </div>
      )}
    </Card>
  );
};
