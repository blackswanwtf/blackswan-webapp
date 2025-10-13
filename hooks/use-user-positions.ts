"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  UserPosition,
  UserPositionWithFund,
  UserFundPosition,
  Fund,
} from "@/lib/types/funds";

export interface UserPositionsHookReturn {
  positions: UserPosition[];
  positionsWithFunds: UserPositionWithFund[];
  fundPositions: UserFundPosition[];
  isLoading: boolean;
  error: string | null;
  hasAnyPositions: boolean;
  getUserFundPosition: (fund: Fund) => UserFundPosition | undefined;
}

/**
 * Real-time hook to fetch user positions from Firestore and link them with fund data
 * Integrates with existing fund data to provide comprehensive position information
 */
export function useUserPositions(
  uid: string | null,
  funds: Fund[] // Pass funds from useFunds() to link positions
): UserPositionsHookReturn {
  const [rawPositions, setRawPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for user positions
  useEffect(() => {
    if (!uid) {
      setRawPositions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log(
      "[useUserPositions] Setting up real-time listener for user:",
      uid
    );

    // Create query for user positions, ordered by creation date (newest first)
    const userPositionsQuery = query(
      collection(db, "userPositions"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      userPositionsQuery,
      (snapshot) => {
        console.log(
          "[useUserPositions] Received snapshot with",
          snapshot.docs.length,
          "positions"
        );

        const positionsData: UserPosition[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("[useUserPositions] Processing position:", doc.id, data);

          // Convert Firestore document to UserPosition interface
          const position: UserPosition = {
            id: doc.id,
            amount: data.amount || 0,
            amount_raw: data.amount_raw || "0",
            contractAddress: data.contractAddress || "",
            // Convert Firestore timestamp to ISO string
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate().toISOString()
                : data.createdAt.__time__ || data.createdAt
              : new Date().toISOString(),
            transactionHash: data.transactionHash || "",
            type: data.type || "deposit",
            uid: data.uid || "",
            walletAddress: data.walletAddress || "",
          };

          positionsData.push(position);
        });

        setRawPositions(positionsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useUserPositions] Error fetching positions:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log("[useUserPositions] Cleaning up listener");
      unsubscribe();
    };
  }, [uid]);

  // Link positions with fund data
  const positionsWithFunds = useMemo(() => {
    console.log("[useUserPositions] Linking positions with funds:", {
      positionsCount: rawPositions.length,
      fundsCount: funds.length,
    });

    return rawPositions.map((position) => {
      // Find matching fund by contract address (case-insensitive)
      const matchingFund = funds.find(
        (fund) =>
          fund.contractAddress &&
          fund.contractAddress.toLowerCase() ===
            position.contractAddress.toLowerCase()
      );

      if (matchingFund) {
        console.log(
          `[useUserPositions] Linked position ${position.id} with fund ${matchingFund.name}`
        );
      } else {
        console.log(
          `[useUserPositions] No matching fund found for position ${position.id} (contract: ${position.contractAddress})`
        );
      }

      return {
        ...position,
        fund: matchingFund,
      };
    });
  }, [rawPositions, funds]);

  // Group positions by fund and calculate summaries
  const fundPositions = useMemo(() => {
    console.log("[useUserPositions] Calculating fund position summaries");

    // Group positions by contract address
    const positionsByContract = new Map<string, UserPositionWithFund[]>();

    positionsWithFunds.forEach((position) => {
      if (position.fund) {
        const contractAddress = position.contractAddress.toLowerCase();
        if (!positionsByContract.has(contractAddress)) {
          positionsByContract.set(contractAddress, []);
        }
        positionsByContract.get(contractAddress)!.push(position);
      }
    });

    const fundPositionSummaries: UserFundPosition[] = [];

    positionsByContract.forEach((positions, contractAddress) => {
      const fund = positions[0].fund!; // We know it exists from grouping logic

      // Calculate totals
      const deposits = positions.filter((p) => p.type === "deposit");
      const withdrawals = positions.filter((p) => p.type === "withdrawal");

      const totalDeposited = deposits.reduce((sum, p) => sum + p.amount, 0);
      const totalWithdrawn = withdrawals.reduce((sum, p) => sum + p.amount, 0);
      const netPosition = totalDeposited - totalWithdrawn;

      // For current value, we'll use the fund's performance data if available
      // This is a simplified calculation - in real scenarios, you'd want more precise tracking
      const currentValue =
        netPosition > 0
          ? netPosition * (1 + (fund.fundPerformancePercentage || 0) / 100)
          : 0;
      const profitLoss = currentValue - netPosition;
      const profitLossPercentage =
        netPosition > 0 ? (profitLoss / netPosition) * 100 : 0;

      const fundPosition: UserFundPosition = {
        fund,
        totalDeposited,
        totalWithdrawn,
        currentValue,
        profitLoss,
        profitLossPercentage,
        positions: positions.map((p) => ({
          id: p.id,
          amount: p.amount,
          amount_raw: p.amount_raw,
          contractAddress: p.contractAddress,
          createdAt: p.createdAt,
          transactionHash: p.transactionHash,
          type: p.type,
          uid: p.uid,
          walletAddress: p.walletAddress,
        })),
        hasActivePosition: netPosition > 0,
      };

      console.log(
        `[useUserPositions] Fund position summary for ${fund.name}:`,
        {
          totalDeposited,
          totalWithdrawn,
          netPosition,
          currentValue,
          profitLoss,
          profitLossPercentage,
          positionsCount: positions.length,
        }
      );

      fundPositionSummaries.push(fundPosition);
    });

    return fundPositionSummaries;
  }, [positionsWithFunds]);

  // Helper function to get position for a specific fund
  const getUserFundPosition = useMemo(() => {
    return (fund: Fund): UserFundPosition | undefined => {
      if (!fund.contractAddress) return undefined;

      return fundPositions.find(
        (fp) =>
          fp.fund.contractAddress?.toLowerCase() ===
          fund.contractAddress?.toLowerCase()
      );
    };
  }, [fundPositions]);

  const hasAnyPositions = rawPositions.length > 0;

  return {
    positions: rawPositions,
    positionsWithFunds,
    fundPositions,
    isLoading,
    error,
    hasAnyPositions,
    getUserFundPosition,
  };
}
