import React from 'react';
import { AlertTriangle, Info, Terminal } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';

interface BackendUnavailableProps {
  featureName: string;
  plannedEndpoint?: string;
  assignedAgent?: string;
  description?: string;
  className?: string;
}

export const BackendUnavailable: React.FC<BackendUnavailableProps> = ({
  featureName,
  plannedEndpoint,
  assignedAgent = 'Agent 4 / Agent 5',
  description,
  className = '',
}) => {
  return (
    <Card className={`border-amber-200 bg-amber-50/50 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{featureName}</h4>
            <Badge variant="warning" size="sm">
              BACKEND_NOT_AVAILABLE
            </Badge>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {description ||
              `This capability is unavailable in the current workspace. No action has been submitted.`}
          </p>
          {(plannedEndpoint || assignedAgent) && (
            <details className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono bg-white/80 p-2.5 rounded border border-amber-200">
              <summary className="cursor-pointer">Technical details</summary>
              {plannedEndpoint && (
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Planned: {plannedEndpoint}</span>
                </div>
              )}
              {assignedAgent && (
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned: {assignedAgent}</span>
                </div>
              )}
            </details>
          )}
        </div>
      </div>
    </Card>
  );
};
