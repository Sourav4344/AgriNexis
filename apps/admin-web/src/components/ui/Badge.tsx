import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'demo'
  | 'live'
  | 'cached'
  | 'purple'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800 border-slate-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
  warning: 'bg-amber-50 text-amber-900 border-amber-300 font-medium',
  danger: 'bg-rose-50 text-rose-800 border-rose-300 font-medium',
  info: 'bg-blue-50 text-blue-800 border-blue-300 font-medium',
  demo: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold tracking-wide',
  live: 'bg-green-100 text-green-900 border-green-400 font-semibold tracking-wide',
  cached: 'bg-cyan-100 text-cyan-900 border-cyan-400 font-semibold',
  purple: 'bg-purple-50 text-purple-800 border-purple-300 font-medium',
  outline: 'bg-transparent text-slate-700 border-slate-300',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const sizeStyles = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
