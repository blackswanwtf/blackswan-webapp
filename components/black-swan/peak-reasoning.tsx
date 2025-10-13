"use client";

import { useHomeSSEContext } from "@/contexts/home-sse-context";
import { AnalysisReasoning } from "./analysis-reasoning";

interface PeakReasoningProps {
  className?: string;
}

export function PeakReasoning({ className }: PeakReasoningProps) {
  const { data, isLoading, error } = useHomeSSEContext();

  return (
    <AnalysisReasoning
      reasoning={data?.peak?.reasoning}
      analysisType="Peak Market"
      className={className}
      isLoading={isLoading}
      error={error}
    />
  );
}
