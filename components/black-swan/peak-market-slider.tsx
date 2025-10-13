"use client";

import { useHomeSSEContext } from "@/contexts/home-sse-context";
import { ArrowBigUp, ArrowBigDown, ChevronsDownUp } from "lucide-react";

export function PeakMarketSlider() {
  const { data, isLoading, error } = useHomeSSEContext();

  // Convert peak score to slider position (0-100 scale)
  const currentLevel = data?.peak?.score ?? 0;
  const scoreChange = data?.peak?.change ?? 0;

  const getCurrentLabel = (score: number) => {
    if (score >= 80) return "ONE WAY DOWN";
    if (score >= 60) return "HOLYF$%K";
    if (score >= 40) return "TAKE PROFITS";
    if (score >= 20) return "BULL SZN";
    return "CALM";
  };

  const getCurrentColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-red-500";
    if (score >= 40) return "text-orange-500";
    if (score >= 20) return "text-yellow-500";
    return "text-green-500";
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse h-full flex flex-col justify-center">
      {/* Top row - Signal label and score/change */}
      <div className="flex items-center justify-between mb-1">
        <div className="w-40 h-10 bg-zinc-700 rounded"></div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 bg-zinc-700 rounded"></div>
          <div className="w-12 h-6 bg-zinc-700 rounded"></div>
        </div>
      </div>

      {/* Slider track skeleton */}
      <div className="space-y-1">
        <div className="relative w-full mt-4 mb-2">
          <div className="relative w-full h-3 rounded-full bg-zinc-700"></div>
          {/* Indicator skeleton */}
          <div
            className="absolute w-6 h-6 bg-zinc-600 rounded-full"
            style={{ left: "30%", top: "-6px" }}
          ></div>
        </div>

        {/* Labels skeleton */}
        <div className="flex justify-between">
          <div className="w-8 h-3 bg-zinc-700 rounded"></div>
          <div className="w-8 h-3 bg-zinc-700 rounded"></div>
          <div className="w-8 h-3 bg-zinc-700 rounded"></div>
          <div className="w-8 h-3 bg-zinc-700 rounded"></div>
          <div className="w-8 h-3 bg-zinc-700 rounded"></div>
        </div>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">📊</span>
        </div>
        <h4 className="text-sm font-medium text-white mb-1">
          Unable to Load Signal
        </h4>
        <p className="text-xs text-zinc-400">
          Market Peak data temporarily unavailable
        </p>
      </div>
    </div>
  );

  const currentScore = data?.peak?.score ?? 0;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full">
      <div className="flex flex-col justify-center h-full">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            {/* Top row - Signal label and score/change */}
            <div className="flex items-center justify-between mb-1">
              {/* Current Signal - Hero Data Point */}
              <div
                className={`text-2xl sm:text-4xl font-bold ${getCurrentColor(
                  currentLevel
                )}`}
              >
                {getCurrentLabel(currentLevel)}
              </div>

              {/* Score and Change Display */}
              <div className="flex items-center gap-1">
                <div className="text-right">
                  <div
                    className={`text-6xl font-bold ${getCurrentColor(
                      currentLevel
                    )}`}
                  >
                    {Math.round(currentLevel)}
                  </div>
                </div>
                {scoreChange !== undefined && scoreChange !== null && (
                  <div
                    className={`flex items-center ${
                      scoreChange > 0
                        ? "text-red-500"
                        : scoreChange < 0
                        ? "text-green-500"
                        : "text-zinc-500"
                    }`}
                  >
                    {scoreChange > 0 ? (
                      <ArrowBigUp className="w-6 h-6" fill="#EF4444" />
                    ) : scoreChange < 0 ? (
                      <ArrowBigDown className="w-6 h-6" fill="#22C55E" />
                    ) : (
                      <ChevronsDownUp className="w-6 h-6" />
                    )}
                    {scoreChange !== 0 && (
                      <span className="text-3xl font-bold ml-1">
                        {Math.abs(Math.round(scoreChange * 100) / 100)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Visual Slider */}
            <div className="space-y-1">
              {/* Main Slider Track with proper spacing for indicator */}
              <div className="relative w-full mt-4 mb-2">
                <div className="relative w-full h-3 rounded-full overflow-hidden bg-zinc-800/50 border border-zinc-700/50">
                  {/* Full Color Gradient Background - Always Visible */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 rounded-full" />
                </div>

                {/* Position Indicator - Positioned above the track */}
                <div
                  className="absolute w-6 h-6 bg-white rounded-full border-2 border-zinc-900 shadow-lg transition-all duration-500 ease-out z-10"
                  style={{
                    left: `calc(${currentLevel}% - 8px)`,
                    top: `-6px`,
                    boxShadow: `0 0 15px ${getCurrentColor(
                      currentScore
                    ).replace("text-", "")}`,
                  }}
                />
              </div>

              {/* Peak Level Labels */}
              <div className="flex justify-between text-[9px] md:text-xs">
                <div className="text-center">
                  <span className="text-green-400 font-medium">CALM</span>
                </div>
                <div className="text-center">
                  <span className="text-yellow-400 font-medium">BULL SZN</span>
                </div>
                <div className="text-center">
                  <span className="text-orange-400 font-medium">
                    TAKE PROFITS
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-red-400 font-medium">HOLYF$%K</span>
                </div>
                <div className="text-center">
                  <span className="text-red-500 font-medium">ONE WAY DOWN</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
