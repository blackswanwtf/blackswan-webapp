"use client";

import { useEffect, useState } from "react";
import { useImprovedAuth } from "@/providers/authentication";
import { useHomeSSEContext } from "@/contexts/home-sse-context";

export interface HistoricalChartDataPoint {
  id: string;
  blackSwanScore: number;
  timestamp: number;
  date: string; // formatted date for display
}

interface FirestoreAnalysisDoc {
  blackswan_score?: number;
  timestamp?: string;
  createdAt?: any; // Firestore Timestamp object or serialized timestamp
  [key: string]: any;
}

export function useHistoricalChartData() {
  const [data, setData] = useState<HistoricalChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useImprovedAuth();
  const { data: homeData } = useHomeSSEContext();

  useEffect(() => {
    let aborted = false;
    async function fetchChart() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/platform/blackswan/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser?.uid }),
          cache: "no-store",
        });
        const json = (await res.json()) as Array<{
          score: number;
          timestamp: number;
        }>;
        if (aborted) return;

        const processed: HistoricalChartDataPoint[] = (json || []).map(
          (item, index) => {
            const date = new Date(item.timestamp || 0);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            return {
              id: String(index),
              blackSwanScore: item.score ?? 0,
              timestamp: item.timestamp ?? 0,
              date: `${formattedDate}_${item.timestamp ?? 0}`,
            };
          }
        );
        setData(processed);
        setIsLoading(false);
      } catch (e: any) {
        if (aborted) return;
        setError(e?.message || "Failed to load chart data");
        setIsLoading(false);
      }
    }

    // Refetch on home updates for freshness
    fetchChart();
    return () => {
      aborted = true;
    };
  }, [currentUser?.uid, homeData?.timestamp]);

  return { data, isLoading, error };
}
