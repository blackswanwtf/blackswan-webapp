"use client";

import { HiArrowLongRight } from "react-icons/hi2";
import { useHomeSSEContext } from "@/contexts/home-sse-context";

interface MarketScoreCardProps {
  showExternalLink?: boolean;
}

export function MarketScoreCard({
  showExternalLink = false,
}: MarketScoreCardProps) {
  // Get real-time market status data from SSE context
  const { data, isLoading, error } = useHomeSSEContext();
  const marketSignal = data?.market?.signal || "HOLD";
  // const marketDescription = data?.market?.description || "AI Recommendation";
  const marketDescription = "AI Recommendation";

  const handleCardClick = () => {
    // Market status card doesn't have a dedicated page yet
    // Only handle click if showExternalLink is true and there's a destination
    if (showExternalLink) {
      // Add navigation logic here when market page is available
      console.log("Market status card clicked");
    }
  };

  // Color coding based on market signal
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "BUY":
        return "text-green-500";
      case "SELL":
        return "text-red-500";
      case "HOLD":
      default:
        return "text-yellow-500";
    }
  };

  const getSignalDescription = (signal: string) => {
    // Use the description from the API if available, otherwise fallback to static descriptions
    if (marketDescription && marketDescription !== "AI Recommendation") {
      return marketDescription;
    }

    switch (signal) {
      // case "BUY":
      //   return "Favorable Conditions";
      // case "SELL":
      //   return "Get Out ASAP!";
      // case "HOLD":
      default:
        return "AI Recommendation";
    }
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="flex-1 flex flex-col justify-center animate-pulse">
      {/* Signal skeleton - larger to match text-7xl */}
      <div className="w-32 h-20 bg-zinc-700 rounded-lg mb-2"></div>
      {/* Description skeleton */}
      <div className="w-40 h-4 bg-zinc-700 rounded mb-1"></div>
      {/* External link skeleton */}
      {showExternalLink && (
        <div className="flex items-center gap-1">
          <div className="w-20 h-4 bg-zinc-700 rounded"></div>
          <div className="w-6 h-6 bg-zinc-700 rounded"></div>
        </div>
      )}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">⚠️</span>
        </div>
        <h4 className="text-sm font-medium text-white mb-1">
          Unable to Load Signal
        </h4>
        <p className="text-xs text-zinc-400">
          Please check your connection and try again
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full relative transition-colors duration-200 ${
        showExternalLink ? "cursor-pointer hover:bg-zinc-900/70" : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="flex-1 flex flex-col justify-center h-full">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            <div
              className={`text-7xl font-bold mb-2 ${getSignalColor(
                marketSignal
              )}`}
            >
              {marketSignal}
            </div>
            <div className="text-sm font-medium text-zinc-300 mb-1">
              {marketDescription || getSignalDescription(marketSignal)}
            </div>
            {showExternalLink && (
              <div className="flex items-center gap-1 underline text-sm text-yellow-500 hover:text-yellow-400">
                <span>Learn More</span>
                <HiArrowLongRight className="w-6 h-6 mt-[2px]" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
