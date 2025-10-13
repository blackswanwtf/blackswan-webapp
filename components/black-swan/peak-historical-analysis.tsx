"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoricalPeakAnalysis } from "@/hooks/use-historical-peak-analysis";
import { useImprovedAuth } from "@/providers/authentication";
import { usePricingModal } from "@/contexts/pricing-modal";
import { PeakHistoricalAnalysisModal } from "./peak-historical-analysis-modal";
import type { HistoricalPeakAnalysisData } from "@/hooks/use-historical-peak-analysis";

export function PeakHistoricalAnalysis() {
  const { accountType } = useImprovedAuth();
  const { data, isLoading, error } = useHistoricalPeakAnalysis();
  const { openPricingModal } = usePricingModal();
  const [selectedAnalysis, setSelectedAnalysis] =
    useState<HistoricalPeakAnalysisData | null>(null);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPeakMarketSignal = (score: number): string => {
    if (score >= 80) return "ONE WAY DOWN";
    if (score >= 60) return "HOLYF$%K";
    if (score >= 40) return "TAKE PROFITS";
    if (score >= 20) return "BULL SZN";
    return "CALM";
  };

  const getSignalColor = (signal: string): string => {
    switch (signal) {
      case "CALM":
        return "text-green-500";
      case "BULL SZN":
        return "text-green-400";
      case "TAKE PROFITS":
        return "text-yellow-400";
      case "HOLYF$%K":
        return "text-orange-400";
      case "ONE WAY DOWN":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    if (score >= 20) return "text-green-400";
    return "text-green-500";
  };

  const handleAnalysisClick = (analysis: HistoricalPeakAnalysisData) => {
    setSelectedAnalysis(analysis);
    console.log("Selected Analysis: ", analysis);
  };

  const closeModal = () => {
    setSelectedAnalysis(null);
  };

  // Free user check - show upgrade prompt
  if (accountType === "free") {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h4 className="text-lg font-medium text-white mb-2">
            View Historical Market Peak Analysis
          </h4>
          <p className="text-sm text-zinc-400 mb-6 max-w-md">
            Access past market peak analysis and market signals to understand
            market cycle trends over time.
          </p>
          <Button
            onClick={openPricingModal}
            className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
          >
            Upgrade to Degen
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="animate-pulse">
            <div className="p-4 bg-zinc-800/40 border border-zinc-700/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-zinc-600 rounded"></div>
                  <div className="w-24 h-4 bg-zinc-600 rounded"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="w-20 h-4 bg-zinc-600 rounded mb-1"></div>
                    <div className="w-16 h-3 bg-zinc-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">⚠️</span>
        </div>
        <h4 className="text-sm font-medium text-white mb-1">
          Unable to Load Analysis
        </h4>
        <p className="text-xs text-zinc-400">
          Please check your connection and try again
        </p>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">📊</span>
        </div>
        <p className="text-sm text-zinc-400">
          No historical market peak analysis data available
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {data.map((analysis) => {
          const marketSignal = getPeakMarketSignal(analysis.score);

          return (
            <div
              key={analysis.id}
              onClick={() => handleAnalysisClick(analysis)}
              className="p-4 bg-zinc-800/40 border border-zinc-700/30 rounded-lg hover:bg-zinc-800/60 transition-colors duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <div className="text-sm text-white">
                    {formatTimestamp(analysis.timestamp)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${getSignalColor(
                        marketSignal
                      )}`}
                    >
                      {marketSignal}
                    </div>
                    <div className={`text-xs ${getScoreColor(analysis.score)}`}>
                      Score: {Math.round(analysis.score)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedAnalysis && (
        <PeakHistoricalAnalysisModal
          analysis={selectedAnalysis}
          isOpen={!!selectedAnalysis}
          onClose={closeModal}
        />
      )}
    </>
  );
}
