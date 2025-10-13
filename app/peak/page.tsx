"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageTemplate } from "@/components/page-template";
import { PeakMarketSlider } from "@/components/black-swan/peak-market-slider";
import { PeakAnalysisReport } from "@/components/black-swan/peak-analysis-report";
import { PeakReasoning } from "@/components/black-swan/peak-reasoning";
import { KeyFactors } from "@/components/black-swan/key-factors";
import { PeakHistoricalAnalysis } from "@/components/black-swan/peak-historical-analysis";
import { PeakAnalysisChart } from "@/components/black-swan/peak-analysis-chart";
import { useImprovedAuth } from "@/providers/authentication";
import {
  HomeSSEProvider,
  useHomeSSEContext,
} from "@/contexts/home-sse-context";
import { usePricingModal } from "@/contexts/pricing-modal";
import { Lock, Clock, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Clock className="w-4 h-4" />
        <span>
          {isLoading
            ? "Loading..."
            : error
            ? "Error"
            : data?.peak?.timestamp
            ? formatTimestamp(data.peak.timestamp)
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

// Component to display character image based on peak score
function PeakCharacterImage({ size }: { size: number }) {
  const { data, isLoading, error } = useHomeSSEContext();
  const currentScore = data?.peak?.score ?? 0;

  const getCharacterImage = (score: number) => {
    if (score >= 80) return "/avatars/peak/5.png"; // ONE WAY DOWN
    if (score >= 60) return "/avatars/peak/4.png"; // HOLYF$%K
    if (score >= 40) return "/avatars/peak/3.png"; // TAKE PROFITS
    if (score >= 20) return "/avatars/peak/2.png"; // BULL SZN
    return "/avatars/peak/1.png"; // CALM
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
      alt="Market Peak Status"
      width={size}
      height={size}
      className="object-contain"
    />
  );
}

export default function PeakPage() {
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
              Market Peak Analysis
            </h1>
            <p className="text-zinc-400 text-sm">
              AI agent swarm to monitor the market 24/7 for how close we are to
              a market peak.
            </p>
          </div>

          {/* 
            All components below use real-time Firestore data from the market_peak_analyses collection:
            - PeakScoreCard: Shows analysis.score
            - PeakMarketSlider: Converts peak score to market signal level  
            - PeakAnalysisReport: Shows analysis.score and analysis.analysis
            Data is filtered client-side to only use specific fields for security
          */}

          {/* Market Indicators and Risk Factors Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            <div className="lg:col-span-2">
              <div className="lg:hidden">
                <div className="flex items-center justify-center w-full">
                  <PeakCharacterImage size={250} />
                </div>
              </div>
              <div className="w-full space-y-4 mb-6">
                <MarketSignalWithTimestamp />
                <div className="flex-1">
                  <PeakMarketSlider />
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start gap-x-4 gap-y-8 w-full">
                <KeyFactors />
              </div>
              <div className="w-full">
                <PeakAnalysisReport />
                <PeakReasoning />
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <div className="hidden lg:block">
                <div className="w-full flex items-center justify-center">
                  <PeakCharacterImage size={500} />
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-white flex items-center gap-3">
                  <History className="w-5 h-5 text-white/90" />
                  Historical Analysis
                </h4>
              </div>
              <PeakHistoricalAnalysis />
            </div>
          </div>

          {/* Peak Score Trend Section */}
          <div className="pt-12 mb-8">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              Market Peak Score Trend
              {accountType === "free" && (
                <Lock className="w-5 h-5 text-zinc-400" />
              )}
            </h2>
            <p className="text-zinc-400 text-sm">
              View trends for the Market Peak Score for the last 30 days.
            </p>
          </div>

          {/* Peak Analysis Chart Component */}
          <div className="w-full">
            <PeakAnalysisChart />
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
