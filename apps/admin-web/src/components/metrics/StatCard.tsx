import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  badge?: React.ReactNode;
  dataMode?: 'LIVE' | 'CACHED' | 'DEMO';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  badge,
  dataMode,
  className = '',
}) => {
  return (
    <Card className={`hover:border-slate-300 transition-colors ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400 p-1.5 bg-slate-50 rounded-lg">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {subValue && <span className="text-xs text-slate-500 font-medium">{subValue}</span>}
      </div>

      {(trend || badge || dataMode) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              {trend.value}
            </span>
          )}
          {badge}
          {dataMode && (
            <Badge
              variant={dataMode === 'LIVE' ? 'live' : dataMode === 'CACHED' ? 'cached' : 'demo'}
              size="sm"
            >
              {dataMode}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
};
