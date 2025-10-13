"use client";

import { useImprovedAuth } from "@/providers/authentication";
import { useHomeSSEContext } from "@/contexts/home-sse-context";
import { Lock, AlertTriangle } from "lucide-react";

interface PrimaryRiskFactorsProps {
  className?: string;
}

export function PrimaryRiskFactors({
  className = "",
}: PrimaryRiskFactorsProps) {
  const { data, isLoading, error } = useHomeSSEContext();
  const { accountType } = useImprovedAuth();

  const isProUser = accountType === "pro" || accountType === "alpha";
  const riskFactors = data?.blackswan?.primaryRiskFactors;

  // Don't render if no risk factors data
  if (!riskFactors || riskFactors.length === 0) {
    return null;
  }

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-zinc-700 rounded"></div>
          <div className="w-44 h-6 bg-zinc-700 rounded"></div>
          <div className="w-4 h-4 bg-zinc-700 rounded"></div>
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
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-semibold text-white flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Primary Risk Factors
        </h4>
      </div>
      <div className="p-4 bg-zinc-800/40 border border-zinc-700/30 rounded-lg text-center">
        <AlertTriangle className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Unable to load risk factors</p>
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
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Primary Risk Factors
            </h4>
          </div>

          <div className="space-y-3 ml-2">
            {riskFactors.map((factor, index) => {
              const bulletColors = ["bg-red-400"];
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
