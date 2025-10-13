"use client";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useImprovedAuth } from "@/providers/authentication";
import { usePricingModal } from "@/contexts/pricing-modal";
import { useTokenData } from "@/hooks/use-token-data";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { matchWalletBalancesWithTokenData } from "@/lib/token-utils";
import { Landmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function YourTokens() {
  const { accountType, isAuthenticated } = useImprovedAuth();
  const { openPricingModal } = usePricingModal();

  const isFree = accountType === "free";
  const isPaidTier = accountType === "pro" || accountType === "alpha";

  // Fetch token data from service
  const {
    tokens: tokenData,
    loading: tokenDataLoading,
    error: tokenDataError,
  } = useTokenData();

  // Fetch user wallet balances
  const {
    balances: walletBalances,
    loading: walletBalancesLoading,
    error: walletBalancesError,
  } = useWalletBalances();

  // Match wallet balances with token data to create display tokens
  const userTokens = useMemo(() => {
    if (
      tokenDataLoading ||
      walletBalancesLoading ||
      !tokenData.length ||
      !walletBalances.length
    ) {
      return [];
    }

    const matched = matchWalletBalancesWithTokenData(walletBalances, tokenData);
    return matched.slice(0, 6); // Limit to first 6 tokens for this widget
  }, [walletBalances, tokenData, tokenDataLoading, walletBalancesLoading]);

  // Create placeholder tokens when no real data is available
  const placeholderTokens = useMemo(() => {
    if (tokenData.length > 0) {
      return tokenData.slice(0, 6).map((token, index) => ({
        name: token.name,
        symbol: token.symbol,
        balance: Math.random() * 1000 + 10, // Random balance between 10-1010
        usdBalance: parseFloat(token.price) * (Math.random() * 1000 + 10),
        image: token.imageUrl,
        chain: token.chain,
      }));
    }
    return [];
  }, [tokenData]);

  // Use real tokens if available, otherwise use placeholders
  const displayTokens = userTokens.length > 0 ? userTokens : placeholderTokens;
  const isLoading = tokenDataLoading || walletBalancesLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTokenAmount = (amount: number) => {
    if (amount === 0) return "0";
    if (amount < 0.000001) return "<0.000001";
    if (amount < 1) return amount.toFixed(6);
    if (amount < 1000) return amount.toFixed(3);
    if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K`;
    return `${(amount / 1000000).toFixed(2)}M`;
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[550px] relative overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-lg font-medium text-white mb-2">Your Tokens</h4>
      </div>

      {/* Token Rows */}
      <div className="space-y-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-zinc-700 rounded-full" />
                <div className="space-y-1">
                  <div className="w-16 h-3 bg-zinc-700 rounded" />
                  <div className="w-12 h-2 bg-zinc-700 rounded" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="w-20 h-3 bg-zinc-700 rounded" />
                <div className="w-16 h-2 bg-zinc-700 rounded" />
              </div>
            </div>
          ))
        ) : displayTokens.length > 0 ? (
          displayTokens.map((token, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
            >
              {/* Token Info */}
              <div className="flex items-center space-x-3">
                {token.image ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={token.image} alt={token.symbol} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                      {token.symbol.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-white text-sm">
                    {token.symbol}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {token.name.length > 20
                      ? `${token.name.slice(0, 20)}...`
                      : token.name}
                  </div>
                </div>
              </div>

              {/* Balance Info */}
              <div className="text-right">
                <div className="font-medium text-white text-sm">
                  {formatTokenAmount(token.balance)}
                </div>
                <div className="text-xs text-zinc-400">
                  {formatCurrency(token.usdBalance)}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Landmark className="w-8 h-8 text-zinc-400 mb-3" />
            <p className="text-sm text-zinc-400">No tokens found</p>
          </div>
        )}
      </div>

      {/* Glass morphism overlay with Coming Soon */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Landmark className="w-8 h-8 text-white mb-4 mx-auto" />
          <h4 className="text-lg font-medium text-white mb-6">
            Token Analysis
          </h4>

          {/* CTA Button */}
          {isAuthenticated && (
            <div className="w-full">
              {isFree ? (
                <Button
                  onClick={openPricingModal}
                  className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                >
                  Upgrade to Degen
                </Button>
              ) : (
                <Button
                  disabled
                  className="bg-zinc-800 text-zinc-400 hover:bg-zinc-800 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                >
                  Coming Soon
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
