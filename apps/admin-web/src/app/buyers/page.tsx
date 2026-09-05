'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  Lock,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';
import { fetchAllUsers } from '../../lib/api/endpoints';
import { Profile, VerificationStatus } from '../../lib/api/types';
import { formatDateTime } from '../../lib/utils/dates';

export default function BuyersPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState<Profile[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Profile | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const res = await fetchAllUsers(ctx);
        const buyerProfiles = res.profiles.filter((u) => u.role === 'BUYER');
        setBuyers(buyerProfiles);
      } catch (err) {
        console.error('Buyers load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const filteredBuyers = buyers.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.verification_status === statusFilter;
  });

  const columns: Column<Profile>[] = [
    {
      header: 'Buyer Enterprise',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {row.organization_name || row.display_name}
          </div>
          <div className="font-mono text-[11px] text-slate-400">{row.id}</div>
        </div>
      ),
    },
    {
      header: 'Trade Reference / Reg',
      accessor: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.trade_reference || 'N/A'}
        </span>
      ),
    },
    {
      header: 'District / Region',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {row.farmer_district || 'Maharashtra'}
        </span>
      ),
    },
    {
      header: 'Verification Status',
      accessor: (row) => {
        const status = row.verification_status || 'UNVERIFIED';
        return (
          <Badge
            variant={
              status === 'VERIFIED'
                ? 'success'
                : status === 'PENDING'
                ? 'warning'
                : status === 'REJECTED'
                ? 'danger'
                : 'outline'
            }
            size="sm"
          >
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Reliability',
      accessor: (row) => (
        <Badge variant={row.reliability_status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
          {row.reliability_status || 'ACTIVE'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedBuyer(row)}
          leftIcon={<FileText className="w-3.5 h-3.5" />}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Buyer Verification & Trust Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit procurement entities, inspect trade credentials, and manage buyer verification
            states.
          </p>
        </div>
      </div>

      {/* Backend Limitation Notice: Mutation routes not exposed in FastAPI yet */}
      <BackendUnavailable
        featureName="Buyer Verification Decision Mutation (POST /admin/verifications/{id}/decisions)"
        plannedEndpoint="POST /admin/verifications/{id}/decisions"
        assignedAgent="Agent 4 (FastAPI Core) & Agent 5 (Database RLS)"
        description="The current FastAPI implementation does not yet expose the verification decision mutation endpoint. In compliance with our non-fake policy, verification approval and rejection actions are locked as READ_ONLY and clearly marked below."
      />

      {/* Filter Tabs & Buyer Table */}
      <Card
        title="Buyer Verification Queue"
        subtitle="Regulated market participants requesting transactional eligibility"
        action={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING Queue</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="UNVERIFIED">UNVERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filteredBuyers}
          isLoading={loading}
          emptyMessage="No buyers in this queue"
        />
      </Card>

      {/* Buyer Detail & Verification Review Drawer */}
      <Drawer
        isOpen={!!selectedBuyer}
        onClose={() => setSelectedBuyer(null)}
        title={selectedBuyer?.organization_name || selectedBuyer?.display_name || 'Buyer Review'}
        subtitle={`Profile ID: ${selectedBuyer?.id}`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
              <Lock className="w-3 h-3 text-amber-700" />
              <span>Mutation API Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" disabled leftIcon={<XCircle className="w-3.5 h-3.5" />}>
                Reject Buyer
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Approve & Verify
              </Button>
            </div>
          </div>
        }
      >
        {selectedBuyer && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Enterprise Credentials
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Org Name:</span>
                <span className="font-bold text-slate-900">{selectedBuyer.organization_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trade Reference:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedBuyer.trade_reference || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">District / State:</span>
                <span className="font-medium text-slate-800">
                  {selectedBuyer.farmer_district || 'Pune'}, {selectedBuyer.farmer_state || 'Maharashtra'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Status:</span>
                <Badge
                  variant={
                    selectedBuyer.verification_status === 'VERIFIED'
                      ? 'success'
                      : selectedBuyer.verification_status === 'PENDING'
                      ? 'warning'
                      : 'outline'
                  }
                  size="sm"
                >
                  {selectedBuyer.verification_status || 'UNVERIFIED'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Reliability Record:</span>
                <Badge
                  variant={selectedBuyer.reliability_status === 'ACTIVE' ? 'success' : 'outline'}
                  size="sm"
                >
                  {selectedBuyer.reliability_status || 'ACTIVE'}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                Backend Mutation Integrity Rule
              </div>
              <p className="text-[11px] leading-relaxed">
                Admins cannot mutate verification status purely in client-side state. The backend
                endpoint <code>POST /admin/verifications/&#123;id&#125;/decisions</code> is scheduled
                for implementation by Agent 4.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
