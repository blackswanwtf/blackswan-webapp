"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dice3, Share2 } from "lucide-react";
import { useImprovedAuth } from "@/providers/authentication";
import { config } from "@/lib/config";
import { useTimer } from "react-timer-hook";
import { FaDice } from "react-icons/fa6";
import { useComposeCast } from "@coinbase/onchainkit/minikit";

interface PointsCardProps {
  onClick?: () => void;
}

export function PointsCard({ onClick }: PointsCardProps) {
  const {
    points,
    isAuthenticated,
    referralCode,
    currentUser,
    isLoading: authLoading,
  } = useImprovedAuth();
  const { composeCast } = useComposeCast();
  const [canClaim, setCanClaim] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);

  // Initialize timer with a future date (will be updated when we get actual data)
  const expiryTimestamp =
    nextClaimTime || new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { seconds, minutes, hours, isRunning, restart } = useTimer({
    expiryTimestamp,
    onExpire: () => setCanClaim(true),
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [todaysPointsEarned, setTodaysPointsEarned] = useState(0);
  const [totalNftsClaimed, setTotalNftsClaimed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastLuckPoints, setLastLuckPoints] = useState<number | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Fetch luck status from API
  const fetchLuckStatus = async () => {
    if (!currentUser?.uid) return;

    setIsLoadingStatus(true);
    try {
      const response = await fetch(
        `${config.services.pointsApi}/api/luck/status/${currentUser.uid}`
      );
      const data = await response.json();

      if (data.success) {
        setCanClaim(data.canClaim);

        if (!data.canClaim && data.nextClaimTime) {
          // Set the next claim time and restart the timer
          const nextClaim = new Date(data.nextClaimTime);
          setNextClaimTime(nextClaim);
          restart(nextClaim);
        }
      }
    } catch (error) {
      console.error("Error fetching luck status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Fetch user stats (referrals, latest points, NFTs claimed)
  const fetchUserStats = async () => {
    if (!currentUser?.uid) return;

    try {
      const response = await fetch(
        `${config.services.pointsApi}/api/stats/${currentUser.uid}`
      );
      const data = await response.json();

      if (data.success) {
        setTotalReferrals(data.stats.totalReferrals);
        setTodaysPointsEarned(data.stats.todaysPointsEarned.amount);
        setTotalNftsClaimed(data.stats.totalNftsClaimed);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Initialize data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser?.uid) {
      fetchLuckStatus();
      fetchUserStats();
    }
  }, [isAuthenticated, currentUser?.uid]);

  // Initialize referral link and total referrals
  useEffect(() => {
    if (isAuthenticated && referralCode) {
      setReferralLink(`https://blackswan.wtf?ref=${referralCode}`);
    } else {
      setReferralLink("");
    }
  }, [isAuthenticated, referralCode]);

  // Timer is now handled by react-timer-hook

  // Manual dismiss for success message (no auto-hide)
  const handleDismissSuccess = () => {
    setShowSuccess(false);
  };

  // Auto-hide copied message after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
    }
  };

  const handleClaimPoints = async () => {
    if (!canClaim || isClaiming || !currentUser?.uid) return;

    setIsClaiming(true);

    try {
      const response = await fetch(`${config.services.pointsApi}/api/luck`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastLuckPoints(data.pointsAwarded);
        setShowSuccess(true);

        // Refresh the status and stats to get updated timing and data
        setTimeout(() => {
          fetchLuckStatus();
          fetchUserStats();
        }, 1000);

        onClick?.();
      } else {
        console.error("Failed to claim luck points:", data.message);
      }
    } catch (error) {
      console.error("Error claiming luck points:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTime = (h: number, m: number, s: number) => {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getButtonText = () => {
    if (!isAuthenticated) return "Login Required";
    if (isClaiming) return "Rolling The Dice...";
    if (canClaim) return "Roll To Win";
    return `Available in ${formatTime(hours, minutes, seconds)}`;
  };

  const isButtonDisabled = () => {
    return !isAuthenticated || !canClaim || isClaiming;
  };

  const handleShare = () => {
    composeCast({
      text: `Just won ${lastLuckPoints} points on Black Swan! 🎲\n\nJoin today to try your luck, win rewards and stay on top of the crypto markets with exclusive insights! 🚀`,
      embeds: ["https://blackswan.wtf"],
    });
  };

  if (authLoading) {
    return (
      <Card
        className="relative group border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm overflow-hidden h-[550px] flex items-center justify-center"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-zinc-900/10 to-zinc-950/30" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white relative z-10"></div>
      </Card>
    );
  }

  return (
    <Card
      className="relative group cursor-pointer transition-all duration-300 hover:shadow-xl border-zinc-800/50 hover:border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm overflow-hidden h-[550px]"
      onClick={onClick}
      style={{
        boxShadow:
          "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px",
      }}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-zinc-900/10 to-zinc-950/30" />

      <CardContent className="relative p-6 h-full flex flex-col">
        {/* Header: Points Display */}
        <div className="mb-6">
          <div className="text-base font-semibold text-white font-medium">
            Total Points
          </div>
          <div className="text-5xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {points.toLocaleString()}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-base font-semibold text-white font-medium">
            Today's Points
          </div>
          <div className="text-5xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {todaysPointsEarned > 0
              ? `${todaysPointsEarned.toLocaleString()}`
              : "0"}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-base font-semibold text-white font-medium">
            NFTs Claimed
          </div>
          <div className="text-5xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {totalNftsClaimed.toLocaleString()}
          </div>
        </div>

        {/* Points and Referrals Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Referrals */}
          {/* <div className="text-left">
            <div className="text-base font-semibold text-white font-medium mb-2">
              Total Referrals
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              {totalReferrals}
            </div>
          </div> */}
        </div>

        {/* Referral Link Section */}
        {/* <div className="mb-6">
          <div className="text-base font-semibold text-white font-medium mb-2">
            Invite Your Friends
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 text-sm bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent font-mono bg-zinc-800/30 border border-zinc-700/30 p-3 rounded-lg truncate">
              {referralLink ||
                (isAuthenticated
                  ? "Loading referral code..."
                  : "Login to get referral link")}
            </div>
            <Button
              size="lg"
              variant="outline"
              className="px-3 py-3 border-zinc-600/50 hover:border-zinc-500 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyReferralLink();
              }}
              disabled={!referralLink}
            >
              {copied ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
          <div className="text-xs text-zinc-400 font-medium mb-2">
            Earn points for each of your friend who joins and earns points on
            Black Swan.
          </div>
        </div> */}

        {/* Flexible spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Daily Points Banner */}
        <div className="mb-6 p-4 bg-purple-900/30 border border-purple-700/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <FaDice className="w-6 h-6 text-purple-400" />
            <div className="text-sm font-semibold text-purple-300">
              Introducing Points SZN!
            </div>
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            Earn points for being active on Black Swan by claiming NFTs and
            rolling the dice every 24 hours for a chance to win bonus points!
          </div>
        </div>

        {/* Action Button */}
        <Button
          disabled={isButtonDisabled()}
          className={`w-full border backdrop-blur-sm transition-all duration-200 ${
            !isAuthenticated
              ? "text-zinc-400 border-zinc-600/20 bg-zinc-800/20 hover:bg-zinc-800/20 cursor-not-allowed"
              : canClaim
              ? "text-white hover:text-white border-purple-600/20 bg-purple-800/70 hover:bg-purple-800/90"
              : "text-zinc-400 border-zinc-600/20 bg-zinc-800/20 hover:bg-zinc-800/20 cursor-not-allowed"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleClaimPoints();
          }}
        >
          <Dice3 className="w-6 h-6" />
          {getButtonText()}
        </Button>
      </CardContent>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-20 rounded-xl overflow-hidden">
          {/* Background Image - Same as NFT mint card */}
          <div className="absolute inset-0 bg-cover bg-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(/avatars/points/1.png)`,
              }}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/60" />
          </div>

          {/* Success Content - Centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <FaDice className="w-20 h-20 text-white mb-2" />

            <h4 className="text-3xl font-bold text-white mb-3">
              +{lastLuckPoints} Points!
            </h4>

            <p className="text-base text-zinc-300 mb-8 max-w-sm leading-tight">
              Roll again in 24 hours for a chance to win more points.
            </p>
          </div>

          {/* Action Buttons - Positioned like NFT mint card button */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="w-full border backdrop-blur-sm transition-all duration-200 text-white hover:text-white border-purple-600/20 bg-purple-800/70 hover:bg-purple-800/90"
            >
              <Share2 className="w-4 h-4" />
              Share Your Luck
            </Button>
            <Button
              onClick={handleDismissSuccess}
              className="w-full border backdrop-blur-sm transition-all duration-200 text-white hover:text-white border-zinc-600/20 bg-zinc-800/70 hover:bg-zinc-800/90"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
