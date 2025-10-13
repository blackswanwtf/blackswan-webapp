"use client";

import { useEffect, useState } from "react";
import { useImprovedAuth } from "@/providers/authentication";
import { useHomeSSEContext } from "@/contexts/home-sse-context";

export interface HistoricalPeakAnalysisData {
  id: string;
  score: number;
  timestamp: number;
  summary: string;
  reasoning?: string | string[];
  keyFactors?: string[];
}

export function useHistoricalPeakAnalysis() {
  const [data, setData] = useState<HistoricalPeakAnalysisData[]>([]);
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
        const res = await fetch("/api/platform/peak/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser?.uid }),
          cache: "no-store",
        });
        const json = (await res.json()) as Array<{
          score: number;
          timestamp: number;
          summary: string;
          reasoning?: string | string[];
          keyFactors?: string[];
        }>;
        if (aborted) return;

        const processed: HistoricalPeakAnalysisData[] = (json || []).map(
          (item, index) => ({
            id: String(index),
            score: item.score ?? 0,
            timestamp: item.timestamp ?? 0,
            summary: item.summary ?? "",
            reasoning: item.reasoning ?? [],
            keyFactors: item.keyFactors ?? [],
          })
        );
        setData(processed);
        setIsLoading(false);
      } catch (e: any) {
        if (aborted) return;
        setError(e?.message || "Failed to load historical peak analysis");
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
