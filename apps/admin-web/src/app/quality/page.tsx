'use client';

import React from 'react';
import { Sparkles, ShieldAlert, AlertTriangle, CheckCircle2, Info, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';

export default function QualityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Produce Quality AI Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Assistive visual assessment auditing, grading confidence, and compliance with certification disclaimers.
          </p>
        </div>
      </div>

      {/* Critical AI Limitation & Safety Disclaimers */}
      <Card
        className="border-amber-300 bg-amber-50/40"
        title="Quality AI Certification Boundary & Disclaimers"
        subtitle="Mandatory regulatory standard for Government of Maharashtra SIH 2026 Evaluation"
      >
        <div className="space-y-3 text-xs text-amber-950">
          <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-900">
                Visual AI is Strictly Assistive Evidence — NOT Laboratory Certification
              </span>
              <p className="text-slate-600 leading-relaxed">
                Under the AgriNexis working agreement, computer vision models assist with preliminary
                grading (color uniformity, visual defects, surface blemishes). Computer vision models
                <strong> CANNOT and MUST NOT claim</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-medium">
                <li>Chemical pesticide residue clearance</li>
                <li>Heavy metal or chemical composition analysis</li>
                <li>Laboratory-grade safety certification</li>
                <li>Precise internal moisture content</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Backend Status Notice */}
      <BackendUnavailable
        featureName="Visual Produce Quality AI Engine (POST /produce-listings/{id}/quality-reports)"
        plannedEndpoint="POST /produce-listings/{id}/quality-reports"
        assignedAgent="Agent 10 (Produce Quality AI)"
        description="Agent 10 model inference pipeline is currently in development. When active, visual reports will attach structured observations and confidence intervals to produce listings."
      />

      {/* Evaluation Sample Card */}
      <Card
        title="Assistive Quality Grading Schema (Reference Spec)"
        subtitle="Expected structured evidence format for Agent 10"
      >
        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-2">
          <div className="text-emerald-400 font-bold">Representative Visual Quality Output Schema</div>
          <pre className="text-[11px] leading-relaxed overflow-x-auto text-emerald-200">
{`{
  "method": "COMPUTER_VISION_ASSISTED",
  "declared_grade": "A",
  "assessed_visual_grade": "A",
  "surface_color_uniformity": "92%",
  "blemish_score": "0.04 (Low)",
  "verification_status": "ASSISTIVE_ONLY",
  "limitations": [
    "INTERNAL_DEFECTS_NOT_ANALYZED",
    "NO_CHEMICAL_RESIDUE_TESTING_PERFORMED",
    "REQUIRES_PHYSICAL_BUYER_INSPECTION"
  ],
  "model_version": "agrinexis-quality-v1.0"
}`}
          </pre>
        </div>
      </Card>
    </div>
  );
}
