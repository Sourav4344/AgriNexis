import React from "react";
import { OrderStatus } from "@/lib/types";
import {
  CheckCircle,
  Clock,
  Truck,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface OrderTimelineProps {
  status: OrderStatus;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const steps: Array<{ key: OrderStatus; label: string; icon: any }> = [
    { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
    { key: "PICKUP_SCHEDULED", label: "Pickup Scheduled", icon: Clock },
    { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: PackageCheck },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  ];

  if (status === "DISPUTED") {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-amber-900 text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <span className="font-bold">Order in Dispute Resolution</span>
          <p className="text-xs text-amber-700 mt-0.5">
            This order is disputed. Review its recorded history for details.
          </p>
        </div>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-900 text-sm">
        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <span className="font-bold">Order Cancelled</span>
          <p className="text-xs text-rose-700 mt-0.5">
            This order is cancelled. Review its recorded history and payment status.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 z-0 transition-all duration-300"
          style={{
            width: `${Math.max(0, (currentIndex / (steps.length - 1)) * 100)}%`,
          }}
        ></div>

        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className="flex flex-col items-center relative z-10 text-center"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition border-2 ${
                  isCurrent
                    ? "bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-500/30 scale-110"
                    : isDone
                    ? "bg-emerald-100 border-emerald-600 text-emerald-800"
                    : "bg-white border-slate-300 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-semibold mt-2 max-w-[80px] leading-tight ${
                  isCurrent
                    ? "text-emerald-900 font-bold"
                    : isDone
                    ? "text-slate-800"
                    : "text-slate-600"
                }`}
              >
                {step.label}
                {isCurrent && <span className="block">Current</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
