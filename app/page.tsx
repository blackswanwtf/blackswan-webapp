"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageTemplate } from "@/components/page-template";
import { useImprovedAuth } from "@/providers/authentication";
import { useAppKit } from "@reown/appkit/react";
import { usePricingModal } from "@/contexts/pricing-modal";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useHomeSSEContext } from "@/contexts/home-sse-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { SiFarcaster } from "react-icons/si";

export default function Home() {
  const router = useRouter();
  const { open } = useAppKit();
  const { isPricingModalOpen } = usePricingModal();
  const { isLoading: authLoading, isAuthenticated } = useImprovedAuth();
  const isLoggedIn = isAuthenticated;
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { data } = useHomeSSEContext();

  const blackswanScore = data?.blackswan?.score ?? 0;
  const peakScore = data?.peak?.score ?? 0;

  // Redirect authenticated users to dashboard
  // BUT prevent redirect if pricing modal is open (to avoid losing the sale)
  useEffect(() => {
    if (!authLoading && isLoggedIn && !isPricingModalOpen) {
      router.replace("/app");
    }
  }, [isLoggedIn, authLoading, router, isPricingModalOpen]);

  // Set the frame ready when all components are mounted and everything is done.
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Setting the score color
  const getScoreColor = (score: number) => {
    if (score <= 20) return "text-green-500";
    if (score <= 40) return "text-yellow-500";
    if (score <= 60) return "text-orange-500";
    if (score <= 80) return "text-red-500";
    return "text-red-600";
  };

  // Show loading while checking authentication for logged in users
  if (!authLoading && isLoggedIn) {
    return (
      <PageTemplate className="bg-black">
        <div className="flex flex-1 flex-col items-center justify-center p-4 lg:p-8 min-h-[calc(100vh-4rem)] sm:min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <>
      <PageTemplate className="bg-homepage-gradient">
        {/* HERO - Centered title/subtitle with scattered collage and inline scores */}
        <section className="relative flex items-center justify-center px-4 lg:px-8 min-h-[calc(100vh-4rem)] sm:min-h-screen overflow-hidden">
          {/* Top-right CTA */}
          {!isLoggedIn && (
            <div className="hidden absolute top-6 right-4 md:right-8 md:flex flex-row gap-2">
              <button
                className="bg-zinc-800/60 hover:bg-zinc-700/70 text-white border border-zinc-600/40 hover:border-zinc-500/60 px-3 py-1.5 flex items-center gap-1.5 rounded-md"
                onClick={() =>
                  window.open("https://x.com/blackswanwtf", "_blank")
                }
              >
                <FaXTwitter className="w-5 h-5" />
              </button>
              <button
                className="bg-zinc-800/60 hover:bg-zinc-700/70 text-white border border-zinc-600/40 hover:border-zinc-500/60 px-3 py-1.5 flex items-center gap-1.5 rounded-md"
                onClick={() =>
                  window.open("https://farcaster.xyz/blackswanwtf", "_blank")
                }
              >
                <SiFarcaster className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => open()}
                className="bg-white text-black hover:bg-white/90 transition-all duration-200 px-5 py-2.5 rounded-md font-semibold z-20"
              >
                Login
              </button>
            </div>
          )}
          <div className="w-full max-w-5xl text-center relative z-10 py-12">
            {/* One Month Free Access CTA */}
            <div className="mb-8 flex justify-center">
              <div
                className="group relative bg-zinc-800/80 hover:bg-zinc-800/80 border border-2 border-green-400/80 hover:border-green-400/80 backdrop-blur-sm rounded-full px-8 py-3 pl-16 transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => open()}
              >
                {/* Overlaying character image */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
                  <Image
                    src="/avatars/hero/2.png"
                    alt="Celebrating character"
                    width={80}
                    height={80}
                    className="rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 drop-shadow-lg"
                  />
                </div>

                <span className="text-white font-semibold text-sm md:text-base tracking-wide relative z-20 pl-6">
                  Free Upgrade Offer Inside
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 leading-tight pb-2">
              Know when to Sell.
              <br />
              Whatever the market.
            </h1>
            <p className="mt-5 text-base md:text-lg text-zinc-400 max-w-3xl mx-auto">
              AI Agents working 24/7 to analyse your tokens, the market and
              global events to ensure you sell before everyone else.
            </p>
            {/* Score cards under title */}
            <div className="mt-8 w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Blackswan card */}
              <div className="group relative overflow-visible rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur p-6 md:p-8 hover:bg-zinc-900/70 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Image
                      // src={`/avatars/blackswan/${Math.min(
                      //   5,
                      //   Math.max(1, Math.ceil(blackswanScore / 20))
                      // )}.png`}
                      src={`/avatars/blackswan/5.png`}
                      alt="Black Swan Score"
                      width={120}
                      height={120}
                      className="rounded-xl transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-400 mb-1 flex items-center justify-center gap-2">
                      <span>Black Swan</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-zinc-300 hover:text-white focus:outline-none"
                              aria-label="What is Black Swan score?"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-xs leading-snug"
                          >
                            Likelihood of an extreme market event in progress.
                            Out of 100. Lower is better.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div
                      className={`text-6xl md:text-7xl font-black leading-none tracking-tight ${getScoreColor(
                        blackswanScore
                      )}`}
                    >
                      {Math.round(blackswanScore)}
                    </div>
                  </div>
                </div>
                {/* Subtle glow effect */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent" />
              </div>

              {/* Peak card */}
              <div className="group relative overflow-visible rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur p-6 md:p-8 hover:bg-zinc-900/70 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Image
                      // src={`/avatars/peak/${Math.min(
                      //   5,
                      //   Math.max(1, Math.ceil(peakScore / 20))
                      // )}.png`}
                      src={`/avatars/peak/5.png`}
                      alt="Market Peak Score"
                      width={120}
                      height={120}
                      className="rounded-xl transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-400 mb-1 flex items-center justify-center gap-2">
                      <span>Market Peak</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-zinc-300 hover:text-white focus:outline-none"
                              aria-label="What is Market Peak score?"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-xs leading-snug"
                          >
                            Has the market peaked? AI model built to tell you
                            when to sell. Out of 100. The higher it goes, the
                            closer to peak.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div
                      className={`text-6xl md:text-7xl font-black leading-none tracking-tight ${getScoreColor(
                        peakScore
                      )}`}
                    >
                      {Math.round(peakScore)}
                    </div>
                  </div>
                </div>
                {/* Subtle glow effect */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent" />
              </div>
            </div>
          </div>

          {/* Scattered collage around the hero */}
          <div className="pointer-events-none absolute inset-0 z-0">
            {/* Desktop */}
            <Image
              src="/avatars/blackswan/1.png"
              alt=""
              width={110}
              height={110}
              className="hidden md:block absolute left-[4%] top-[20%] rotate-[-8deg] drop-shadow-xl opacity-85 animate-bob-slow tilt-hover"
            />
            <Image
              src="/avatars/blackswan/3.png"
              alt=""
              width={95}
              height={95}
              className="hidden md:block absolute left-[8%] bottom-[22%] rotate-[6deg] drop-shadow-xl opacity-85 animate-bob-slower tilt-hover"
            />
            <Image
              src="/avatars/peak/2.png"
              alt=""
              width={105}
              height={105}
              className="hidden md:block absolute right-[5%] top-[18%] rotate-[10deg] drop-shadow-xl opacity-85 animate-bob-slower tilt-hover"
            />
            <Image
              src="/avatars/peak/4.png"
              alt=""
              width={100}
              height={100}
              className="hidden md:block absolute right-[3%] bottom-[20%] rotate-[-7deg] drop-shadow-xl opacity-85 animate-bob-slow tilt-hover"
            />
            <Image
              src="/avatars/pricing/1.png"
              alt=""
              width={100}
              height={74}
              className="hidden md:block absolute left-[20%] top-[7%] rotate-[8deg] opacity-70 animate-bob-slow tilt-hover"
            />
            <Image
              src="/avatars/pricing/2.png"
              alt=""
              width={115}
              height={68}
              className="hidden md:block absolute right-[25%] bottom-[12%] rotate-[-8deg] opacity-70 animate-bob-slower tilt-hover"
            />
          </div>
        </section>
      </PageTemplate>
    </>
  );
}
