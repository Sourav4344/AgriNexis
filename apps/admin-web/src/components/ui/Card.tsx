import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  badge,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
