'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LifeBuoy, AlertCircle, ShieldAlert, CheckCircle2, Clock, Search } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';
import { fetchGrievances } from '../../lib/api/endpoints';
import { Grievance } from '../../lib/api/types';
import { formatDateTime } from '../../lib/utils/dates';

export default function GrievancesPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const res = await fetchGrievances(ctx);
        setGrievances(res.grievances);
        setIsBackendAvailable(res.isBackendAvailable);
      } catch (err) {
        console.error('Grievances load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const columns: Column<Grievance>[] = [
    {
      header: 'Grievance ID & Category',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.category}</div>
          <div className="font-mono text-[11px] text-slate-400">{row.id.substring(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Complainant',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{row.complainant_name || 'Farmer Rahul'}</div>
          <div className="text-slate-500 font-mono text-[10px]">
            {row.complainant_profile_id.substring(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: (row) => (
        <div className="text-xs text-slate-700 max-w-md line-clamp-2">
          {row.description}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'RESOLVED'
              ? 'success'
              : row.status === 'UNDER_REVIEW'
              ? 'warning'
              : 'danger'
          }
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Resolution Summary',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          {row.resolution_summary || <span className="text-slate-400">Pending Review</span>}
        </div>
      ),
    },
    {
      header: 'Timestamps',
      accessor: (row) => (
        <div className="text-xs text-slate-500 font-mono">
          {formatDateTime(row.created_at)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Grievance Redressal & Disputes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Investigate delivery discrepancies, resolve logistics delays, and manage fair settlement escalations.
          </p>
        </div>
      </div>

      {!isBackendAvailable && !demoMode && (
        <BackendUnavailable
          featureName="Grievance Redressal API (GET/POST /grievances)"
          plannedEndpoint="GET /grievances, POST /grievances/{id}/messages, POST /grievances/{id}/resolve"
          assignedAgent="Agent 4 (FastAPI Core) & Agent 11 (Transaction Workflow)"
          description="In live mode, grievance backend endpoints have not been exposed in the current FastAPI release. In strict adherence to our anti-fabrication agreement, no fake chat or ticket resolution simulation is executed in live mode."
        />
      )}

      {demoMode ? (
        <Card
          title="Deterministic Demonstration Grievance Queue"
          subtitle="Evaluation fixture demonstrating grievance resolution workflow"
          badge={
            <Badge variant="demo" size="sm">
              DEMO DATA — NOT LIVE GOVERNMENT DATA
            </Badge>
          }
        >
          <DataTable
            columns={columns}
            data={grievances}
            isLoading={loading}
            emptyMessage="No grievances recorded"
          />
        </Card>
      ) : (
        <Card title="Grievance Management System" subtitle="Live state status">
          <div className="p-8 text-center text-slate-500 text-xs">
            Backend API integration pending for live environment. Switch to <strong>DEMO MODE</strong> to inspect the deterministic demonstration flow.
          </div>
        </Card>
      )}
    </div>
  );
}
