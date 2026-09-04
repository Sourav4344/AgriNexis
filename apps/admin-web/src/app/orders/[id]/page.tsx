'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Truck,
  FileText,
} from 'lucide-react';
import { useDemo } from '../../../lib/config/demoContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DataTable, Column } from '../../../components/ui/DataTable';
import {
  fetchOrder,
  fetchOrderHistory,
  fetchOrderPayments,
  transitionOrder,
} from '../../../lib/api/endpoints';
import { Order, OrderStatusHistory, Payment, OrderStatus } from '../../../lib/api/types';
import { formatINR } from '../../../lib/utils/money';
import { formatDateTime } from '../../../lib/utils/dates';
import { formatQuantity } from '../../../lib/utils/units';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { demoMode, apiBaseUrl, authToken } = useDemo();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus>('PICKUP_SCHEDULED');
  const [transitionNote, setTransitionNote] = useState('');

  const loadOrder = React.useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      const o = await fetchOrder(ctx, orderId);
      setOrder(o);

      const [h, p] = await Promise.all([
        fetchOrderHistory(ctx, orderId),
        fetchOrderPayments(ctx, orderId),
      ]);
      setHistory(h);
      setPayments(p);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, apiBaseUrl, authToken, demoMode]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setTransitioning(true);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      await transitionOrder(ctx, order.id, {
        to_status: selectedNextStatus,
        version: order.version,
        note: transitionNote.trim() || undefined,
      });
      setTransitionNote('');
      await loadOrder();
    } catch (err: any) {
      alert(`Order transition rejected by backend: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading authoritative order snapshot...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <Button variant="outline" size="sm" onClick={() => router.push('/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const historyColumns: Column<OrderStatusHistory>[] = [
    {
      header: 'Timestamp',
      accessor: (row) => <span className="text-xs text-slate-700">{formatDateTime(row.changed_at)}</span>,
    },
    {
      header: 'State Transition',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-slate-500">{row.from_status}</span>
          <span className="text-slate-400">→</span>
          <Badge variant="info" size="sm">{row.to_status}</Badge>
        </div>
      ),
    },
    {
      header: 'Reason / Note',
      accessor: (row) => <span className="text-xs text-slate-600">{row.reason || 'System state transition'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/orders')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Orders
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Order Contract #{order.id.substring(0, 8)}...
          </h1>
          <div className="text-xs text-slate-500 font-mono">
            Accepted: {formatDateTime(order.accepted_at)} • Version: v{order.version}
          </div>
        </div>
      </div>

      {/* Snapshot Economics Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Immutable Snapshot Financial Breakdown */}
        <Card
          className="lg:col-span-2 border-emerald-300"
          title="Authoritative Accepted Financial Snapshot"
          subtitle="Trigger-protected immutable snapshot in compliance with PostgreSQL contract 008_orders_adjustments.sql"
          badge={
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
              <Lock className="w-3 h-3 text-emerald-700" />
              IMMUTABLE SNAPSHOT
            </span>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">Contracted Quantity:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {formatQuantity(order.snapshot_quantity_kg)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Agreed Unit Price:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {formatINR(order.snapshot_unit_price_per_kg)}/kg
                </div>
              </div>
              <div>
                <span className="text-slate-500">Accepted Offer Key:</span>
                <div className="font-mono text-slate-700 mt-0.5 truncate">
                  {order.accepted_offer_id.substring(0, 12)}...
                </div>
              </div>
            </div>

            {/* Itemized Economics Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-3 bg-slate-100/70 border-b border-slate-200 font-bold text-slate-800 flex justify-between">
                <span>Economic Component</span>
                <span>Authoritative Amount (INR)</span>
              </div>
              <div className="divide-y divide-slate-100 p-3 space-y-2">
                <div className="flex justify-between items-center text-slate-900 font-bold">
                  <span>Gross Selling Value ({order.snapshot_quantity_kg} kg @ {order.snapshot_unit_price_per_kg}/kg)</span>
                  <span>{formatINR(order.snapshot_gross_selling_value)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 pl-3 pt-1">
                  <span>↳ Snapshot Transportation Cost</span>
                  <span className="font-mono">-{formatINR(order.snapshot_transportation_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 pl-3 pt-1">
                  <span>↳ Snapshot Storage Cost</span>
                  <span className="font-mono">-{formatINR(order.snapshot_storage_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 pl-3 pt-1">
                  <span>↳ Snapshot Handling Cost</span>
                  <span className="font-mono">-{formatINR(order.snapshot_handling_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 pl-3 pt-1">
                  <span>↳ Snapshot Other Applicable Cost</span>
                  <span className="font-mono">-{formatINR(order.snapshot_other_applicable_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-800 font-semibold pt-2 border-t border-slate-200">
                  <span>Total Deductions Snapshot</span>
                  <span className="font-mono text-rose-700 font-bold">-{formatINR(order.snapshot_total_applicable_cost)}</span>
                </div>
              </div>
              <div className="p-3.5 bg-emerald-700 text-white flex items-center justify-between font-bold text-sm">
                <span>Accepted NFR Snapshot</span>
                <span className="text-lg font-black">{formatINR(order.snapshot_net_farmer_realization)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right 1 Col: State Machine & Transition Actions */}
        <div className="space-y-4">
          <Card title="Order State Machine" subtitle="Advance or dispute order fulfillment status">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <Badge
                  variant={
                    order.status === 'COMPLETED'
                      ? 'success'
                      : order.status === 'CANCELLED'
                      ? 'danger'
                      : order.status === 'DISPUTED'
                      ? 'warning'
                      : 'info'
                  }
                  size="md"
                >
                  {order.status}
                </Badge>
              </div>

              {!['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(order.status) ? (
                <form onSubmit={handleTransition} className="space-y-3 pt-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Allowed Next Status (v{order.version})
                    </label>
                    <select
                      value={selectedNextStatus}
                      onChange={(e) => setSelectedNextStatus(e.target.value as OrderStatus)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="COMPLETED">COMPLETED (Terminal)</option>
                      <option value="DISPUTED">DISPUTED (Flag for Grievance)</option>
                      <option value="CANCELLED">CANCELLED (Terminal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Reason / Transition Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Carrier arrived at farm gate..."
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    className="w-full"
                    isLoading={transitioning}
                  >
                    Execute State Transition
                  </Button>
                </form>
              ) : (
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-center">
                  Order is in terminal status <strong>{order.status}</strong>.
                </div>
              )}
            </div>
          </Card>

          <Card title="Payment Status" subtitle="Payment transactions linked to this order">
            {payments.length > 0 ? (
              <div className="space-y-2 text-xs">
                {payments.map((p) => (
                  <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{formatINR(p.amount)}</span>
                      <Badge variant={p.status === 'PAID' ? 'success' : 'warning'} size="sm">
                        {p.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Ref: {p.provider_reference || 'N/A'} ({p.mode})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">
                No payment initiated yet for this order.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Append-Only Status History */}
      <Card
        title="Append-Only Order Status Audit History"
        subtitle="Immutable timestamped log of all lifecycle transitions (trigger-validated)"
      >
        <DataTable
          columns={historyColumns}
          data={history}
          isLoading={false}
          emptyMessage="No transitions recorded yet"
        />
      </Card>
    </div>
  );
}
