'use client';

import React, { useState, useEffect } from 'react';
import { Users2, Building, ShieldCheck, MapPin, Search, Eye, AlertCircle } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';
import { fetchAllFPOs, fetchFPOProfile } from '../../lib/api/endpoints';
import { FPOProfile } from '../../lib/api/types';

export default function FPOsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [fpos, setFpos] = useState<FPOProfile[]>([]);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [selectedFpo, setSelectedFpo] = useState<FPOProfile | null>(null);

  // Single lookup for live mode
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const res = await fetchAllFPOs(ctx);
        setFpos(res.fpos);
        setIsBackendAvailable(res.isBackendAvailable);
      } catch (err) {
        console.error('FPO load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      const fpo = await fetchFPOProfile(ctx, lookupId.trim());
      setSelectedFpo(fpo);
    } catch (err: any) {
      setLookupError(err.message || 'FPO lookup failed. Verify UUID.');
    } finally {
      setLookupLoading(false);
    }
  };

  const columns: Column<FPOProfile>[] = [
    {
      header: 'FPO Collective',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.display_name}</div>
          <div className="text-[11px] text-slate-500">{row.legal_name || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Registration Reference',
      accessor: (row) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.registration_reference || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Geography',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {row.district ? `${row.district}, ${row.state || 'MH'}` : 'Maharashtra'}
        </span>
      ),
    },
    {
      header: 'Verification',
      accessor: (row) => (
        <Badge variant={row.verification_status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
          {row.verification_status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFpo(row)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Farmer Producer Organization (FPO) Oversight
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitor collective procurement, verify FPO entities, and inspect registered clusters.
        </p>
      </div>

      {!isBackendAvailable && !demoMode && (
        <BackendUnavailable
          featureName="FPO Directory List (GET /fpos)"
          plannedEndpoint="GET /fpos"
          assignedAgent="Agent 4 (FastAPI Core)"
          description="The live backend currently provides individual FPO lookup via GET /fpos/{id}. General listing endpoint is scheduled for Phase 3."
        />
      )}

      {/* Direct FPO ID Lookup */}
      <Card title="Direct FPO Lookup" subtitle="Inspect authenticated FPO details via GET /fpos/{id}">
        <form onSubmit={handleLookup} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Enter FPO UUID (e.g. 25000000-0000-4000-8000-000000000001)"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="flex-1 min-w-[280px] text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Button
            variant="secondary"
            size="sm"
            type="submit"
            isLoading={lookupLoading}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          >
            Lookup FPO
          </Button>
        </form>
        {lookupError && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </Card>

      {/* FPO Table */}
      <Card
        title="Registered Farmer Collectives"
        subtitle="Institutions aggregating produce to maximize collective bargaining and NFR"
      >
        <DataTable
          columns={columns}
          data={fpos}
          isLoading={loading}
          emptyMessage="No FPO collectives loaded"
        />
      </Card>

      {/* FPO Drawer */}
      <Drawer
        isOpen={!!selectedFpo}
        onClose={() => setSelectedFpo(null)}
        title={selectedFpo?.display_name || 'FPO Details'}
        subtitle={`FPO ID: ${selectedFpo?.id}`}
      >
        {selectedFpo && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Organization Profile
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Name:</span>
                <span className="font-bold text-slate-900">{selectedFpo.legal_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registration Ref:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedFpo.registration_reference || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">District / State:</span>
                <span className="font-medium text-slate-800">
                  {selectedFpo.district || 'Pune'}, {selectedFpo.state || 'Maharashtra'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Verification State:</span>
                <Badge
                  variant={selectedFpo.verification_status === 'VERIFIED' ? 'success' : 'warning'}
                  size="sm"
                >
                  {selectedFpo.verification_status}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-bold">Member & Operator Isolation</div>
              <p className="text-[11px] leading-relaxed">
                In adherence to database contract <code>003_identity_fpo.sql</code>, FPO operator
                privileges are isolated to authorized operator profiles and cannot be self-assigned
                by general members.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
