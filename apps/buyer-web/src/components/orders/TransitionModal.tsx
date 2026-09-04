"use client";

import React, { useState } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useDemo } from "@/lib/context/DemoContext";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess?: () => void;
}

export function TransitionModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: TransitionModalProps) {
  const { transitionOrderStatus } = useDemo();
  const [targetStatus, setTargetStatus] = useState<OrderStatus>("IN_TRANSIT");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine allowed next states
  const getAvailableNextStatuses = (current: OrderStatus): OrderStatus[] => {
    switch (current) {
      case "CONFIRMED":
        return ["PICKUP_SCHEDULED", "CANCELLED", "DISPUTED"];
      case "PICKUP_SCHEDULED":
        return ["IN_TRANSIT", "CANCELLED", "DISPUTED"];
      case "IN_TRANSIT":
        return ["DELIVERED", "DISPUTED"];
      case "DELIVERED":
        return ["COMPLETED", "DISPUTED"];
      default:
        return [];
    }
  };

  const allowedStatuses = getAvailableNextStatuses(order.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await transitionOrderStatus(order.id, targetStatus, note);
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Fulfillment Status"
      description={`Order ${order.id} • Current status: ${order.status}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            New Status *
          </label>
          <select
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            {allowedStatuses.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Status Transition Note / Proof Reference
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Weighbridge slip #8829 recorded at hub receiving bay. Quality inspection passed."
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirm State Change
          </Button>
        </div>
      </form>
    </Modal>
  );
}
