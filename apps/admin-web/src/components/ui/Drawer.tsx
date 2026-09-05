import { useDialogFocus } from './useDialogFocus';
import React, { useId } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  const panelRef = useDialogFocus(isOpen, onClose);
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-2 sm:pl-10">
        <div className="w-screen max-w-md md:max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div>
              <h3 id={titleId} className="text-base font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
