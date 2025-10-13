"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
} from "@reown/appkit/react";
import { BrowserProvider, Contract } from "ethers";
import { useState, useEffect } from "react";
import { CheckCircle, Share2 } from "lucide-react";
import { useImprovedAuth } from "@/providers/authentication";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import NFT_ABI from "../../nfts/TSSOFBS/abi.json";

interface NFTMintCardProps {
  onClick?: () => void;
  hasAlreadyMinted: boolean;
  isLoadingNFTStatus: boolean;
  nftCounter: {
    minted: number;
    totalSupply: number;
    remaining: number;
  } | null;
}

// const CONTRACT_ADDRESS = "0xaD3fBBb0Ca46ee86E9C1178ce3D631e25a99Dee0";
const CONTRACT_ADDRESS = "0x724f6E9eaFD25e4Ef8e4529fB092A0A737d56Bee";

export function NFTMintCard({
  onClick,
  hasAlreadyMinted,
  isLoadingNFTStatus,
  nftCounter,
}: NFTMintCardProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { currentUser } = useImprovedAuth();
  const { composeCast } = useComposeCast();

  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Watch for successful minting to trigger success screen
  useEffect(() => {
    if (hasAlreadyMinted && isMinting) {
      console.log("✅ Mint successful - NFT document found during minting");
      setIsMinting(false);
      setShowSuccess(true);

      // Update UI after success animation
      setTimeout(() => {
        onClick?.();
      }, 500);
    }
  }, [hasAlreadyMinted, isMinting, onClick]);

  const handleMint = async () => {
    if (!isConnected) {
      open();
      return;
    }

    if (!walletProvider || !address) {
      setError("Wallet not connected properly");
      return;
    }

    setIsMinting(true);
    setError(null);
    setShowSuccess(false);

    try {
      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, NFT_ABI, signer);

      // Call the mint function with static gas limit
      const tx = await contract.mint({
        gasLimit: 150000,
      });

      console.log("🚀 Mint transaction submitted:", tx.hash);

      // Don't wait for transaction - let Firebase listener handle success detection
      // The listener will detect when the NFT document appears and trigger success screen
    } catch (err: any) {
      console.error("Minting error:", err);

      if (err.code === 4001) {
        setError("Transaction was rejected by user");
      } else if (err.message?.includes("execution reverted")) {
        setError(
          "Minting failed - you may have already minted or minting is disabled"
        );
      } else {
        setError("Failed to mint NFT. Please try again.");
      }

      // Only reset minting state on error - success will be handled by Firebase listener
      setIsMinting(false);
    }
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (isLoadingNFTStatus) return "Checking...";
    if (hasAlreadyMinted) return "Claimed";
    if (isMinting) return "Minting...";
    if (nftCounter?.remaining === 0) return "All Minted";
    return "Mint NFT";
  };

  const isButtonDisabled = () => {
    return (
      isLoadingNFTStatus ||
      isMinting ||
      hasAlreadyMinted ||
      nftCounter?.remaining === 0
    );
  };

  const handleShare = () => {
    composeCast({
      text: "Just minted my limited edition Accelerate NFT on Black Swan! 🎉\n\nMint yours to qualify for exclusive early rewards and market insights! 🚀",
      embeds: ["https://blackswan.wtf"],
    });
  };

  const handleDismissSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <div
      className="rounded-xl overflow-hidden border border-zinc-800/50 shadow-lg relative group cursor-pointer transition-all duration-300 hover:border-zinc-700/50 hover:shadow-xl"
      style={{
        boxShadow:
          "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px",
      }}
      onClick={onClick}
    >
      {/* Background Image */}
      <div className="relative h-[550px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{
            backgroundImage: `url(/avatars/nft/3.png)`,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 left-4">
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30 px-3 py-1">
          LIMITED EDITION
        </Badge>
      </div>

      {/* Remaining Count */}
      {nftCounter && (
        <div className="absolute top-4 right-4 flex flex-col items-end justify-end">
          <h1 className="text-white text-2xl font-bold">
            {nftCounter.remaining}
          </h1>
          <p className="text-white text-xs">LEFT</p>
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-4">
          {/* NFT Title */}
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            Accelerate NFT
          </h3>

          {/* Description */}
          <div className="space-y-4">
            <div className="mb-4">
              {/* <p className="text-sm text-white/80 leading-relaxed">
                Join our exclusive community and get upgraded to DEGEN for free
                for one month.
              </p> */}
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm text-center mb-2">
                {error}
              </div>
            )}

            {/* Mint Button */}
            <Button
              disabled={isButtonDisabled()}
              className={`w-full border backdrop-blur-sm transition-all duration-200 ${
                !isConnected
                  ? "text-zinc-400 hover:text-zinc-400 border-zinc-600/20 bg-zinc-800/20 hover:bg-zinc-800/20 cursor-not-allowed"
                  : hasAlreadyMinted
                  ? "border-green-500 bg-green-600 cursor-not-allowed text-white !opacity-100"
                  : isButtonDisabled()
                  ? "text-zinc-400 hover:text-zinc-400 border-zinc-600/20 bg-zinc-800/20 hover:bg-zinc-800/20 cursor-not-allowed"
                  : "text-zinc-400 hover:text-white border-zinc-600/20 bg-zinc-800/70 hover:bg-zinc-800/90"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleMint();
              }}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-10 rounded-xl overflow-hidden">
          {/* Success Content - Centered */}
          <div className="absolute inset-0 bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-green-900/30 border border-green-700 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              NFT Successfully Minted! 🎉
            </h4>
            <p className="text-sm text-zinc-400 max-w-xs">
              Your NFT has been minted and sent to your wallet.
            </p>
          </div>

          {/* Action Buttons - Positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="w-full border backdrop-blur-sm transition-all duration-200 text-white hover:text-white border-green-600/20 bg-green-800/70 hover:bg-green-800/90"
            >
              <Share2 className="w-4 h-4" />
              Spread The Word
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
    </div>
  );
}
