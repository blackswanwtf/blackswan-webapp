"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageTemplate } from "@/components/page-template";
import { BlackswanScoreCard } from "@/components/black-swan/blackswan-score-card";
import { PeakAnalysisScoreCard } from "@/components/black-swan/peak-analysis-score-card";
import { MarketScoreCard } from "@/components/black-swan/market-score-card";
import { HomeSSEProvider } from "@/contexts/home-sse-context";
import { YourTokens } from "@/components/black-swan/your-tokens";
import {
  DailyRoundupSignup,
  isEmailSignupDismissed,
} from "@/components/black-swan/daily-roundup-signup";
import { NFTMintCard } from "@/components/black-swan/nft-mint-card";
import { PointsCard } from "@/components/black-swan/points-card";
import { FundCard } from "@/components/funds/fund-card";
import { UserPositionModal } from "@/components/funds/user-position-modal";
import { Fund, UserFundPosition } from "@/lib/types/funds";
import { useImprovedAuth } from "@/providers/authentication";
import { useFunds } from "@/hooks/use-funds";
import { useUserPositions } from "@/hooks/use-user-positions";
import { usePricingModal } from "@/contexts/pricing-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dice3, Flame } from "lucide-react";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AppPage() {
  const router = useRouter();
  const { isPricingModalOpen } = usePricingModal();
  const isMobile = useIsMobile();
  const {
    email,
    isAuthenticated,
    hasReferralCode,
    isLoading: authLoading,
    currentUser,
    accountType,
    points,
  } = useImprovedAuth();
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [selectedUserPosition, setSelectedUserPosition] =
    useState<UserFundPosition | null>(null);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // NFT claim status state
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false);
  const [isLoadingNFTStatus, setIsLoadingNFTStatus] = useState(false);
  const [nftCounter, setNftCounter] = useState<{
    minted: number;
    totalSupply: number;
    remaining: number;
  } | null>(null);

  // NFT contract address
  // const CONTRACT_ADDRESS = "0xaD3fBBb0Ca46ee86E9C1178ce3D631e25a99Dee0";
  const CONTRACT_ADDRESS = "0x724f6E9eaFD25e4Ef8e4529fB092A0A737d56Bee";

  // Update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Check if user has already minted via Firebase realtime listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoadingNFTStatus(false);
      setHasAlreadyMinted(false);
      return;
    }

    setIsLoadingNFTStatus(true);
    console.log(
      "🔄 Setting up NFT mint status listener for uid:",
      currentUser.uid
    );

    // Query the nfts collection for this user's uid and contract address
    const nftsRef = collection(db, "nfts");
    const q = query(
      nftsRef,
      where("contractAddress", "==", CONTRACT_ADDRESS.toLowerCase()),
      where("uid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("🎨 NFT snapshot received:", snapshot.size, "documents");

        const hasMinted = !snapshot.empty;
        setHasAlreadyMinted(hasMinted);
        setIsLoadingNFTStatus(false);
      },
      (error) => {
        console.error("Error listening to NFT collection:", error);
        setIsLoadingNFTStatus(false);
      }
    );

    return () => {
      console.log("🛑 Cleaning up NFT mint status listener");
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Real-time listener for NFT counter data
  useEffect(() => {
    console.log("🔄 Setting up NFT counter listener");

    const nftCounterRef = doc(
      db,
      "counters",
      `${CONTRACT_ADDRESS.toLowerCase()}`
    );

    const unsubscribe = onSnapshot(
      nftCounterRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const minted = data.minted || 0;
          const totalSupply = data.totalSupply || 1000;
          const remaining = totalSupply - minted;

          console.log("📊 NFT counter data:", {
            minted,
            totalSupply,
            remaining,
          });

          setNftCounter({
            minted,
            totalSupply,
            remaining,
          });
        } else {
          console.log("📊 NFT counter document doesn't exist, using defaults");
          // Set defaults if document doesn't exist
          setNftCounter({
            minted: 0,
            totalSupply: 1000,
            remaining: 1000,
          });
        }
      },
      (error) => {
        console.error("Error listening to NFT counter:", error);
        // Set defaults on error
        setNftCounter({
          minted: 0,
          totalSupply: 1000,
          remaining: 1000,
        });
      }
    );

    return () => {
      console.log("🛑 Cleaning up NFT counter listener");
      unsubscribe();
    };
  }, []);

  // Determine if we should show the email signup card
  useEffect(() => {
    if (isAuthenticated) {
      const hasEmail = email && email.trim() !== "";
      const isDismissed = isEmailSignupDismissed();

      // Show email signup if user doesn't have email and hasn't dismissed it
      setShowEmailSignup(!hasEmail && !isDismissed);
    } else {
      setShowEmailSignup(false);
    }
  }, [isAuthenticated, email]);

  const isLoggedIn = isAuthenticated;

  // Get all funds and featured funds (max 2) from Firestore with real-time updates
  const {
    funds,
    featuredFunds,
    isLoading: featuredFundsLoading,
    error: featuredFundsError,
  } = useFunds();

  // Get user positions linked to funds
  const { getUserFundPosition } = useUserPositions(
    currentUser?.uid || null,
    funds
  );

  const handleFundClick = useMemo(() => {
    return (fund: Fund) => {
      // Navigate to funds page or show fund details
      router.push("/funds");
    };
  }, [router]);

  const handleViewPosition = (userPosition: UserFundPosition) => {
    setSelectedUserPosition(userPosition);
    setIsPositionModalOpen(true);
  };

  const handleClosePositionModal = () => {
    setIsPositionModalOpen(false);
    setSelectedUserPosition(null);
  };

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome</h1>
            <p className="text-zinc-400 text-sm">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              •{" "}
              {currentTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZoneName: "short",
              })}
            </p>
          </div>

          {/* Mobile NFT Banner - Only on mobile */}
          {isMobile &&
            (!hasAlreadyMinted &&
            !isLoadingNFTStatus &&
            nftCounter?.remaining !== 0 ? (
              <div className="mb-6 md:hidden">
                <button
                  onClick={() => {
                    const nftSection = document.getElementById("nft-section");
                    if (nftSection) {
                      nftSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="w-full bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/50 rounded-xl p-4 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                      <Flame className="text-red-300 text-xl" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">
                        Claim Accelerate NFT
                      </p>
                      <p className="text-zinc-400 text-xs">
                        Exclusive for our early supporters. Limited time only.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="mb-6 md:hidden">
                <button
                  onClick={() => {
                    const nftSection =
                      document.getElementById("points-section");
                    if (nftSection) {
                      nftSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="w-full bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/50 rounded-xl p-4 transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <Dice3 className="text-purple-300 text-xl" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium text-sm">
                        Points SZN Is Here!
                      </p>
                      <p className="text-zinc-400 text-xs">
                        Daily spin to get points.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}

          {/* Top Row - Stat Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 flex flex-col space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Black Swan Score
              </h3>
              <BlackswanScoreCard showExternalLink={true} />
            </div>
            <div className="col-span-1 flex flex-col space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Market Peak Score
              </h3>
              <PeakAnalysisScoreCard showExternalLink={true} />
            </div>
            <div className="col-span-1 flex flex-col space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Market Status
              </h3>
              <MarketScoreCard showExternalLink={false} />
            </div>
          </div>

          {/* Featured Funds and Join Now Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Featured Funds Section - Only for Alpha Users with funds */}
              {/* {accountType === "alpha" &&
                !featuredFundsLoading &&
                !featuredFundsError &&
                featuredFunds.length > 0 && (
                  <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Featured Funds
                    </h2>
                    <div className="space-y-6">
                      {featuredFunds.map((fund) => (
                        <FundCard
                          key={fund.id}
                          fund={fund}
                          userPosition={getUserFundPosition(fund)}
                          onClick={() => router.push("/funds")} // Navigate to funds page for more details
                          onViewPosition={handleViewPosition}
                          showCardClickForPosition={false} // On /app page, clicking card goes to /funds, button opens modal
                        />
                      ))}
                    </div>
                  </div>
                )} */}

              <div id="nft-section" className="lg:col-span-1">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Claim Now
                </h2>
                <NFTMintCard
                  onClick={() => console.log("NFT Mint clicked")}
                  hasAlreadyMinted={hasAlreadyMinted}
                  isLoadingNFTStatus={isLoadingNFTStatus}
                  nftCounter={nftCounter}
                />
              </div>

              {/* Points Section - For All Users */}
              <div id="points-section" className="lg:col-span-1">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Earn Points
                </h2>
                <PointsCard onClick={() => console.log("Points claimed")} />
              </div>

              {/* Your Tokens Widget or Email Signup - Right Side */}
              <div className="lg:col-span-1">
                {/* Spacer to align with other sections that have headings */}
                <div className="h-7 mb-4"></div>
                {/* {showEmailSignup ? (
                  <DailyRoundupSignup
                    onDismiss={() => setShowEmailSignup(false)}
                  />
                ) : (
                  <YourTokens />
                )} */}
                <YourTokens />
              </div>
            </div>

            {/* Loading and Error States for Featured Funds */}
            {/* {accountType === "alpha" &&
              (featuredFundsLoading || featuredFundsError) && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Featured Funds
                  </h2>
                  {featuredFundsLoading ? (
                    <div className="bg-zinc-900 rounded-lg p-6 animate-pulse">
                      <div className="h-80 bg-zinc-800 rounded mb-4"></div>
                      <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                      <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                    </div>
                  ) : featuredFundsError ? (
                    <div className="bg-zinc-900 rounded-lg p-6 text-center">
                      <p className="text-red-400 text-sm mb-2">
                        Error loading featured funds
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {featuredFundsError}
                      </p>
                    </div>
                  ) : null}
                </div>
              )} */}
          </div>

          {/* User Position Modal */}
          <UserPositionModal
            isOpen={isPositionModalOpen}
            onClose={handleClosePositionModal}
            userFundPosition={selectedUserPosition}
            uid={currentUser?.uid || null}
          />
        </div>
      </div>
    </PageTemplate>
  );
}
