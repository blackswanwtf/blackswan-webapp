import { useState, useEffect, useCallback, useMemo } from "react";

export interface FundPerformanceData {
  timestamp: string;
  fundVersion: string;
  fundName: string;
  contractAddress: string;
  totalAssetsUnderManagement: number;
  fundPerformancePercent: number;
  aiTradingPerformancePercent: number;
  breakdown: {
    totalNetDeposited: number;
    totalCurrentFundValue: number;
    availableForWithdrawal: number;
    currentUnrealizedValue: number;
    totalRealizedPnL: number;
    unrealizedPnL: number;
    activePositionsCount: number;
    closedPositionsCount: number;
    totalUsers: number;
  };
}

export interface FundPerformanceResponse {
  success: boolean;
  data: FundPerformanceData;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_FUND_PERFORMANCE_API;

export const useFundPerformance = (fundId: string = "v2") => {
  const [data, setData] = useState<FundPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFundPerformance = useCallback(async () => {
    try {
      console.log(
        `[FundPerformance] Fetching performance data for funds: ${fundId}...`
      );
      const response = await fetch(
        `${API_BASE_URL}/api/fund/performance?fund=${fundId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FundPerformanceResponse = await response.json();

      if (result.success) {
        // Only update state if data has actually changed to prevent unnecessary re-renders
        setData((prevData) => {
          // More efficient comparison - check key fields instead of full JSON stringify
          if (
            !prevData ||
            prevData.totalAssetsUnderManagement !==
              result.data.totalAssetsUnderManagement ||
            prevData.fundPerformancePercent !==
              result.data.fundPerformancePercent ||
            prevData.aiTradingPerformancePercent !==
              result.data.aiTradingPerformancePercent ||
            prevData.timestamp !== result.data.timestamp
          ) {
            console.log("[FundPerformance] Data changed, updating state");
            return result.data;
          }
          console.log(
            "[FundPerformance] Data unchanged, keeping previous state"
          );
          return prevData;
        });
        setError(null);
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error fetching performance:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [fundId]);

  useEffect(() => {
    console.log("[FundPerformance] Setting up effect");
    // Initial fetch
    fetchFundPerformance();

    // Set up polling every minute (60000ms)
    const interval = setInterval(() => {
      console.log("[FundPerformance] Interval tick - fetching data");
      fetchFundPerformance();
    }, 60000);

    // Cleanup interval on unmount
    return () => {
      console.log("[FundPerformance] Cleaning up interval");
      clearInterval(interval);
    };
  }, [fetchFundPerformance]);

  // Manual refresh function - stable reference
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchFundPerformance();
  }, [fetchFundPerformance]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => {
    console.log("[FundPerformance] Creating return object");

    return {
      data,
      isLoading,
      error,
      refresh,
      totalAssetsUnderManagement: data?.totalAssetsUnderManagement || 0,
      fundPerformancePercent: data?.fundPerformancePercent || 0,
      // Now we have separate AI trading performance from the API
      aiTradingPerformancePercent: data?.aiTradingPerformancePercent || 0,
      lastUpdated: data?.timestamp,
      targetFund: data, // Expose the full fund data (now it's the direct response)
    };
  }, [data, isLoading, error, refresh]);
};
