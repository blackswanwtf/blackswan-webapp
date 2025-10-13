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

export function PeakAnalysisReport() {
  const { data, isLoading, error } = useHomeSSEContext();
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
        <div className="w-40 h-6 bg-zinc-700 rounded"></div>
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
          Unable to load current market peak analysis data
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
      ) : data?.peak ? (
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
                  <span>Current Analysis</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0">
                  <div className="space-y-4">
                    <div className="pt-2">
                      <p className="text-sm font-medium leading-relaxed text-zinc-100 tracking-wide">
                        {data.peak.summary}
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
            <p className="text-sm text-zinc-400">
              No peak analysis data available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
