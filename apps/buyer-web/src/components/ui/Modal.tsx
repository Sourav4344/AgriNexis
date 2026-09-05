"use client";

import React, { useId } from "react";
import { useDialogFocus } from './useDialogFocus';
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const panelRef = useDialogFocus(isOpen, onClose);
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={panelRef}
      tabIndex={-1}
    >
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
