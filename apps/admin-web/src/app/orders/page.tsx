'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { fetchOrders } from '../../lib/api/endpoints';
import { Order, OrderStatus } from '../../lib/api/types';
import { formatINR } from '../../lib/utils/money';
import { formatDateTime } from '../../lib/utils/dates';
import { formatQuantity } from '../../lib/utils/units';

export default function OrdersPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
      try {
        const o = await fetchOrders(ctx);
        setOrders(o);
      } catch (err) {
        console.error('Orders load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [demoMode, apiBaseUrl, authToken]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.farmer_name && o.farmer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const columns: Column<Order>[] = [
    {
      header: 'Order Reference',
      accessor: (row) => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-xs">
            {row.id.substring(0, 8)}...
          </div>
          <div className="text-[11px] text-slate-500 font-mono">v{row.version} • {formatDateTime(row.created_at)}</div>
        </div>
      ),
    },
    {
      header: 'Parties Involved',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">
            {row.farmer_name || `Farmer ${row.farmer_profile_id.substring(0, 8)}`}
          </div>
          <div className="text-slate-500">
            ↳ {row.buyer_name || `Buyer ${row.buyer_profile_id?.substring(0, 8) || 'FPO'}`}
          </div>
        </div>
      ),
    },
    {
      header: 'Volume & Price',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900">
            {formatQuantity(row.snapshot_quantity_kg)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            @{formatINR(row.snapshot_unit_price_per_kg)}/kg
          </div>
        </div>
      ),
    },
    {
      header: 'Immutable Snapshot NFR',
      accessor: (row) => (
        <div className="text-xs">
          <div className="font-extrabold text-emerald-800 text-sm">
            {formatINR(row.snapshot_net_farmer_realization)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Gross {formatINR(row.snapshot_gross_selling_value)} | Cost -
            {formatINR(row.snapshot_total_applicable_cost)}
          </div>
        </div>
      ),
    },
    {
      header: 'Order Lifecycle State',
      accessor: (row) => {
        const variant =
          row.status === 'COMPLETED'
            ? 'success'
            : row.status === 'CANCELLED'
            ? 'danger'
            : row.status === 'DISPUTED'
            ? 'warning'
            : 'info';
        return (
          <Badge variant={variant} size="sm">
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <Link href={`/orders/${row.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Inspect Order
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Transacted Orders Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit binding transactions, verify immutable financial snapshots, and track fulfillment milestones.
          </p>
        </div>
      </div>

      <Card
        title="Executed Commercial Contracts"
        subtitle="Every accepted offer creates a database-enforced immutable financial snapshot"
        action={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DISPUTED">DISPUTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filteredOrders}
          isLoading={loading}
          emptyMessage="No executed orders found"
        />
      </Card>
    </div>
  );
}
