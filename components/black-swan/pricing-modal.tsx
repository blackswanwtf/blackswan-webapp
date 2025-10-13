"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useImprovedAuth } from "@/providers/authentication";
import { useState } from "react";
import { config } from "@/lib/config";
import { useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { isAuthenticated, currentUser, accountType } = useImprovedAuth();
  const { open } = useAppKit();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCoinbaseCheckout = async () => {
    if (!isAuthenticated || !currentUser) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${config.services.platformApi}/api/coinbase/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: currentUser.uid,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.checkoutLink) {
        window.open(data.checkoutLink, "_blank", "noopener,noreferrer");
        onClose();
      } else {
        console.error("Failed to create checkout session:", data);
        alert("Failed to create checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isProUser = accountType === "pro";
  const isAlphaUser = accountType === "alpha";

  const handleClaimNFT = async () => {
    onClose(); // Close the modal first

    // Navigate to app page first
    await router.push("/app");

    // Wait a bit for navigation to complete, then scroll to NFT section
    setTimeout(() => {
      const nftSection = document.getElementById("nft-section");
      if (nftSection) {
        nftSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900/90 border border-zinc-800 p-8 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="text-left mb-6">
              <h2 className="text-3xl font-semibold mb-2">Pricing</h2>
              <p className="text-zinc-400 text-sm">
                Choose the plan that's right for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div className="p-5 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <div className="flex flex-col items-center mb-4">
                  <Image
                    src="/avatars/pricing/1.png"
                    alt="Normie"
                    width={180}
                    height={180}
                    className="mb-3 rounded-lg"
                  />
                  <h3 className="text-lg font-semibold mb-1">Normie</h3>
                  <div className="text-3xl font-bold mb-1">Free</div>
                </div>

                {/* Only show Current Plan button for free users, hide for pro users */}
                <Button
                  variant="outline"
                  className={`w-full mb-4 ${
                    !isAuthenticated
                      ? "border-white bg-white text-black hover:bg-white/90 hover:text-black"
                      : "border-zinc-600"
                  }`}
                  disabled={isAuthenticated && !isProUser && !isAlphaUser}
                  onClick={!isAuthenticated ? () => open() : undefined}
                >
                  {!isAuthenticated
                    ? "Get Started"
                    : !isProUser && !isAlphaUser
                    ? "Current Plan"
                    : "Not Available"}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>Black Swan Score & Analysis</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>Market Peak Score & Analysis</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>Daily Alerts</span>
                  </div>
                </div>
              </div>

              {/* Pro Plan */}
              <div
                className={`relative p-5 rounded-xl bg-zinc-800/30 border-2 ${
                  isProUser ? "border-white/20" : "border-green-400/80"
                }`}
              >
                <Badge
                  className={`absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-white text-xs px-3 py-1 ${
                    isProUser
                      ? "bg-white hover:bg-white text-black"
                      : "bg-green-400 hover:bg-green-400 text-black"
                  }`}
                >
                  {isProUser ? "CURRENT PLAN" : "LIMITED TIME"}
                </Badge>

                <div className="flex flex-col items-center mb-4">
                  <Image
                    src="/avatars/pricing/2.png"
                    alt="Degen"
                    width={180}
                    height={180}
                    className="mb-3 rounded-lg"
                  />
                  <h3 className="text-lg font-semibold mb-1">Degen</h3>
                  <div className="text-3xl font-bold mb-1">NFT Access</div>
                </div>

                <div className="space-y-2 mb-4">
                  {!isAuthenticated ? (
                    <Button
                      onClick={() => open()}
                      className="w-full bg-white rounded-md text-black hover:bg-zinc-200 h-10 flex items-center justify-center text-sm font-medium"
                    >
                      Get Started
                    </Button>
                  ) : isProUser || isAlphaUser ? (
                    <Button
                      variant="outline"
                      className="w-full border-zinc-600 h-10"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={handleClaimNFT}
                      className="w-full bg-white rounded-md text-black hover:bg-zinc-200 h-10 flex items-center justify-center text-sm font-medium"
                    >
                      Claim NFT
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {[
                    "Top 10 Individual Tokens",
                    "Swan & Peak Alerts",
                    "Historical Analysis",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alpha Plan */}
              <div className="relative p-5 rounded-xl bg-zinc-800/30 border-2 border-yellow-500/80">
                <Badge className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-500 text-black text-xs px-3 py-1">
                  COMING SOON
                </Badge>

                <div className="flex flex-col items-center mb-4">
                  <Image
                    src="/avatars/pricing/3.png"
                    alt="Alpha"
                    width={180}
                    height={180}
                    className="mb-3 rounded-lg"
                  />
                  <h3 className="text-lg font-semibold mb-1">Alpha</h3>
                  <div className="text-3xl font-bold mb-1">
                    100K
                    <span className="text-lg font-normal text-zinc-400">
                      {" "}
                      $SWAN
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-zinc-600 mb-4"
                  disabled
                >
                  Coming Soon
                </Button>

                <div className="space-y-2">
                  {[
                    "Individual Token Analysis",
                    "Custom Alerts",
                    "Magic Pixie Dust",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              {/* <p className="text-xs text-zinc-500">
                Secure payments powered by Coinbase Checkout. Payments may take
                a few minutes to process.
              </p> */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
