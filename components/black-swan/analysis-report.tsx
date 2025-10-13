"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useHomeSSEContext } from "@/contexts/home-sse-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AnalysisReport() {
  const { data, isLoading, error, isReconnecting } = useHomeSSEContext();
  // Trigger periodic re-render so relative time stays fresh
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000); // update every 30s
    return () => clearInterval(id);
  }, []);

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-40 h-6 bg-zinc-700 rounded"></div>
          <div className="w-32 h-6 bg-zinc-700 rounded-full"></div>
        </div>
        <div className="w-24 h-4 bg-zinc-700 rounded"></div>
      </div>

      {/* Analysis content skeleton */}
      <div className="mt-6 space-y-4">
        <div className="w-full h-6 bg-zinc-700 rounded"></div>
        <div className="w-full h-6 bg-zinc-700 rounded"></div>
        <div className="w-full h-6 bg-zinc-700 rounded"></div>
        <div className="w-4/5 h-6 bg-zinc-700 rounded"></div>
        <div className="w-full h-6 bg-zinc-700 rounded"></div>
        <div className="w-3/4 h-6 bg-zinc-700 rounded"></div>
      </div>
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h4 className="text-lg font-medium text-white mb-2">
          Analysis Unavailable
        </h4>
        <p className="text-sm text-zinc-400">
          Unable to load current analysis data
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <SkeletonLoader />
      ) : error ? (
        <ErrorState />
      ) : data?.blackswan ? (
        <>
          {/* Current Analysis - Accordion Format */}
          <div className="pt-6">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="current-analysis"
            >
              <AccordionItem
                value="current-analysis"
                className="border border-zinc-700/30 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-all duration-300 overflow-hidden"
              >
                <AccordionTrigger className="text-xl font-semibold text-white hover:text-zinc-200 hover:no-underline px-6 py-4 [&[data-state=open]]:pb-2 transition-all duration-300">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full pr-4">
                    <span>Current Analysis</span>
                    {/* Confidence Badge */}
                    <div
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-full border whitespace-nowrap ${
                        data.blackswan.confidence === "high"
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : data.blackswan.confidence === "medium"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                          : data.blackswan.confidence === "low"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                      }`}
                    >
                      <span className="hidden sm:inline">
                        {String(
                          data.blackswan.confidence || "UNKNOWN"
                        ).toUpperCase()}{" "}
                        CONFIDENCE
                      </span>
                      <span className="sm:hidden">
                        {String(
                          data.blackswan.confidence || "UNK"
                        ).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0">
                  <div className="space-y-4">
                    <div className="pt-2">
                      <p className="text-sm font-medium leading-relaxed text-zinc-100 tracking-wide">
                        {data.blackswan.analysis}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="text-lg font-medium text-white mb-2">
              No Analysis Available
            </h4>
            <p className="text-sm text-zinc-400">No analysis data available</p>
          </div>
        </div>
      )}
    </div>
  );
}
