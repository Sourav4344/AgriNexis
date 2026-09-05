'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Package,
  TrendingUp,
  Handshake,
  Calculator,
  CheckCircle2,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Info,
  MapPin,
  Check,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { NFRComparisonCard } from '../../components/nfr/NFRComparisonCard';
import {
  DEMO_PROFILES,
  DEMO_LISTINGS,
  DEMO_RECOMMENDATIONS,
  DEMO_MANDI_PRICES,
  DEMO_PREDICTION,
  DEMO_OFFERS,
  DEMO_ORDERS,
  DEMO_PAYMENTS,
} from '../../lib/fixtures/sihDemoData';

const STEPS = [
  {
    number: 1,
    id: 'listing',
    title: 'Farmer Produce Listing',
    subtitle: 'Rahul Patil lists 1,000 kg Tomato',
    icon: Package,
  },
  {
    number: 2,
    id: 'market-intel',
    title: 'Market Intelligence',
    subtitle: 'Reference APMC Mandi rates (Explicit DEMO mode)',
    icon: TrendingUp,
  },
  {
    number: 3,
    id: 'forecast',
    title: 'Price Advisory Outlook',
    subtitle: '1-day & 3-day horizons with INSUFFICIENT_DATA status',
    icon: Sparkles,
  },
  {
    number: 4,
    id: 'buyer-offers',
    title: 'Buyer Bids Received',
    subtitle: 'Buyer A (₹32/kg) vs Buyer B (₹31/kg)',
    icon: Handshake,
  },
  {
    number: 5,
    id: 'nfr-hero',
    title: 'NFR Intelligence (HERO)',
    subtitle: 'Net Farmer Realization: Buyer B wins with +₹3,250',
    icon: Calculator,
  },
  {
    number: 6,
    id: 'accept-offer',
    title: 'Offer Acceptance Flow',
    subtitle: 'Presentation: Farmer selects optimal net return',
    icon: CheckCircle2,
  },
  {
    number: 7,
    id: 'order-snapshot',
    title: 'Order Created (CONFIRMED)',
    subtitle: 'Status CONFIRMED with immutable financial snapshot',
    icon: ShoppingCart,
  },
  {
    number: 8,
    id: 'payment-tracking',
    title: 'Payment Status (PENDING)',
    subtitle: 'Status PENDING • Authoritative direct settlement tracking',
    icon: CreditCard,
  },
];

