"use client";

import { useHomeSSEContext } from "@/contexts/home-sse-context";
import { Key, Lightbulb } from "lucide-react";

interface KeyFactorsProps {
  className?: string;
}

export function KeyFactors({ className = "" }: KeyFactorsProps) {
  const { data, isLoading, error } = useHomeSSEContext();
  const keyFactors = data?.peak?.keyFactors;

  // Don't render if no key factors data
  if (!keyFactors || keyFactors.length === 0) {
    return null;
  }

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-zinc-700 rounded"></div>
          <div className="w-32 h-6 bg-zinc-700 rounded"></div>
        </div>
      </div>
      <div className="space-y-3 ml-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
          <div className="w-full h-4 bg-zinc-600 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
          <div className="w-5/6 h-4 bg-zinc-600 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
          <div className="w-4/5 h-4 bg-zinc-600 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
          <div className="w-3/4 h-4 bg-zinc-600 rounded"></div>
        </div>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-semibold text-white flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400" />
          Key Factors
        </h4>
      </div>
      <div className="p-4 bg-zinc-800/40 border border-zinc-700/30 rounded-lg text-center">
        <Lightbulb className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Unable to load key factors</p>
      </div>
    </div>
  );

  return (
    <div>
      {isLoading ? (
        <SkeletonLoader />
      ) : error ? (
        <ErrorState />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-white flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-blue-400" />
              Key Factors
            </h4>
          </div>
          <div className="space-y-3 ml-2">
            {keyFactors.map((factor, index) => {
              // Cycle through colors for visual variety
              const bulletColors = ["bg-blue-400"];
              const bulletColor = bulletColors[index % bulletColors.length];

              return (
                <div key={index} className="flex items-start gap-3 group">
                  <div
                    className={`w-2 h-2 rounded-full ${bulletColor} mt-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                  />
                  <span className="text-zinc-200 leading-relaxed text-sm font-medium group-hover:text-white transition-colors duration-200">
                    {factor}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
