"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageTemplate } from "@/components/page-template";
import { BlackswanScoreCard } from "@/components/black-swan/blackswan-score-card";
import { HoldSellSlider } from "@/components/black-swan/hold-sell-slider";
import { AnalysisReport } from "@/components/black-swan/analysis-report";
import { BlackSwanReasoning } from "@/components/black-swan/blackswan-reasoning";
import { CurrentMarketIndicators } from "@/components/black-swan/current-market-indicators";
import { PrimaryRiskFactors } from "@/components/black-swan/primary-risk-factors";
import { SwanHistoricalAnalysis } from "@/components/black-swan/swan-historical-analysis";
import { HistoricalAnalysisChart } from "@/components/black-swan/historical-analysis-chart";
import { useImprovedAuth } from "@/providers/authentication";
import {
  HomeSSEProvider,
  useHomeSSEContext,
} from "@/contexts/home-sse-context";
import { usePricingModal } from "@/contexts/pricing-modal";
import { Lock, Clock, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Component to display character image based on blackswan score
function BlackswanCharacterImage({ size }: { size: number }) {
  const { data, isLoading, error } = useHomeSSEContext();
  const currentScore = data?.blackswan?.score ?? 0;

  const getCharacterImage = (score: number) => {
    if (score >= 80) return "/avatars/blackswan/5.png"; // GTFO
    if (score >= 60) return "/avatars/blackswan/4.png"; // SELL
    if (score >= 40) return "/avatars/blackswan/3.png"; // SHAKY
    if (score >= 20) return "/avatars/blackswan/2.png"; // CAUTION
    return "/avatars/blackswan/1.png"; // GOOD TIMES
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <div
            className="bg-zinc-700 rounded-lg relative overflow-hidden"
            style={{
              width: size == 500 ? size - 150 : size,
              height: size == 500 ? size - 150 : size,
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-zinc-400">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm mt-2">Unable to load character</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={getCharacterImage(currentScore)}
      alt="Black Swan Status"
      width={size}
      height={size}
      className="object-contain"
    />
  );
}

// Component to display timestamp in Market Signal
function MarketSignalWithTimestamp() {
  const { data, isLoading, error, isReconnecting } = useHomeSSEContext();
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000); // update every 30s
    return () => clearInterval(id);
  }, []);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number) => {
    const now = nowTs;
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold text-white">Market Signal</h3>
      <div className="flex items-center gap-1 text-xs sm:text-sm text-zinc-400">
        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>
          {isLoading
            ? "Loading..."
            : error
            ? "Error"
            : data?.blackswan?.timestamp
            ? formatTimestamp(data.blackswan.timestamp)
            : "No data"}
        </span>
        {isReconnecting && (
          <span className="text-xs text-yellow-400 animate-pulse">
            • Reconnecting
          </span>
        )}
      </div>
    </div>
  );
}

export default function AppPage() {
  const router = useRouter();
  const { isPricingModalOpen } = usePricingModal();
  const {
    hasReferralCode,
    isLoading: authLoading,
    isAuthenticated,
    accountType,
  } = useImprovedAuth();
  const isLoggedIn = isAuthenticated;

  // Route protection: redirect if not authenticated
  // BUT prevent redirect if pricing modal is open (to avoid losing the sale)
  useEffect(() => {
    if (!authLoading && !isPricingModalOpen) {
      if (!isLoggedIn) {
        // Not logged in - redirect to home
        router.replace("/");
        return;
      }
    }
  }, [isLoggedIn, authLoading, router, isPricingModalOpen]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <PageTemplate className="bg-black">
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:p-8 min-h-[calc(100vh-4rem)] md:min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </PageTemplate>
    );
  }

  // Don't render if user is not logged in (while redirecting)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <PageTemplate className="bg-black">
      <div className="flex flex-1 flex-col p-4 lg:p-8 min-h-[calc(100vh-4rem)] md:min-h-screen">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Back Navigation */}
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-2 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">
              Black Swan Analysis
            </h1>
            <p className="text-zinc-400 text-sm">
              AI agent swarm to monitor the market 24/7 for any major events.
            </p>
          </div>

          {/* 
            All components below now use real-time Firestore data from the blackswan_events collection:
            - BlackswanScoreCard: Shows analysis.black_swan_probability
            - HoldSellSlider: Converts black swan score to market signal level  
            - AnalysisReport: Shows analysis.confidence_level and analysis.fundamental_analysis
            Data is filtered client-side to only use specific fields for security
          */}

          {/* Market Indicators and Risk Factors Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            <div className="lg:col-span-2">
              <div className="lg:hidden">
                <div className="flex items-center justify-center w-full">
                  <BlackswanCharacterImage size={250} />
                </div>
              </div>
              <div className="w-full space-y-4 mb-6">
                <MarketSignalWithTimestamp />
                <div className="flex-1">
                  <HoldSellSlider />
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start gap-x-4 gap-y-8 w-full">
                <CurrentMarketIndicators />
                <PrimaryRiskFactors />
              </div>
              <div className="w-full">
                <AnalysisReport />
                <BlackSwanReasoning />
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <div className="hidden lg:block">
                <div className="w-full flex items-center justify-center">
                  <BlackswanCharacterImage size={500} />
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-white flex items-center gap-3">
                  <History className="w-5 h-5 text-white/90" />
                  Historical Analysis
                </h4>
              </div>
              <SwanHistoricalAnalysis />
            </div>
          </div>

          {/* Blackswan Score Trend Section */}
          <div className="pt-12 mb-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              Black Swan Score Trend
              {accountType === "free" && (
                <Lock className="w-5 h-5 text-zinc-400" />
              )}
            </h2>
            <p className="text-zinc-400 text-sm">
              View trends for the Black Swan Score for the last 30 days.
            </p>
          </div>

          {/* Historical Analysis Chart Component */}
          <div className="w-full">
            <HistoricalAnalysisChart />
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
