'use client';

import React, { useState } from 'react';
import {
  Calculator,
  Award,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { NFRComparisonCard } from '../../components/nfr/NFRComparisonCard';
import { DEMO_RECOMMENDATIONS } from '../../lib/fixtures/sihDemoData';
import { formatINR, calculateNFR, multiplyMoneyQuantity } from '../../lib/utils/money';

export default function NFRExplainabilityPage() {
  // Interactive Sandbox state for SIH Judges
  const [interactiveQuantity, setInteractiveQuantity] = useState('1000');
  const [buyerAPrice, setBuyerAPrice] = useState('32.00');
  const [buyerBPrice, setBuyerBPrice] = useState('31.00');
  const [buyerADistance, setBuyerADistance] = useState('160');
  const [buyerBDistance, setBuyerBDistance] = useState('35');
  const [buyerATransport, setBuyerATransport] = useState('5500.00');
  const [buyerBTransport, setBuyerBTransport] = useState('1500.00');
  const [buyerAStorage, setBuyerAStorage] = useState('500.00');
  const [buyerBStorage, setBuyerBStorage] = useState('300.00');
  const [buyerAHandling, setBuyerAHandling] = useState('300.00');
  const [buyerBHandling, setBuyerBHandling] = useState('300.00');
  const [buyerAOther, setBuyerAOther] = useState('200.00');
  const [buyerBOther, setBuyerBOther] = useState('150.00');

  // Compute live sandbox values
  const grossA = multiplyMoneyQuantity(buyerAPrice, interactiveQuantity);
  const grossB = multiplyMoneyQuantity(buyerBPrice, interactiveQuantity);

  const nfrA = calculateNFR(grossA, buyerATransport, buyerAStorage, buyerAHandling, buyerAOther);
  const nfrB = calculateNFR(grossB, buyerBTransport, buyerBStorage, buyerBHandling, buyerBOther);

  const diffPaise =
    parseFloat(nfrB.nfr) - parseFloat(nfrA.nfr);
  const isBWinner = diffPaise >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
              SIH 2026 Core Innovation Showcase
            </span>
            <Badge variant="demo" size="sm">
              DEMO DATA
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Net Farmer Realization (NFR) Decision Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            “Not Just the Best Price. The Best Decision.” — Proving real net return over headline price distortions.
          </p>
        </div>
      </div>

      {/* Canonical Evaluation Card */}
      <NFRComparisonCard
        recommendations={DEMO_RECOMMENDATIONS}
        cropName="Tomato (टमाटर)"
        quantityKg="1000.000"
      />

      {/* Deep-Dive Architectural Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-1"
          title="The NFR Mathematical Invariant"
          subtitle="Strictly constrained in database/migrations/008_orders_adjustments.sql"
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] space-y-1">
              <div>gross_value = quantity_kg * unit_price</div>
              <div>total_cost = transport + storage</div>
              <div className="pl-14">+ handling + other</div>
              <div className="text-white font-bold pt-1 border-t border-slate-700">
                NFR = gross_value - total_cost
              </div>
            </div>

            <p className="leading-relaxed">
              When farmers accept an offer on AgriNexis, the backend atomically computes and snapshots
              these 10 immutable columns on the <code>orders</code> table.
            </p>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Immutable Acceptance Guarantee
              </div>
              <p className="text-[11px]">
                Accepted order financials can <strong>never silently change</strong>. Any post-acceptance
                deviation is logged as an audited <code>order_financial_adjustments</code> record.
              </p>
            </div>
          </div>
        </Card>

        {/* Interactive Simulation Sandbox for Judges */}
        <Card
          className="lg:col-span-2"
          title="Interactive NFR Simulation Sandbox (Educational / Demo Only)"
          subtitle="Test arbitrary pricing and logistics cost scenarios in simulation"
        >
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs mb-4">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              DEMO_ONLY / Educational Simulation
            </div>
            <p className="mt-0.5 text-[11px] text-amber-800">
              This sandbox is an interactive educational tool to demonstrate NFR net-back deduction logic.
              Live logistics economics require backend quote evidence from Agent 9. This simulation never alters
              persisted recommendations, offers, or order snapshots in the database.
            </p>
          </div>
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="font-semibold text-slate-700">Produce Volume (kg)</label>
                <input
                  type="number"
                  value={interactiveQuantity}
                  onChange={(e) => setInteractiveQuantity(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Buyer A Price (₹/kg)</label>
                <input
                  type="text"
                  value={buyerAPrice}
                  onChange={(e) => setBuyerAPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Buyer B Price (₹/kg)</label>
                <input
                  type="text"
                  value={buyerBPrice}
                  onChange={(e) => setBuyerBPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Side-by-Side Simulation Output */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer A Sandbox */}
              <div
                className={`p-4 rounded-xl border ${
                  !isBWinner ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 mb-2">
                  Buyer A (Distant Wholesaler)
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Value:</span>
                    <span className="font-bold text-slate-900">{formatINR(grossA)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Transport ({buyerADistance} km):</span>
                    <input
                      type="text"
                      value={buyerATransport}
                      onChange={(e) => setBuyerATransport(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Storage:</span>
                    <input
                      type="text"
                      value={buyerAStorage}
                      onChange={(e) => setBuyerAStorage(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Handling:</span>
                    <input
                      type="text"
                      value={buyerAHandling}
                      onChange={(e) => setBuyerAHandling(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Other Costs:</span>
                    <input
                      type="text"
                      value={buyerAOther}
                      onChange={(e) => setBuyerAOther(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                    <span>Calculated NFR:</span>
                    <span className="text-slate-900 font-extrabold">{formatINR(nfrA.nfr)}</span>
                  </div>
                </div>
              </div>

              {/* Buyer B Sandbox */}
              <div
                className={`p-4 rounded-xl border ${
                  isBWinner ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 mb-2">
                  Buyer B (Local Processor)
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Value:</span>
                    <span className="font-bold text-slate-900">{formatINR(grossB)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Transport ({buyerBDistance} km):</span>
                    <input
                      type="text"
                      value={buyerBTransport}
                      onChange={(e) => setBuyerBTransport(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Storage:</span>
                    <input
                      type="text"
                      value={buyerBStorage}
                      onChange={(e) => setBuyerBStorage(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Handling:</span>
                    <input
                      type="text"
                      value={buyerBHandling}
                      onChange={(e) => setBuyerBHandling(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Other Costs:</span>
                    <input
                      type="text"
                      value={buyerBOther}
                      onChange={(e) => setBuyerBOther(e.target.value)}
                      className="w-24 text-right font-mono bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                    <span>Calculated NFR:</span>
                    <span className="text-slate-900 font-extrabold">{formatINR(nfrB.nfr)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox Live Outcome */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs">
                <span className="text-slate-400">Optimal Farmer Choice: </span>
                <strong className="text-emerald-400">
                  {isBWinner ? 'Buyer B (Local Processor)' : 'Buyer A (Distant Wholesaler)'}
                </strong>
              </div>
              <div className="text-xs font-mono font-bold text-amber-300 bg-slate-800 px-3 py-1 rounded border border-slate-700">
                Net Benefit: {formatINR(Math.abs(diffPaise))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