export default function JudgeDemoHubPage() {
  const [currentStep, setCurrentStep] = useState<number>(5); // Default to NFR Hero for immediate judge impact
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const farmer = DEMO_PROFILES.find((p) => p.role === 'FARMER') || DEMO_PROFILES[0];
  const listing = DEMO_LISTINGS[0];
  const order = DEMO_ORDERS[0];
  const payment = DEMO_PAYMENTS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top SIH Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 shadow-xl border border-emerald-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Smart India Hackathon 2026 • PS 26132
              </span>
              <span className="text-xs font-semibold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/30">
                Government of Maharashtra
              </span>
              <Badge variant="demo" size="sm">
                DEMO DATA — NOT LIVE GOVERNMENT DATA
              </Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>AgriNexis</span>
              <span className="text-emerald-400 font-normal text-xl hidden sm:inline">|</span>
              <span className="text-lg sm:text-xl font-medium text-emerald-200">
                Judge Demonstration Hub
              </span>
            </h1>
            <p className="text-emerald-300 font-semibold text-sm mt-1">
              “Not Just the Best Price. The Best Decision.”
            </p>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
              Target Authority: Maharashtra State Innovation Society, Department of Skills, Employment,
              Entrepreneurship and Innovation. Proving how Net Farmer Realization (NFR) prevents farmers from being
              misled by headline prices with high hidden logistics deductions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetModal(true)}
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1.5 text-amber-400" />
              Reset Demo from Terminal
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Presentation Flow (8 Steps)
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Step Navigator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Demonstration Journey (Presentation Navigation)
            </span>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <Button
              size="sm"
              disabled={currentStep === STEPS.length}
              onClick={() => setCurrentStep((prev) => Math.min(STEPS.length, prev + 1))}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {STEPS.map((s) => {
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.number)}
                className={`p-2.5 rounded-lg text-left transition flex flex-col justify-between border ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : s.number}
                  </span>
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-xs font-bold leading-tight line-clamp-1 ${
                    isActive ? 'text-emerald-950' : 'text-slate-800'
                  }`}
                >
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Presentation Surface */}
      <div className="transition-all">
        {/* STEP 1: FARMER LISTING */}
        {currentStep === 1 && (
          <Card
            title="Step 1: Farmer Produce Listing"
            subtitle="Rahul Patil lists 1,000 kg Tomato"
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{farmer.display_name}</span>
                    <Badge variant="success" size="sm">ACTIVE</Badge>
                    <Badge variant="demo" size="sm">DEMO IDENTITY</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Pune District, Maharashtra • Tomato Grower
                  </p>
                </div>
                <Link href="/listings">
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    Inspect in Listings Catalog
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans block text-xs">Crop & Variety</span>
                  <span className="text-base font-bold text-slate-900 font-sans">
                    {listing.crop_name} ({listing.variety_name})
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    Declared Lot: 1,000 kg
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans block text-xs">Available Quantity</span>
                  <span className="text-base font-bold text-emerald-700">
                    {parseFloat(listing.quantity).toLocaleString('en-IN')} {listing.unit}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    10.00 Quintals farmgate lot
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans block text-xs">Availability Window</span>
                  <span className="text-base font-bold text-slate-900">
                    {listing.available_from} to {listing.available_until}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1 font-sans">
                    Ready for procurement
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  Judge Talking Point (Step 1):
                </div>
                <p className="text-slate-600">
                  The farmer lists produce directly with quantity and location.
                  The listing is immediately available for matching against verified buyer demands.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: MARKET INTELLIGENCE */}
        {currentStep === 2 && (
          <Card
            title="Step 2: Market Intelligence"
            subtitle="APMC Mandi reference rates with machine-readable DEMO provenance"
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                <span>
                  <strong>Data Provenance Invariant:</strong> All demo market prices carry explicit DEMO labels.
                  AgriNexis does not pretend demo data is live government data.
                  In demo mode, records carry <code className="font-bold font-mono">data_mode: DEMO</code>.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_MANDI_PRICES.map((mp) => (
                  <div key={mp.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{mp.mandi_name}</h4>
                        <p className="text-xs text-slate-500">{mp.crop_name} • {mp.variety_name}</p>
                      </div>
                      <Badge variant="demo" size="sm">DEMO DATA</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">Min</span>
                        <span className="font-semibold text-slate-700">₹{mp.min_price}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">Modal</span>
                        <span className="font-bold text-emerald-800 text-sm">₹{mp.modal_price}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-sans block">Max</span>
                        <span className="font-semibold text-slate-700">₹{mp.max_price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  Judge Talking Point (Step 2):
                </div>
                <p className="text-slate-600">
                  Current local APMC modal rate is ~₹30.00–₹31.00/kg. Rahul sees baseline market quotes,
                  providing transparent price reference.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: PRICE PREDICTION OUTLOOK */}
        {currentStep === 3 && (
          <Card
            title="Step 3: Advisory Price Forecast (Contract Strictness)"
            subtitle="Allowed horizons: 1-day and 3-day only • Honest INSUFFICIENT_DATA status"
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Strict Engine Contract: No Hallucinated Forecasts
                </div>
                <p className="text-xs leading-relaxed">
                  Per the AgriNexis Prediction Engine contract, horizons are restricted strictly to 1-day and 3-day.
                  If the dataset has insufficient observations, the engine returns
                  <code className="font-bold font-mono ml-1 mr-1">INSUFFICIENT_DATA</code> with null confidence rather than
                  hallucinating speculative future prices.
                </p>
              </div>

              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-sans font-medium text-slate-600">Prediction Engine Status:</span>
                  <Badge variant="warning">{DEMO_PREDICTION.trend}</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-sans font-medium text-slate-600">Forecast Horizon:</span>
                  <span className="font-bold text-slate-900">{DEMO_PREDICTION.horizon_days} Days (Advisory Only)</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-sans font-medium text-slate-600">Confidence Score:</span>
                  <span className="font-bold text-slate-500">None (Uncalibrated / Null)</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="font-sans font-medium text-slate-600 block">Engine Warnings:</span>
                  {DEMO_PREDICTION.warnings.map((w, i) => (
                    <div key={i} className="text-amber-800 text-[11px] bg-amber-50 p-1.5 rounded flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  Judge Talking Point (Step 3):
                </div>
                <p className="text-slate-600">
                  AgriNexis does not issue a Sell/Wait recommendation because complete future
                  holding economics are not available. It still identifies the best CURRENT
                  opportunity: Buyer B.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4: BUYER OFFERS */}
        {currentStep === 4 && (
          <Card
            title="Step 4: Two Competing Buyer Offers"
            subtitle="Buyer A quotes ₹32/kg • Buyer B quotes ₹31/kg"
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_OFFERS.map((offer) => {
                  const isA = offer.unit_price === '32.00';
                  return (
                    <div
                      key={offer.id}
                      className={`p-5 rounded-xl border ${
                        isA ? 'bg-slate-50 border-slate-300' : 'bg-emerald-50/50 border-emerald-300'
                      } space-y-3`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {isA ? 'Buyer A (Metro Wholesaler)' : 'Buyer B (Local Processor)'}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5">
                            {isA ? 'DEMO Buyer A Agro Foods Ltd' : 'DEMO Buyer B Agri Processors'}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Headline Price</span>
                          <span className="text-xl font-extrabold text-slate-900 font-mono">
                            ₹{offer.unit_price}/kg
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Offered Quantity:</span>
                          <span className="font-bold text-slate-900">1,000 kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Gross Headline Value:</span>
                          <span className="font-bold text-slate-900">
                            ₹{(parseFloat(offer.unit_price) * 1000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600">
                        {isA ? (
                          <p className="text-rose-700 font-medium">
                            ⚠️ Appears to be the higher price (+₹1/kg), but has higher configured logistics deductions (₹6,500).
                          </p>
                        ) : (
                          <p className="text-emerald-700 font-medium">
                            ✓ Appears ₹1/kg lower headline price, but has a lower configured logistics cost (₹2,250).
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  Judge Talking Point (Step 4 — The Headline Trap):
                </div>
                <p className="text-slate-600">
                  On standard platforms, a farmer would immediately pick Buyer A because ₹32 &gt; ₹31.
                  That common mistake costs farmers money. AgriNexis reveals the net return.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 5: HERO MOMENT — NFR COMPARISON */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <NFRComparisonCard
              recommendations={DEMO_RECOMMENDATIONS}
              cropName="Tomato"
              quantityKg="1000.000"
            />

            <div className="p-4 bg-emerald-950 text-white rounded-xl text-xs space-y-2 border border-emerald-700">
              <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-300" />
                The Core AgriNexis Thesis Explained:
              </div>
              <p className="text-slate-200 leading-relaxed font-mono">
                <strong>Buyer A:</strong> ₹32,000 gross − ₹5,500 transport − ₹500 storage − ₹300 handling − ₹200 other = <strong>₹25,500 NFR</strong><br />
                <strong>Buyer B:</strong> ₹31,000 gross − ₹1,500 transport − ₹300 storage − ₹300 handling − ₹150 other = <strong>₹28,750 NFR</strong>
              </p>
              <p className="text-emerald-300 font-bold text-sm pt-1 border-t border-emerald-800">
                Buyer B has a lower configured logistics cost, so its lower headline price produces a higher Net Farmer Realization (+₹3,250 net gain).
              </p>
            </div>
          </div>
        )}

        {/* STEP 6: FARMER ACCEPTS BUYER B */}
        {currentStep === 6 && (
          <Card
            title="Step 6: Offer Acceptance Flow (Presentation Navigation)"
            subtitle="The farmer owns the acceptance decision • Mutation via internal.accept_offer API"
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-2">
                <div className="font-bold text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  Offer Selected for Acceptance: Buyer B (₹31.00/kg)
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  When the farmer accepts Buyer B, the backend executes an atomic PostgreSQL transaction
                  (<code className="font-mono font-bold">internal.accept_offer</code>).
                  The order is created with status <code className="font-mono font-bold">CONFIRMED</code>,
                  and 10 immutable financial snapshot columns are sealed on the contract.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 font-mono text-xs space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500 font-sans">Accepted Offer ID:</span>
                  <span className="font-bold text-slate-800">41500000-0000-4000-8000-000000000002</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500 font-sans">Accepted Unit Price:</span>
                  <span className="font-bold text-emerald-700">₹31.00 / kg</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500 font-sans">Accepted Quantity:</span>
                  <span className="font-bold text-slate-800">1,000.000 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Locked Net Realization:</span>
                  <span className="font-bold text-emerald-800 text-sm">₹28,750.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 italic">
                  Note: This step presents the acceptance parameters. Real contract mutation runs through authenticated API.
                </span>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(7)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Preview Created Order Contract (Step 7)
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  Judge Talking Point (Step 6):
                </div>
                <p className="text-slate-600">
                  The farmer maintains complete autonomy and makes the decision based on full economic transparency.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 7: ORDER CONFIRMED & SNAPSHOT */}
        {currentStep === 7 && (
          <Card
            title="Step 7: Order Contract Created (CONFIRMED)"
            subtitle="Authoritative order status: CONFIRMED • 10 immutable financial columns snapshot"
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm">Order ID: {order.id.slice(0, 18)}...</span>
                  </div>
                  <Badge variant="success">CONFIRMED</Badge>
                </div>
                <p className="text-xs text-slate-300">
                  PostgreSQL database snapshot locked. Canonical demo order state is CONFIRMED.
                </p>
              </div>

              {/* 10 Columns Snapshot Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-100 text-slate-700 font-sans font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Database Snapshot Column</th>
                      <th className="py-2.5 px-4 text-right">Immutable Stored Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-2 px-4 font-sans text-slate-700">snapshot_quantity_kg</td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">{order.snapshot_quantity_kg} kg</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-sans text-slate-700">snapshot_unit_price_per_kg</td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">₹{order.snapshot_unit_price_per_kg}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-sans text-slate-700">snapshot_gross_selling_value</td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">₹{order.snapshot_gross_selling_value}</td>
                    </tr>
                    <tr className="text-rose-700 bg-rose-50/40">
                      <td className="py-2 px-4 font-sans">snapshot_transportation_cost</td>
                      <td className="py-2 px-4 text-right">-₹{order.snapshot_transportation_cost}</td>
                    </tr>
                    <tr className="text-rose-700 bg-rose-50/40">
                      <td className="py-2 px-4 font-sans">snapshot_storage_cost</td>
                      <td className="py-2 px-4 text-right">-₹{order.snapshot_storage_cost}</td>
                    </tr>
                    <tr className="text-rose-700 bg-rose-50/40">
                      <td className="py-2 px-4 font-sans">snapshot_handling_cost</td>
                      <td className="py-2 px-4 text-right">-₹{order.snapshot_handling_cost}</td>
                    </tr>
                    <tr className="text-rose-700 bg-rose-50/40">
                      <td className="py-2 px-4 font-sans">snapshot_other_applicable_cost</td>
                      <td className="py-2 px-4 text-right">-₹{order.snapshot_other_applicable_cost}</td>
                    </tr>
                    <tr className="text-rose-800 font-bold bg-rose-50">
                      <td className="py-2 px-4 font-sans">snapshot_total_applicable_cost</td>
                      <td className="py-2 px-4 text-right">-₹{order.snapshot_total_applicable_cost}</td>
                    </tr>
                    <tr className="bg-emerald-100/70 font-bold text-emerald-950 text-sm">
                      <td className="py-2.5 px-4 font-sans">snapshot_net_farmer_realization</td>
                      <td className="py-2.5 px-4 text-right text-base">₹{order.snapshot_net_farmer_realization}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 italic">
                  Immutable financial snapshot prevents post-agreement disputes or cost adjustments.
                </span>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(8)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Preview Payment Status (Step 8)
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  Judge Talking Point (Step 7):
                </div>
                <p className="text-slate-600">
                  This mathematical snapshot is auditable and stored in PostgreSQL.
                  Neither party can unilaterally change the net realization after acceptance.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 8: DIRECT SETTLEMENT PAYMENT */}
        {currentStep === 8 && (
          <Card
            title="Step 8: Payment Status (PENDING)"
            subtitle="Payment status tracking is implemented. LIVE fund movement requires a configured external payment provider."
          >
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-700" />
                    <span className="font-bold text-base text-slate-900">
                      Payment Record: {payment.id.slice(0, 18)}...
                    </span>
                  </div>
                  <Badge variant="warning">PENDING</Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Payment status tracking is implemented. LIVE fund movement requires a configured external payment provider.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-sans block text-xs">Settlement Amount</span>
                  <span className="text-lg font-black text-emerald-800">₹{payment.amount}</span>
                  <span className="block text-[11px] text-slate-400 font-sans mt-0.5">Authoritative NFR</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-sans block text-xs">Payment Method</span>
                  <span className="text-sm font-bold text-slate-800 font-sans">{payment.method}</span>
                  <span className="block text-[11px] text-slate-400 font-sans mt-0.5">Direct Settlement</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-sans block text-xs">Payment Provider</span>
                  <span className="text-xs font-bold text-slate-800">{payment.provider_name}</span>
                  <span className="block text-[11px] text-slate-400 font-sans mt-0.5">Ref: {payment.provider_reference}</span>
                </div>
              </div>

              {/* Presentation Preview: Order Timeline */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Preview Order Timeline (Presentation Preview)
                </span>
                <p className="text-xs text-slate-500">
                  Canonical SIH demo stops at: Order = <strong>CONFIRMED</strong>, Payment = <strong>PENDING</strong>.
                  Subsequent PostgreSQL order lifecycle states:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    1. CONFIRMED (Current Demo State)
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    2. PICKUP_SCHEDULED
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    3. IN_TRANSIT
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    4. DELIVERED
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    5. COMPLETED
                  </span>
                </div>
              </div>

              {/* FINAL OUTCOME SUMMARY SCREEN */}
              <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white shadow-xl border-2 border-emerald-500 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Final SIH 2026 Demonstration Outcome
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-white">
                      Economic Decision Verification
                    </h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-1 rounded-full border border-emerald-400/40">
                    CANONICAL VERIFICATION PASSED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block font-sans text-xs">Farmer</span>
                    <span className="text-sm font-bold text-white font-sans">Rahul Patil</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-xs">Produce Lot</span>
                    <span className="text-sm font-bold text-white font-sans">Tomato — 1,000 kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-xs">Selected Buyer</span>
                    <span className="text-sm font-bold text-emerald-300 font-sans">Buyer B</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-xs">Headline Offer</span>
                    <span className="text-sm font-bold text-white">₹31.00 / kg</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-center">
                  <div className="p-2 bg-slate-800/60 rounded">
                    <span className="text-slate-400 font-sans block text-[11px]">Buyer A Realization</span>
                    <span className="text-base font-bold text-slate-300">₹25,500.00</span>
                    <span className="text-[10px] text-rose-400 font-sans block mt-0.5">Higher headline (₹32), lower net</span>
                  </div>
                  <div className="p-2 bg-emerald-900/60 rounded border border-emerald-500/30">
                    <span className="text-emerald-300 font-sans block text-[11px]">Buyer B Realization</span>
                    <span className="text-lg font-black text-emerald-300">₹28,750.00</span>
                    <span className="text-[10px] text-emerald-300 font-sans block mt-0.5">Lower headline (₹31), higher net</span>
                  </div>
                  <div className="p-2 bg-emerald-800/80 rounded border border-emerald-400/50 flex flex-col justify-center">
                    <span className="text-emerald-200 font-sans text-xs">Farmer Net Gain</span>
                    <span className="text-2xl font-black text-white">+₹3,250.00</span>
                  </div>
                </div>

                <div className="text-center pt-2 space-y-1">
                  <p className="text-sm text-slate-200 font-medium italic">
                    “AgriNexis helped the farmer choose the best economic decision, not simply the highest advertised price.”
                  </p>
                  <p className="text-base font-extrabold text-emerald-300 tracking-tight">
                    Not Just the Best Price. The Best Decision.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Terminal Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-slate-900 border-b pb-3">
              <RotateCcw className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-lg font-bold">Reset Demo from Terminal</h3>
                <p className="text-xs text-slate-500">
                  Approved script: database/seeds/002_sih_demo_reset.sql
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Per the Security Agreement, database reset functions are strictly protected and require both session guards
                (<code className="font-bold">app.demo_seed_enabled</code> and <code className="font-bold">app.demo_reset_enabled</code>).
                There is no unauthenticated or public web mutation button for resetting the database.
              </p>
              <p>
                To reset the database, execute the approved command in your terminal:
              </p>

              <div className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                <div>psql &quot;$DATABASE_URL&quot; \</div>
                <div className="pl-4">-c &quot;SET app.demo_seed_enabled = &apos;on&apos;;&quot; \</div>
                <div className="pl-4">-c &quot;SET app.demo_reset_enabled = &apos;on&apos;;&quot; \</div>
                <div className="pl-4">-f database/seeds/002_sih_demo_reset.sql</div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 text-[11px]">
                <strong>Scope:</strong> Resets only the canonical SIH demo transaction fixture. Non-demo tables are untouched.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
