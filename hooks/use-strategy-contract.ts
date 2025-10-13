"use client";

import { useState, useEffect } from "react";
import { useReadContract, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";

// Real strategy contract ABI - only the view functions we need
const STRATEGY_ABI = [
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getContractBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalDeposits",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface StrategyContractData {
  userProfit: number;
  agentFunds: number;
  liquidBalance: number;
  isLoading: boolean;
  error: boolean;
}

interface UseStrategyContractProps {
  contractAddress?: string;
}

export function useStrategyContract({
  contractAddress = "0x943648cf191bd2767a7bcea88ee61237a2866386", // Real contract address on Base
}: UseStrategyContractProps = {}): StrategyContractData {
  const { address: userAddress } = useAccount();
  const [error, setError] = useState(false);

  // Read user liquid balance
  const {
    data: liquidBalanceData,
    isLoading: isLoadingBalance,
    isError: balanceError,
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: STRATEGY_ABI,
    functionName: "getBalance",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!contractAddress,
      retry: false,
      staleTime: 30000, // 30 seconds
    },
  });

  // Read agent funds (total contract balance)
  const {
    data: agentFundsData,
    isLoading: isLoadingFunds,
    isError: fundsError,
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: STRATEGY_ABI,
    functionName: "getContractBalance",
    query: {
      enabled: !!contractAddress,
      retry: false,
      staleTime: 30000, // 30 seconds
    },
  });

  // For now, set profit to 0 since there's no direct profit function in the contract
  const userProfitData = BigInt(0);
  const isLoadingProfit = false;
  const profitError = false;

  // Update error state when any contract call fails
  useEffect(() => {
    const hasError = profitError || fundsError || balanceError;
    setError(hasError);
  }, [profitError, fundsError, balanceError]);

  // Convert BigInt values to numbers (USDC has 6 decimals)
  const userProfit = userProfitData ? Number(userProfitData) / 1e6 : 0;
  const agentFunds = agentFundsData ? Number(agentFundsData) / 1e6 : 0;
  const liquidBalance = liquidBalanceData ? Number(liquidBalanceData) / 1e6 : 0;

  const isLoading = isLoadingProfit || isLoadingFunds || isLoadingBalance;

  return {
    userProfit,
    agentFunds,
    liquidBalance,
    isLoading,
    error,
  };
}
