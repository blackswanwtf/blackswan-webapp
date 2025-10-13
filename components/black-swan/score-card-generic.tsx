"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowBigUp, ArrowBigDown, ChevronsDownUp, Clock } from "lucide-react";
import { HiArrowLongRight } from "react-icons/hi2";
import { useEffect, useState } from "react";

interface ScoreCardGenericProps {
  title: string;
  value: number;
  getColorClass: (value: number) => string;
  showExternalLink?: boolean;
  externalHref?: string;
  externalLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  change?: number;
  characterImage?: string;
  timestamp?: number;
}

export function ScoreCardGeneric({
  title,
  value,
  getColorClass,
  showExternalLink = true,
  externalHref,
  externalLabel,
  isLoading = false,
  error = null,
  change = 0,
  characterImage,
  timestamp,
}: ScoreCardGenericProps) {
  const router = useRouter();

  // Get current time every few intervals
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

  const handleCardClick = () => {
    if (showExternalLink && externalHref) {
      router.push(externalHref);
    }
  };

  const SkeletonLoader = () => (
    <div className="flex items-center justify-between h-full animate-pulse">
      {/* Left side skeleton */}
      <div className="flex-1">
        {/* Score and change indicator skeleton */}
        <div className="flex items-center justify-start flex-row mb-1 gap-2">
          <div className="w-24 h-20 bg-zinc-700 rounded-lg"></div>
          <div className="w-12 h-8 bg-zinc-700 rounded"></div>
        </div>
        {/* External link skeleton */}
        {showExternalLink && externalHref && externalLabel && (
          <div className="flex items-center gap-1">
            <div className="w-32 h-4 bg-zinc-700 rounded"></div>
          </div>
        )}
      </div>

      {/* Right side skeleton - only show if characterImage would be present */}
      {characterImage && (
        <div className="flex items-center justify-center flex-1">
          <div className="w-32 h-32 bg-zinc-700 rounded-lg"></div>
        </div>
      )}
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <span className="text-lg">⚠️</span>
        </div>
        <h4 className="text-sm font-medium text-white mb-1">
          Unable to Load Score
        </h4>
        <p className="text-xs text-zinc-400">
          Please check your connection and try again
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-zinc-900/50 border border-zinc-800 rounded-xl pl-6 h-full relative transition-colors duration-200 ${
        showExternalLink && externalHref
          ? "cursor-pointer hover:bg-zinc-900/70"
          : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="flex flex-col justify-center h-full">
        {isLoading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorState />
        ) : (
          <>
            <div className="flex items-center justify-between h-full">
              {/* Left side - Score and content */}
              <div className="flex-1">
                <div className="flex items-center justify-start flex-row mb-1 gap-5">
                  <div className="flex items-end gap-2 justify-center">
                    <div
                      className={`text-7xl font-bold ${getColorClass(value)}`}
                    >
                      {Math.round(value)}
                    </div>
                    <div
                      className={`flex flex-col items-center ${
                        change !== 0 ? "gap-0" : "gap-2"
                      }`}
                    >
                      {change !== undefined && change !== null && (
                        <div
                          className={`flex items-center ${
                            change > 0
                              ? "text-red-500"
                              : change < 0
                              ? "text-green-500"
                              : "text-zinc-500"
                          }`}
                        >
                          {change > 0 ? (
                            <ArrowBigUp className="w-5 h-5" fill="#EF4444" />
                          ) : change < 0 ? (
                            <ArrowBigDown className="w-5 h-5" fill="#22C55E" />
                          ) : (
                            <ChevronsDownUp className="w-5 h-5" />
                          )}
                          {change !== 0 && (
                            <span className="text-2xl font-bold">
                              {Math.abs(Math.round(change * 100) / 100)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-lg md:text-xl text-zinc-400 leading-none tracking-tight font-bold mb-2 md:mb-1">
                        /&nbsp;100
                      </div>
                    </div>
                  </div>
                </div>
                {timestamp && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {formatTimestamp(timestamp)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right side - Character Image */}
              {characterImage && (
                <div className="flex items-center justify-center flex-1">
                  <Image
                    src={characterImage}
                    alt="Character status"
                    width={180}
                    height={180}
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
