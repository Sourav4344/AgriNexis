import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  pagination?: {
    currentPage?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  keyExtractor,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div role="status" className="p-8 flex flex-col items-center justify-center text-slate-500 gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading records...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white p-10 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">{emptyMessage}</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          No matching records available under the selected filters or current backend state.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="responsive-table w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className={`px-4 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {data.map((row, rowIdx) => {
              const rowKey = keyExtractor ? keyExtractor(row, rowIdx) : String(rowIdx);
              return (
                <tr
                  key={rowKey}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? `Open record ${rowIdx + 1}` : undefined}
                  onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ") && onRowClick) { event.preventDefault(); onRowClick(row); } }}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    let content: React.ReactNode = null;
                    if (typeof col.accessor === 'function') {
                      content = col.accessor(row);
                    } else if (col.accessor) {
                      content = (row as any)[col.accessor];
                    }
                    return (
                      <td data-label={col.header} key={colIdx} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (pagination.hasNext || pagination.hasPrev) && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing records (Page {pagination.currentPage || 1})
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={pagination.onPrev}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={pagination.onNext}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
