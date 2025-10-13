"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Fund } from "@/lib/types/funds";

export interface FundsHookReturn {
  funds: Fund[];
  featuredFunds: Fund[]; // Featured funds (max 2, isFeatured = true)
  isLoading: boolean;
  error: string | null;
}

interface FundPerformanceApiResponse {
  fundVersion: string;
  fundName: string;
  contractAddress: string;
  fundPerformancePercent: number;
  aiTradingPerformancePercent: number;
  totalAssetsUnderManagement: number;
  timestamp: string;
}

/**
 * Fetch performance data for all funds from the API
 */
async function fetchAllFundsPerformance(): Promise<
  Map<string, FundPerformanceApiResponse>
> {
  try {
    // Use the API endpoint that returns data for all funds
    const API_BASE_URL = process.env.NEXT_PUBLIC_FUND_PERFORMANCE_API;

    console.log(
      "[fetchAllFundsPerformance] Fetching performance for all funds"
    );

    const response = await fetch(`${API_BASE_URL}/api/funds/performance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[fetchAllFundsPerformance] API returned ${response.status}`
      );
      return new Map();
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      console.warn(
        "[fetchAllFundsPerformance] Invalid response format:",
        result
      );
      return new Map();
    }

    // Create a map for fast lookup by apiId (fundVersion) and contractAddress
    const performanceMap = new Map<string, FundPerformanceApiResponse>();

    result.data.forEach((fundData: FundPerformanceApiResponse) => {
      if (fundData.fundVersion) {
        // Map by apiId (fundVersion)
        performanceMap.set(fundData.fundVersion, fundData);
        console.log(
          `[fetchAllFundsPerformance] Mapped fund ${fundData.fundVersion}: ${fundData.fundName}`
        );
      }

      if (fundData.contractAddress) {
        // Also map by contractAddress for additional lookup flexibility
        performanceMap.set(fundData.contractAddress.toLowerCase(), fundData);
      }
    });

    console.log(
      `[fetchAllFundsPerformance] Successfully mapped ${performanceMap.size} performance entries`
    );
    return performanceMap;
  } catch (error) {
    console.error(
      "[fetchAllFundsPerformance] Error fetching performance data:",
      error
    );
    return new Map();
  }
}

/**
 * Real-time hook to fetch funds from Firestore
 * Automatically updates when fund data changes in the database
 */
