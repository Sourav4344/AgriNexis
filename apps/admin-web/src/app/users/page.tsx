'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Filter, Eye, AlertCircle } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { BackendUnavailable } from '../../components/ui/BackendUnavailable';
import { fetchAllUsers, fetchFarmerProfile, fetchBuyerProfile } from '../../lib/api/endpoints';
import { Profile, Role, AccountStatus } from '../../lib/api/types';
import { formatDateTime } from '../../lib/utils/dates';

export default function UsersPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  // Single lookup state for live mode
  const [lookupId, setLookupId] = useState('');
  const [lookupRole, setLookupRole] = useState<Role>('FARMER');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const res = await fetchAllUsers(ctx);
        setUsers(res.profiles);
        setIsBackendAvailable(res.isBackendAvailable);
      } catch (err) {
        console.error('Users load failed:', err);
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
      if (lookupRole === 'FARMER') {
        const farmer = await fetchFarmerProfile(ctx, lookupId.trim());
        setSelectedUser({
          id: farmer.id,
          user_id: 'auth-user-bound',
          role: 'FARMER',
          display_name: farmer.display_name,
          preferred_locale: (farmer.preferred_locale as any) || 'hi',
          status: 'ACTIVE',
          farmer_district: farmer.district,
          farmer_state: farmer.state,
          farm_summary: farmer.farm_summary,
          created_at: new Date().toISOString(),
        });
      } else if (lookupRole === 'BUYER') {
        const buyer = await fetchBuyerProfile(ctx, lookupId.trim());
        setSelectedUser({
          id: buyer.id,
          user_id: 'auth-user-bound',
          role: 'BUYER',
          display_name: buyer.display_name,
          preferred_locale: 'en',
          status: 'ACTIVE',
          organization_name: buyer.organization_name,
          verification_status: buyer.verification_status,
          reliability_status: buyer.reliability_status,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setLookupError(err.message || 'Profile lookup failed. Verify UUID and authorization.');
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchesSearch =
      !searchQuery ||
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organization_name && u.organization_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.farmer_district && u.farmer_district.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const columns: Column<Profile>[] = [
    {
      header: 'Identity / Name',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.display_name}</div>
          <div className="font-mono text-[11px] text-slate-400">{row.id}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => (
        <Badge
          variant={
            row.role === 'ADMIN'
              ? 'purple'
              : row.role === 'BUYER'
              ? 'info'
              : row.role === 'FPO'
              ? 'warning'
              : 'success'
          }
          size="sm"
        >
          {row.role}
        </Badge>
      ),
    },
    {
      header: 'Location / Organization',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          {row.organization_name && <div className="font-medium text-slate-800">{row.organization_name}</div>}
          {row.farmer_district ? `${row.farmer_district}, ${row.farmer_state || 'MH'}` : '—'}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={row.status === 'ACTIVE' ? 'success' : row.status === 'SUSPENDED' ? 'warning' : 'danger'}
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Verification',
      accessor: (row) => {
        if (!row.verification_status) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <Badge
            variant={
              row.verification_status === 'VERIFIED'
                ? 'success'
                : row.verification_status === 'PENDING'
                ? 'warning'
                : 'outline'
            }
            size="sm"
          >
            {row.verification_status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedUser(row)} leftIcon={<Eye className="w-3.5 h-3.5" />}>
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User & Profile Oversight</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect authorized platform profiles, verify organizations, and audit account states.
          </p>
        </div>
      </div>

      {!isBackendAvailable && !demoMode && (
        <BackendUnavailable
          featureName="Admin General User Directory (GET /admin/users)"
          plannedEndpoint="GET /admin/users / GET /admin/profiles"
          assignedAgent="Agent 4 (FastAPI Core)"
          description="The FastAPI backend currently restricts listing all users without an explicit admin user search endpoint. Direct single-profile inspection via GET /farmers/{id} and GET /buyers/{id} remains fully operational below."
        />
      )}

      {/* Direct Authorized ID Lookup Box (Always Operational) */}
      <Card title="Direct Authorized Profile Lookup" subtitle="Query authenticated public/redacted profile by UUID">
        <form onSubmit={handleLookup} className="flex flex-wrap items-center gap-3">
          <select
            value={lookupRole}
            onChange={(e) => setLookupRole(e.target.value as Role)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-700"
          >
            <option value="FARMER">Farmer Profile (/farmers/&#123;id&#125;)</option>
            <option value="BUYER">Buyer Profile (/buyers/&#123;id&#125;)</option>
          </select>
          <input
            type="text"
            placeholder="Enter exact Profile UUID (e.g. 20000000-0000-4000-8000-000000000001)"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="flex-1 min-w-[280px] text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <Button variant="secondary" size="sm" type="submit" isLoading={lookupLoading} leftIcon={<Search className="w-3.5 h-3.5" />}>
            Lookup Profile
          </Button>
        </form>
        {lookupError && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </Card>

      {/* Profile Table / Directory (Active when in Demo Mode or when user list is available) */}
      <Card
        title="Registered Platform Profiles"
        subtitle={demoMode ? 'Deterministic evaluation profiles loaded' : 'Authorized Profile Directory'}
        action={
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="FARMER">Farmer</option>
              <option value="BUYER">Buyer</option>
              <option value="FPO">FPO Operator</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 w-48 text-slate-800"
              />
            </div>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={loading}
          emptyMessage="No profiles found matching criteria"
        />
      </Card>

      {/* User Details Drawer */}
      <Drawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.display_name || 'User Profile'}
        subtitle={`Role: ${selectedUser?.role} • Status: ${selectedUser?.status}`}
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Identity & Authentication</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profile ID:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auth User ID:</span>
                <span className="font-mono text-slate-600">{selectedUser.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preferred Locale:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedUser.preferred_locale}</span>
              </div>
            </div>

            {selectedUser.role === 'FARMER' && (
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Farmer Details</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">District / State:</span>
                  <span className="font-bold text-slate-900">
                    {selectedUser.farmer_district || 'Pune'}, {selectedUser.farmer_state || 'Maharashtra'}
                  </span>
                </div>
                {selectedUser.farm_summary && (
                  <div>
                    <span className="text-slate-500">Farm Summary:</span>
                    <p className="mt-1 text-slate-700 bg-white p-2 rounded border border-emerald-100">{selectedUser.farm_summary}</p>
                  </div>
                )}
              </div>
            )}

            {selectedUser.role === 'BUYER' && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Buyer Enterprise Details</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Organization:</span>
                  <span className="font-bold text-slate-900">{selectedUser.organization_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trade Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedUser.trade_reference || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification State:</span>
                  <Badge variant={selectedUser.verification_status === 'VERIFIED' ? 'success' : 'warning'} size="sm">
                    {selectedUser.verification_status || 'UNVERIFIED'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reliability Status:</span>
                  <Badge variant={selectedUser.reliability_status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                    {selectedUser.reliability_status || 'ACTIVE'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Security & Privacy Guardrail</div>
              <p>
                Passwords, JWT tokens, and private farm-gate GPS coordinates are strictly redacted by
                backend RLS and never delivered to client endpoints.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
