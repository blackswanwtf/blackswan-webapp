import { useState, useEffect, useCallback } from "react";

export interface UserPerformanceData {
  timestamp: string;
  uid: string;
  address: string;
  fundContract: string;
  fundName: string;
  totalMoneyIn: number;
  totalExpectedOut: number;
  profitAmount: number;
  profitPercentage: number;
  breakdown: {
    availableForWithdrawal: number;
    originalInvestmentInTrades: number;
    currentValueInActiveTrades: number;
    unrealizedPnL: number;
    totalWithdrawn: number;
    realizedProfitLoss: number;
    distributedProfitFromSpecialInvestor: number;
    allFundMemberships: string[];
  };
}

export interface UserPerformanceResponse {
  success: boolean;
  data: UserPerformanceData;
}

export const useUserPerformance = (
  uid: string | null,
  fundId: string = "v2"
) => {
  const [data, setData] = useState<UserPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_FUND_PERFORMANCE_API;

  const fetchUserPerformance = useCallback(async () => {
    if (!uid) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/performance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          fundVersion: fundId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UserPerformanceResponse = await response.json();

      console.log(`[UserPerformance] ${fundId} Fund API Response:`, {
        success: result.success,
        fundContract: result.data?.fundContract,
        fundName: result.data?.fundName,
        totalMoneyIn: result.data?.totalMoneyIn,
        totalExpectedOut: result.data?.totalExpectedOut,
        hasAllFundMemberships: !!result.data?.breakdown?.allFundMemberships,
        allFundMemberships: result.data?.breakdown?.allFundMemberships,
      });

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      console.error("Error fetching user performance:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [uid, fundId, API_BASE_URL]);

  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    // Initial fetch
    fetchUserPerformance();

    // Set up polling every minute (60000ms) only if user is authenticated
    const interval = setInterval(fetchUserPerformance, 60000);

    // Cleanup interval on unmount or when uid changes
    return () => clearInterval(interval);
  }, [fetchUserPerformance, uid, fundId]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (uid) {
      setIsLoading(true);
      fetchUserPerformance();
    }
  }, [fetchUserPerformance, uid, fundId]);

  return {
    data,
    isLoading,
    error,
    refresh,
    totalMoneyIn: data?.totalMoneyIn || 0,
    totalExpectedOut: data?.totalExpectedOut || 0,
    totalWithdrawn: data?.breakdown?.totalWithdrawn || 0,
    profitAmount: data?.profitAmount || 0,
    profitPercentage: data?.profitPercentage || 0,
    userAddress: data?.address,
    lastUpdated: data?.timestamp,
    // User has investment if they have a positive net investment (totalMoneyIn - totalWithdrawn > 0)
    // AND the fund contract is ScoutAI V2, OR if they're in the ScoutAI V2 fund membership list
    hasInvestment: data
      ? ((data?.totalMoneyIn ?? 0) - (data?.breakdown?.totalWithdrawn ?? 0) >
          0 &&
          data?.fundContract ===
            "0x82D1A9B905F3D3D5443072151B312C17d0dcCF12") ||
        (data?.breakdown?.allFundMemberships?.includes(
          "0x82d1a9b905f3d3d5443072151b312c17d0dccf12"
        ) ??
          false)
      : false,
    // Check if specifically invested in ScoutAI V2 (either by current fund contract or membership)
    hasScoutAIV2Investment: data
      ? (data?.fundContract === "0x82D1A9B905F3D3D5443072151B312C17d0dcCF12" &&
          (data?.totalMoneyIn ?? 0) - (data?.breakdown?.totalWithdrawn ?? 0) >
            0) ||
        (data?.breakdown?.allFundMemberships?.includes(
          "0x82d1a9b905f3d3d5443072151b312c17d0dccf12"
        ) ??
          false)
      : false,
  };
};
