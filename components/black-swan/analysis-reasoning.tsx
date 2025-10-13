"use client";

import { useImprovedAuth } from "@/providers/authentication";
import { Lock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AnalysisReasoningProps {
  reasoning: string | string[] | undefined;
  analysisType: "BlackSwan" | "Peak Market";
  className?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function AnalysisReasoning({
  reasoning,
  analysisType,
  className = "",
  isLoading = false,
  error = null,
}: AnalysisReasoningProps) {
  const { accountType } = useImprovedAuth();

  const isProUser = accountType === "pro" || accountType === "alpha";

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="border border-zinc-700/30 rounded-lg bg-zinc-800/40 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-24 h-6 bg-zinc-700 rounded"></div>
            {!isProUser && <div className="w-5 h-5 bg-zinc-700 rounded"></div>}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="w-full h-4 bg-zinc-700 rounded"></div>
          <div className="w-full h-4 bg-zinc-700 rounded"></div>
          <div className="w-4/5 h-4 bg-zinc-700 rounded"></div>
          <div className="w-full h-4 bg-zinc-700 rounded"></div>
          <div className="w-3/4 h-4 bg-zinc-700 rounded"></div>
        </div>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="border border-zinc-700/30 rounded-lg bg-zinc-800/40 p-6">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">💭</span>
        </div>
        <h4 className="text-sm font-medium text-white mb-1">
          Unable to Load Reasoning
        </h4>
        <p className="text-xs text-zinc-400">
          Analysis reasoning temporarily unavailable
        </p>
      </div>
    </div>
  );

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`pt-6 ${className}`}>
        <SkeletonLoader />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`pt-6 ${className}`}>
        <ErrorState />
      </div>
    );
  }

  // Don't render if no reasoning data
  if (
    !reasoning ||
    (Array.isArray(reasoning)
      ? reasoning.length === 0
      : reasoning.trim().length === 0)
  ) {
    return null;
  }

  return (
    <div className={`pt-6 ${className}`}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="reasoning"
          className="border border-zinc-700/30 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-all duration-300 overflow-hidden"
        >
          <AccordionTrigger className="text-xl font-semibold text-white hover:text-zinc-200 hover:no-underline px-6 py-4 [&[data-state=open]]:pb-2 transition-all duration-300">
            <div className="flex items-center gap-3">
              <span>Reasoning</span>
              {!isProUser && (
                <Lock className="w-5 h-5 text-zinc-400 transition-colors duration-300" />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-0">
            {isProUser ? (
              <div className="space-y-4">
                <div className="pt-2">
                  <p className="text-sm font-medium leading-relaxed text-zinc-100 tracking-wide">
                    {Array.isArray(reasoning) ? reasoning.join(" ") : reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <p className="text-zinc-400 text-sm italic flex items-center gap-2">
                  Upgrade to Pro to access detailed reasoning analysis.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
