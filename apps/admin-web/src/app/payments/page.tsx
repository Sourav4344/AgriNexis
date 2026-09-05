'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useDemo } from '../../lib/config/demoContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { fetchAllPayments, transitionPayment } from '../../lib/api/endpoints';
import { Payment, PaymentStatus } from '../../lib/api/types';
import { formatINR } from '../../lib/utils/money';
import { formatDateTime } from '../../lib/utils/dates';

export default function PaymentsPage() {
  const { demoMode, apiBaseUrl, authToken } = useDemo();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [transitionStatus, setTransitionStatus] = useState<PaymentStatus>('PAID');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      const data = await fetchAllPayments(ctx);
      setPayments(data);
    } catch (err) {
      console.error('Payments load error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authToken, demoMode]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setTransitioning(true);
    const ctx = { baseUrl: apiBaseUrl, token: authToken, demoMode };
    try {
      await transitionPayment(ctx, selectedPayment.id, {
        expected_status: selectedPayment.status,
        new_status: transitionStatus,
        reason: transitionReason || undefined,
      });
      setSelectedPayment(null);
      await load();
    } catch (err: any) {
      alert(`Payment transition error: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Payment Reference',
      accessor: (row) => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-xs">
            {row.provider_reference || row.id.substring(0, 12)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Provider: {row.provider_name || 'BANK_GATEWAY'}
          </div>
        </div>
      ),
    },
    {
      header: 'Linked Order',
      accessor: (row) => (
        <Link href={`/orders/${row.order_id}`} className="text-xs font-mono text-emerald-700 hover:underline">
          #{row.order_id.substring(0, 8)}...
        </Link>
      ),
    },
    {
      header: 'Authoritative Amount',
      accessor: (row) => (
        <div className="text-xs font-bold text-slate-900 font-mono text-sm">
          {formatINR(row.amount)}
        </div>
      ),
    },
    {
      header: 'Payment Mode',
      accessor: (row) => (
        <Badge variant={row.mode === 'LIVE' ? 'live' : 'demo'} size="sm">
          {row.mode}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variant =
          row.status === 'PAID'
            ? 'success'
            : row.status === 'PROCESSING'
            ? 'warning'
            : row.status === 'FAILED'
            ? 'danger'
            : 'outline';
        return <Badge variant={variant} size="sm">{row.status}</Badge>;
      },
    },
    {
      header: 'Timestamps',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <div>Created: {formatDateTime(row.created_at)}</div>
          {row.paid_at && <div className="text-emerald-700 text-[11px]">Paid: {formatDateTime(row.paid_at)}</div>}
        </div>
      ),
    },
    {
      header: 'Action',
      className: 'text-right',
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedPayment(row);
            setTransitionStatus(row.status === 'PROCESSING' ? 'PAID' : 'REFUNDED');
          }}
        >
          Manage State
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment & Settlement Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor settlement records, verify Net Farmer Realization disbursement status, and manage test state transitions.
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Payment Security & Live Gateway Rule
        </div>
        <p>
          In accordance with FastAPI routes in <code>services/api/app/routes.py</code>, live payment state transitions
          require a verified webhook callback from a configured banking gateway (returns <code>503 PAYMENT_PROVIDER_NOT_CONFIGURED</code> if manual). In sandbox/demo mode,
          administrative transitions are permitted for SIH rehearsal.
        </p>
      </div>

      <Card
        title="Payment & Settlement Records"
        subtitle="Immutable transaction payments tied to accepted farmer orders"
      >
        <DataTable
          columns={columns}
          data={payments}
          isLoading={loading}
          emptyMessage="No payment transactions found"
        />
      </Card>

      {/* Transition Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Admin Payment State Transition"
        subtitle={`Payment ID: ${selectedPayment?.id}`}
      >
        {selectedPayment && (
          <form onSubmit={handleTransition} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-slate-900 font-mono">{formatINR(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <Badge variant="warning" size="sm">{selectedPayment.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <Badge variant={selectedPayment.mode === 'LIVE' ? 'live' : 'demo'} size="sm">
                  {selectedPayment.mode}
                </Badge>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Select Target Status
              </label>
              <select
                value={transitionStatus}
                onChange={(e) => setTransitionStatus(e.target.value as PaymentStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
              >
                <option value="PROCESSING">PROCESSING</option>
                <option value="PAID">PAID</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Audit Reason</label>
              <input
                type="text"
                placeholder="e.g. Payment verified after delivery confirmation"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedPayment(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={transitioning}>
                Apply Transition
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
