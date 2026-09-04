'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ShieldCheck, Database, Lock, Eye, Terminal } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';
import { fetchAuditEvents } from '../../lib/api/endpoints';
import { AuditEvent } from '../../lib/api/types';
import { formatDateTime } from '../../lib/utils/dates';

export default function AuditPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const res = await fetchAuditEvents(ctx);
        setEvents(res.events);
        setIsBackendAvailable(res.isBackendAvailable);
      } catch (err) {
        console.error('Audit load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const columns: Column<AuditEvent>[] = [
    {
      header: 'Timestamp',
      accessor: (row) => <span className="font-mono text-xs text-slate-700">{formatDateTime(row.created_at)}</span>,
    },
    {
      header: 'Actor Reference',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-900">{row.actor_name || 'System Operator'}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            {row.actor_profile_id ? `${row.actor_profile_id.substring(0, 8)}...` : 'INTERNAL'}
          </div>
        </div>
      ),
    },
    {
      header: 'Action / Event',
      accessor: (row) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Resource',
      accessor: (row) => (
        <div className="text-xs text-slate-700 font-mono">
          <span>{row.resource_type}</span>
          {row.resource_id && <span className="text-slate-400 block text-[10px]">{row.resource_id.substring(0, 8)}...</span>}
        </div>
      ),
    },
    {
      header: 'Outcome',
      accessor: (row) => (
        <Badge variant={row.outcome === 'SUCCESS' ? 'success' : 'danger'} size="sm">
          {row.outcome}
        </Badge>
      ),
    },
    {
      header: 'Safe Metadata',
      accessor: (row) => (
        <div className="text-[11px] font-mono text-slate-600 max-w-xs truncate">
          {JSON.stringify(row.metadata)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Audit & System Traceability
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Append-only security log, administrative accountability, and state machine provenance tracking.
          </p>
        </div>
      </div>

      {!isBackendAvailable && !demoMode && (
        <BackendUnavailable
          featureName="Platform-Wide Audit Trail (GET /admin/audit-events)"
          plannedEndpoint="GET /admin/audit-events"
          assignedAgent="Agent 4 (FastAPI Core) & Agent 5 (Database)"
          description="In live mode, the general system audit log table is isolated in the unexposed internal PostgreSQL schema. Per-order audit history remains accessible under each individual order page via GET /orders/{id}/history."
        />
      )}

      {demoMode ? (
        <Card
          title="Deterministic System Audit Log"
          subtitle="Sanitized append-only event log (secrets & tokens strictly redacted)"
          badge={
            <Badge variant="demo" size="sm">
              DEMO DATA — NOT LIVE GOVERNMENT DATA
            </Badge>
          }
        >
          <DataTable
            columns={columns}
            data={events}
            isLoading={loading}
            emptyMessage="No audit records"
          />
        </Card>
      ) : (
        <Card title="Order-Level Traceability">
          <div className="text-xs text-slate-600 p-4 space-y-2">
            <p>
              To inspect verified audit transitions in the live environment, open individual order records from the{' '}
              <Link href="/orders" className="text-emerald-700 font-bold hover:underline">
                Orders Management page
              </Link>.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
