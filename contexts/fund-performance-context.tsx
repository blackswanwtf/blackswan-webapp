"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  useFundPerformance,
  FundPerformanceData,
} from "@/hooks/use-fund-performance";
import { useUserPerformance } from "@/hooks/use-user-performance";
import { useImprovedAuth } from "@/providers/authentication";

interface FundPerformanceContextType {
  // Fund performance data
  data: FundPerformanceData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  totalAssetsUnderManagement: number;
  fundPerformancePercent: number;
  aiTradingPerformancePercent: number;
  lastUpdated: string | undefined;
  targetFund?: any;

  // User performance data
  userPerformance: {
    data: any;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
    totalMoneyIn: number;
    totalExpectedOut: number;
    totalWithdrawn: number;
    profitAmount: number;
    profitPercentage: number;
    hasInvestment: boolean;
    hasScoutAIV2Investment: boolean;
    userAddress?: string;
    lastUpdated?: string;
  };
}

const FundPerformanceContext = createContext<
  FundPerformanceContextType | undefined
>(undefined);

export function FundPerformanceProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useImprovedAuth();
  const fundId = "v2"; // ScoutAI V2 fund ID
  const fundPerformance = useFundPerformance(fundId);
  const userPerformance = useUserPerformance(currentUser?.uid || null, fundId);

  console.log("[FundPerformanceContext] Provider render", {
    hasData: !!fundPerformance.data,
    isLoading: fundPerformance.isLoading,
    timestamp: fundPerformance.data?.timestamp,
    fundName: fundPerformance.data?.fundName,
    fundPerformancePercent: fundPerformance.data?.fundPerformancePercent,
    aiTradingPerformancePercent:
      fundPerformance.data?.aiTradingPerformancePercent,
    hasUserInvestment: userPerformance.hasInvestment,
    userInvestmentAmount: userPerformance.totalMoneyIn,
  });

  const contextValue = {
    ...fundPerformance,
    userPerformance,
  };

  return (
    <FundPerformanceContext.Provider value={contextValue}>
      {children}
    </FundPerformanceContext.Provider>
  );
}

export function useFundPerformanceContext(): FundPerformanceContextType {
  const context = useContext(FundPerformanceContext);
  if (context === undefined) {
    throw new Error(
      "useFundPerformanceContext must be used within a FundPerformanceProvider"
    );
  }
  return context;
}
