"use client";

import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HistoricalPeakAnalysisData } from "@/hooks/use-historical-peak-analysis";

interface PeakHistoricalAnalysisModalProps {
  analysis: HistoricalPeakAnalysisData;
  isOpen: boolean;
  onClose: () => void;
}

export function PeakHistoricalAnalysisModal({
  analysis,
  isOpen,
  onClose,
}: PeakHistoricalAnalysisModalProps) {
  if (!isOpen) return null;

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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
        return "text-green-500";
      case "TAKE PROFITS":
        return "text-yellow-500";
      case "HOLYF$%K":
        return "text-orange-500";
      case "ONE WAY DOWN":
        return "text-red-500";
      default:
        return "text-zinc-500";
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    if (score >= 20) return "text-green-500";
    return "text-green-500";
  };

  const marketSignal = getPeakMarketSignal(analysis.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Historical Market Peak Analysis
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-300">
            {formatTimestamp(analysis.timestamp)}
          </span>
        </div>

        {/* Score and Signal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Peak Score */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-zinc-300">
                Market Peak Score
              </span>
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}
            >
              {Math.round(analysis.score)}
            </div>
          </div>

          {/* Market Signal */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-zinc-300">
                Market Signal
              </span>
            </div>
            <div
              className={`text-3xl font-semibold ${getSignalColor(
                marketSignal
              )}`}
            >
              {marketSignal}
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Analysis</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        {/* Key Factors */}
        {analysis.keyFactors && analysis.keyFactors.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">
              Key Factors
            </h3>
            <div className="space-y-3 ml-2">
              {analysis.keyFactors.map((factor, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-zinc-200 leading-relaxed text-sm font-medium group-hover:text-white transition-colors duration-200">
                    {factor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {analysis.reasoning &&
          (Array.isArray(analysis.reasoning)
            ? analysis.reasoning.length > 0
            : analysis.reasoning.trim().length > 0) && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Reasoning
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {Array.isArray(analysis.reasoning)
                  ? analysis.reasoning.join(" ")
                  : analysis.reasoning}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
