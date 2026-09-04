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
  mode = 'DEMO',
  source,
  className = '',
  showSource = true,
}) => {
  const normalized = (mode || 'DEMO').toUpperCase() as DataMode;

  if (normalized === 'LIVE') {
    return (
      <Badge variant="live" size="sm" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
        LIVE {showSource && source ? `• ${source}` : ''}
      </Badge>
    );
  }

  if (normalized === 'CACHED') {
    return (
      <Badge variant="cached" size="sm" className={className}>
        CACHED {showSource && source ? `• ${source}` : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="demo" size="sm" className={className}>
      DEMO {showSource && source ? `• ${source}` : ''}
    </Badge>
  );
};
