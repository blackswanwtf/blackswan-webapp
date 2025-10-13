"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ClosedTrade {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string;
  buyPrice: number;
  sellPrice: number;
  pnl: number;
  pnlPercentage: number;
  dateClosed: Date;
  usdcInvested: number;
  finalValue: number;
  tokensReceived: number;
  openTxHash: string;
  closedTxHash: string;
}

export interface ClosedTradesHookReturn {
  closedTrades: ClosedTrade[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch closed trade positions for a specific fund contract
 */
export function useClosedTrades(
  contractAddress: string | null
): ClosedTradesHookReturn {
  const [rawTrades, setRawTrades] = useState<any[]>([]);
  const [tokenMetadataCache, setTokenMetadataCache] = useState<
    Record<string, any>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for closed trade positions
  useEffect(() => {
    if (!contractAddress) {
      setRawTrades([]);
      setIsLoading(false);
      return;
    }

    console.log(
      "[useClosedTrades] Setting up listener for contract:",
      contractAddress
    );

    const tradePositionsRef = collection(db, "tradePositions");
    const closedTradesQuery = query(
      tradePositionsRef,
      where("contractAddress", "==", contractAddress.toLowerCase()),
      where("status", "==", "closed")
    );

    const unsubscribe = onSnapshot(
      closedTradesQuery,
      (snapshot) => {
        console.log(
          "[useClosedTrades] Received snapshot with",
          snapshot.docs.length,
          "closed trades"
        );

        const closedTradesData: any[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("[useClosedTrades] Processing trade:", doc.id, data);

          // Calculate financial metrics
          const originalInvestment = data.usdcActualDecimal || 0;
          const finalValue = data.finalValueDecimal || 0;
          const pnl = data.netProfitLossDecimal || 0;
          const pnlPercentage =
            originalInvestment > 0 ? (pnl / originalInvestment) * 100 : 0;

          // Calculate buy/sell prices
          const tokensReceived = data.tokensReceived
            ? parseFloat(data.tokensReceived) / Math.pow(10, 18)
            : 0;
          const buyPrice =
            tokensReceived > 0 ? originalInvestment / tokensReceived : 0;
          const sellPrice =
            tokensReceived > 0 ? finalValue / tokensReceived : 0;

          closedTradesData.push({
            id: `trade-${data.tradeId}`,
            tokenAddress: data.token,
            buyPrice,
            sellPrice,
            pnl,
            pnlPercentage,
            usdcInvested: originalInvestment,
            finalValue,
            tokensReceived,
            openTxHash: data.openedAndExecutedTxHash || "",
            closedTxHash: data.closedTxHash || "",
            dateClosed: data.updatedAt
              ? data.updatedAt.toDate
                ? data.updatedAt.toDate()
                : new Date(data.updatedAt.seconds * 1000)
              : new Date(),
          });
        });

        setRawTrades(closedTradesData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useClosedTrades] Error fetching closed trades:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("[useClosedTrades] Cleaning up listener");
      unsubscribe();
    };
  }, [contractAddress]);

  // Fetch token metadata for trades
  useEffect(() => {
    const fetchTokenMetadata = async () => {
      if (rawTrades.length === 0) return;

      const tokensToFetch = rawTrades
        .map((trade) => trade.tokenAddress)
        .filter((address) => address && !tokenMetadataCache[`base:${address}`]);

      if (tokensToFetch.length === 0) return;

      console.log(
        "[useClosedTrades] Fetching metadata for",
        tokensToFetch.length,
        "tokens"
      );

      // Fetch metadata for tokens we don't have cached
      for (const tokenAddress of tokensToFetch) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_TOKEN_DATA_SERVICE_URL}/api/tokens/base/${tokenAddress}`
          );

          if (response.ok) {
            const tokenData = await response.json();

            // Cache the token data
            setTokenMetadataCache((prev) => ({
              ...prev,
              [`base:${tokenAddress}`]: tokenData,
            }));

            console.log(
              "[useClosedTrades] Cached metadata for token:",
              tokenAddress,
              tokenData.name
            );
          }
        } catch (error) {
          console.warn(
            `[useClosedTrades] Failed to fetch token metadata for ${tokenAddress}:`,
            error
          );
        }
      }
    };

    fetchTokenMetadata();
  }, [rawTrades, tokenMetadataCache]);

  // Enrich trades with token metadata
  const enrichedTrades = useMemo(() => {
    console.log(
      "[useClosedTrades] Enriching",
      rawTrades.length,
      "trades with metadata"
    );

    return rawTrades.map((trade) => {
      const tokenAddress = trade.tokenAddress;
      const cacheKey = `base:${tokenAddress}`;
      const cachedToken = tokenMetadataCache[cacheKey];

      let tokenName = `Token ${tokenAddress?.slice(0, 8)}...`;
      let tokenSymbol = tokenAddress?.slice(2, 6).toUpperCase() || "UNK";
      let tokenImage = "/placeholder.svg?width=40&height=40";

      if (cachedToken) {
        tokenName = cachedToken.name || tokenName;
        tokenSymbol = cachedToken.symbol || tokenSymbol;
        tokenImage = cachedToken.imageUrl || tokenImage;
      }

      return {
        ...trade,
        tokenName,
        tokenSymbol,
        tokenImage,
      } as ClosedTrade;
    });
  }, [rawTrades, tokenMetadataCache]);

  return {
    closedTrades: enrichedTrades,
    isLoading,
    error,
  };
}
