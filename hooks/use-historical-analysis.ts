"use client";

import { useEffect, useState } from "react";
import { useImprovedAuth } from "@/providers/authentication";
import { useHomeSSEContext } from "@/contexts/home-sse-context";

export interface HistoricalAnalysisData {
  id: string;
  blackSwanScore: number;
  timestamp: number;
  confidence: string;
  analysisSummary: string;
  reasoning?: string | string[];
  currentMarketIndicators?: string[];
  primaryRiskFactors?: string[];
}

export function useHistoricalAnalysis() {
  const [data, setData] = useState<HistoricalAnalysisData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useImprovedAuth();
  const { data: homeData } = useHomeSSEContext();

  useEffect(() => {
    let aborted = false;
    async function fetchHistory() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/platform/blackswan/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser?.uid }),
          cache: "no-store",
        });
        const json = (await res.json()) as Array<{
          score: number;
          timestamp: number;
          confidence: string;
          analysis: string;
          reasoning?: string | string[];
          currentMarketIndicators?: string[];
          primaryRiskFactors?: string[];
        }>;
        if (aborted) return;

        const processed: HistoricalAnalysisData[] = (json || []).map(
          (item, index) => ({
            id: String(index),
            blackSwanScore: item.score ?? 0,
            timestamp: item.timestamp ?? 0,
            confidence: item.confidence ?? "unknown",
            analysisSummary: item.analysis ?? "",
            reasoning: item.reasoning ?? [],
            currentMarketIndicators: item.currentMarketIndicators ?? [],
            primaryRiskFactors: item.primaryRiskFactors ?? [],
          })
        );
        setData(processed);
        setIsLoading(false);
      } catch (e: any) {
        if (aborted) return;
        setError(e?.message || "Failed to load historical analysis");
        setIsLoading(false);
      }
    }

    // Refetch whenever the latest home data changes (new update received)
    fetchHistory();
    return () => {
      aborted = true;
    };
  }, [currentUser?.uid, homeData?.timestamp]);

  return { data, isLoading, error };
}
