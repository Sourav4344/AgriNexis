import React from "react";
import { Badge } from "../ui/Badge";
import { FileCheck, AlertCircle } from "lucide-react";
import { useDemo } from "@/lib/context/DemoContext";

interface QualityBadgeProps {
  summary?: Record<string, any>;
}

export function QualityBadge({ summary }: QualityBadgeProps) {
  const { isDemoMode } = useDemo();

  if (!summary || Object.keys(summary).length === 0) {
    if (!isDemoMode) {
      return (
        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
          QUALITY_DATA_NOT_AVAILABLE
        </span>
      );
    }
    return (
      <Badge variant="outline" size="sm">
        Standard Quality
      </Badge>
    );
  }

  const declaredGrade = summary.declared_grade || summary.grade;

  return (
    <div className="inline-flex items-center space-x-1.5">
      <Badge variant="info" size="sm" className="font-semibold">
        <FileCheck className="w-3 h-3 mr-1 inline" />
        {declaredGrade ? `Grade ${declaredGrade}` : "Quality Logged"}
      </Badge>
    </div>
  );
}