export function useFunds(): FundsHookReturn {
  const [rawFunds, setRawFunds] = useState<Fund[]>([]);
  const [performanceData, setPerformanceData] = useState<
    Map<string, FundPerformanceApiResponse>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[useFunds] Setting up real-time listener");

    // Create query for visible funds, ordered by creation date
    const fundsQuery = query(
      collection(db, "funds"),
      where("isVisible", "==", true), // Only show visible funds on frontend
      orderBy("createdAt", "desc") // Newest first (Firestore timestamps)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      fundsQuery,
      (snapshot) => {
        console.log(
          "[useFunds] Received snapshot with",
          snapshot.docs.length,
          "funds"
        );

        const fundsData: Fund[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("[useFunds] Processing fund:", doc.id, data);

          // Convert Firestore document to Fund interface
          const fund: Fund = {
            id: doc.id,
            name: data.name || "",
            description: data.description || "",
            bannerImage: data.bannerImage || "",
            risk: data.risk || "medium",
            lockDuration: data.lockDuration || "",
            // Convert Firestore timestamps to ISO strings for frontend use
            unlockDate: data.unlockDate
              ? data.unlockDate.toDate
                ? data.unlockDate.toDate().toISOString()
                : data.unlockDate
              : "",
            depositDate: data.depositDate
              ? data.depositDate.toDate
                ? data.depositDate.toDate().toISOString()
                : data.depositDate
              : "",
            minimumInvestment: data.minimumInvestment || 0,
            maximumInvestment: data.maximumInvestment || 0,
            status: data.status || "closed",
            depositsOpen: data.depositsOpen || false,
            isVisible: data.isVisible || false,
            isFeatured: data.isFeatured || false,
            strategy: data.strategy || "",
            contractAddress: data.contractAddress,
            apiId: data.apiId,
            isRealTime: data.isRealTime || false,
            performancePercent: data.performancePercent || 0,
            totalAssetsUnderManagement: data.totalAssetsUnderManagement || 0,
            aiTradingPerformancePercent: data.aiTradingPerformancePercent || 0,
            fundPerformancePercentage: data.fundPerformancePercentage || 0,
            tradingPerformancePercentage:
              data.tradingPerformancePercentage || 0,
            totalAssetsValue: data.totalAssetsValue || 0,
            // Convert Firestore metadata timestamps
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt
              : undefined,
            updatedAt: data.updatedAt
              ? data.updatedAt.toDate
                ? data.updatedAt.toDate().toISOString()
                : data.updatedAt
              : undefined,
          };

          fundsData.push(fund);
        });

        setRawFunds(fundsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useFunds] Error fetching funds:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log("[useFunds] Cleaning up listener");
      unsubscribe();
    };
  }, []);

  // Fetch performance data for all funds
  useEffect(() => {
    async function fetchPerformanceForAllFunds() {
      console.log("[useFunds] Fetching performance data for all funds");

      try {
        const newPerformanceData = await fetchAllFundsPerformance();
        setPerformanceData(newPerformanceData);

        console.log("[useFunds] Performance data updated:", {
          totalEntries: newPerformanceData.size,
          funds: Array.from(newPerformanceData.keys()),
        });
      } catch (error) {
        console.error("[useFunds] Failed to fetch performance data:", error);
        // Don't set error state, just log it - performance data is supplementary
      }
    }

    // Initial fetch when component mounts
    fetchPerformanceForAllFunds();

    // Set up periodic refresh for real-time performance data (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchPerformanceForAllFunds();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Run once on mount and then on interval

  // Enrich funds with real-time performance data
  const enrichedFunds = useMemo(() => {
    console.log("[useFunds] Enriching funds with performance data:", {
      fundsCount: rawFunds.length,
      performanceDataCount: performanceData.size,
      availablePerformanceKeys: Array.from(performanceData.keys()),
    });

    return rawFunds.map((fund) => {
      // Try to find performance data for this fund using multiple lookup strategies
      let fundPerformanceData: FundPerformanceApiResponse | undefined;

      // Strategy 1: Look up by apiId if available
      if (fund.apiId && performanceData.has(fund.apiId)) {
        fundPerformanceData = performanceData.get(fund.apiId);
        console.log(
          `[useFunds] Found performance data for fund ${fund.name} via apiId: ${fund.apiId}`
        );
      }

      // Strategy 2: Look up by contractAddress if apiId lookup failed
      if (
        !fundPerformanceData &&
        fund.contractAddress &&
        performanceData.has(fund.contractAddress.toLowerCase())
      ) {
        fundPerformanceData = performanceData.get(
          fund.contractAddress.toLowerCase()
        );
        console.log(
          `[useFunds] Found performance data for fund ${fund.name} via contractAddress: ${fund.contractAddress}`
        );
      }

      // Strategy 3: Look up by fund name matching (fallback)
      if (!fundPerformanceData) {
        for (const [key, perfData] of performanceData) {
          if (
            perfData.fundName &&
            fund.name &&
            perfData.fundName.toLowerCase().includes(fund.name.toLowerCase())
          ) {
            fundPerformanceData = perfData;
            console.log(
              `[useFunds] Found performance data for fund ${fund.name} via name matching: ${perfData.fundName}`
            );
            break;
          }
        }
      }

      // If we found performance data, enrich the fund
      if (fundPerformanceData) {
        console.log(
          `[useFunds] Enriching fund ${fund.name} with performance:`,
          {
            fundPerformancePercent: fundPerformanceData.fundPerformancePercent,
            aiTradingPerformancePercent:
              fundPerformanceData.aiTradingPerformancePercent,
            totalAssetsUnderManagement:
              fundPerformanceData.totalAssetsUnderManagement,
          }
        );

        return {
          ...fund,
          fundPerformancePercentage:
            fundPerformanceData.fundPerformancePercent ??
            fund.fundPerformancePercentage ??
            0,
          tradingPerformancePercentage:
            fundPerformanceData.aiTradingPerformancePercent ??
            fund.tradingPerformancePercentage ??
            0,
          totalAssetsValue:
            fundPerformanceData.totalAssetsUnderManagement ??
            fund.totalAssetsValue ??
            0,
          performancePercent:
            fundPerformanceData.fundPerformancePercent ??
            fund.performancePercent ??
            0,
          totalAssetsUnderManagement:
            fundPerformanceData.totalAssetsUnderManagement ??
            fund.totalAssetsUnderManagement ??
            0,
          aiTradingPerformancePercent:
            fundPerformanceData.aiTradingPerformancePercent ??
            fund.aiTradingPerformancePercent ??
            0,
        };
      }

      // Return fund as-is if no performance data found
      console.log(
        `[useFunds] No performance data found for fund ${fund.name} (apiId: ${fund.apiId}, contractAddress: ${fund.contractAddress})`
      );
      return fund;
    });
  }, [rawFunds, performanceData]);

  // Filter for featured funds (max 2)
  const featuredFunds = useMemo(() => {
    return enrichedFunds.filter((fund) => fund.isFeatured === true).slice(0, 2); // Limit to maximum 2 featured funds
  }, [enrichedFunds]);

  return {
    funds: enrichedFunds,
    featuredFunds,
    isLoading,
    error,
  };
}

/**
 * Hook to get a specific fund by ID with real-time updates
 */
export function useFund(fundId: string): {
  fund: Fund | null;
  isLoading: boolean;
  error: string | null;
} {
  const { funds, isLoading, error } = useFunds();

  const fund = funds.find((f) => f.id === fundId) || null;

  return {
    fund,
    isLoading,
    error,
  };
}
