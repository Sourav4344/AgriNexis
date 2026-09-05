'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, Eye, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { fetchListings, publishListing, cancelListing } from '../../lib/api/endpoints';
import { ProduceListing, ListingStatus } from '../../lib/api/types';
import { formatDateOnly, formatDateTime } from '../../lib/utils/dates';
import { formatQuantity } from '../../lib/utils/units';

export default function ListingsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      const data = await fetchListings(ctx);
      setListings(data);
    } catch (err) {
      console.error('Listings load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authToken, demoMode]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      await publishListing(ctx, id);
      await load();
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;
    setActionLoading(id);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      await cancelListing(ctx, id);
      await load();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      (l.crop_name && l.crop_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns: Column<ProduceListing>[] = [
    {
      header: 'Produce & Crop',
      accessor: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.crop_name || 'Crop Listing'}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {row.variety_name || 'Standard Variety'} • v{row.version}
          </div>
        </div>
      ),
    },
    {
      header: 'Farmer Reference',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.farmer_name || 'Rahul (Farmer)'}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.farmer_profile_id.substring(0, 8)}...</div>
        </div>
      ),
    },
    {
      header: 'Total / Avail Quantity',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">{formatQuantity(row.available_quantity)} avail</div>
          <div className="text-[11px] text-slate-500">Total: {formatQuantity(row.quantity)}</div>
        </div>
      ),
    },
    {
      header: 'Availability Window',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <div>{formatDateOnly(row.available_from)}</div>
          <div className="text-[11px] text-slate-400">to {formatDateOnly(row.available_until)}</div>
        </div>
      ),
    },
    {
      header: 'Location (Coarse)',
      accessor: (row) => (
        <div className="text-xs text-slate-700">
          <span className="font-medium">{row.district}</span>, {row.state}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variant =
          row.status === 'ACTIVE'
            ? 'success'
            : row.status === 'DRAFT'
            ? 'warning'
            : row.status === 'SOLD'
            ? 'purple'
            : 'outline';
        return <Badge variant={variant} size="sm">{row.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/listings/${row.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3 h-3" />}>
              Inspect
            </Button>
          </Link>
          {row.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              isLoading={actionLoading === row.id}
              onClick={() => handlePublish(row.id)}
            >
              Publish
            </Button>
          )}
          {['DRAFT', 'ACTIVE'].includes(row.status) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50"
              isLoading={actionLoading === row.id}
              onClick={() => handleCancel(row.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Produce Listings Oversight</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor agricultural supply, inspect quality summaries, and manage listing lifecycle states.
          </p>
        </div>
      </div>

      <Card
        title="Active Produce Supply"
        subtitle="Listings verified with coarse geographical boundaries protecting farmer privacy"
        action={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="RESERVED">RESERVED</option>
              <option value="SOLD">SOLD</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search crop, district..."
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
          data={filteredListings}
          isLoading={loading}
          emptyMessage="No produce listings found matching filters"
        />
      </Card>
    </div>
  );
}
