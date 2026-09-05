import React from 'react';
import { Badge } from './Badge';
import { DataMode } from '../../lib/api/types';

interface ProvenanceBadgeProps {
  mode: DataMode | string | null | undefined;
  source?: string | null;
  observedAt?: string | null;
  className?: string;
  showSource?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  mode,
  source,
  className = '',
  showSource = true,
}) => {
  const normalized = (mode || '').toUpperCase() as DataMode;

  if (normalized === 'LIVE') {
    return (
      <Badge variant="live" size="sm" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
        Live data {showSource && source ? `• ${source}` : ''}
      </Badge>
    );
  }

  if (normalized === 'CACHED') {
    return (
      <Badge variant="cached" size="sm" className={className}>
        Cached data {showSource && source ? `• ${source}` : ''}
      </Badge>
    );
  }

  if (normalized !== 'DEMO') return <Badge variant="outline" className={className}>Data source unavailable</Badge>;

  return (
    <Badge variant="demo" size="sm" className={className}>
      DEMO DATA — NOT LIVE GOVERNMENT DATA {showSource && source ? `• ${source}` : ''}
    </Badge>
  );
};
