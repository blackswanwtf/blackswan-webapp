"use client";

import { useHomeSSEContext } from "@/contexts/home-sse-context";
import { AnalysisReasoning } from "./analysis-reasoning";

interface BlackSwanReasoningProps {
  className?: string;
}

export function BlackSwanReasoning({ className }: BlackSwanReasoningProps) {
  const { data, isLoading, error } = useHomeSSEContext();

  return (
    <AnalysisReasoning
      reasoning={data?.blackswan?.reasoning}
      analysisType="BlackSwan"
      className={className}
      isLoading={isLoading}
      error={error}
    />
  );
}
