import { TokenData } from "@/hooks/use-token-data";
import { WalletBalance } from "@/hooks/use-wallet-balances";
import { TokenBalance } from "@/lib/types/tokens";

/**
 * Convert raw token amount to decimal amount using token decimals
 * Uses BigInt for precision with large numbers
 */
export function convertRawToDecimal(
  rawAmount: string,
  decimals: number
): number {
  try {
    const amount = BigInt(rawAmount);
    const divisor = BigInt(10 ** decimals);

    // Convert to number for display (may lose some precision for very large numbers)
    const decimalAmount = Number(amount) / Number(divisor);
    return decimalAmount;
  } catch (error) {
    console.error("Error converting raw amount to decimal:", error);
    return 0;
  }
}

/**
 * Calculate USD value from decimal amount and price
 */
export function calculateUsdValue(
  decimalAmount: number,
  priceUsd?: string
): number {
  if (!priceUsd || decimalAmount === 0) return 0;

  try {
    const price = parseFloat(priceUsd);
    if (isNaN(price)) return 0;

    return decimalAmount * price;
  } catch (error) {
    console.error("Error calculating USD value:", error);
    return 0;
  }
}

/**
 * Randomly create a token score between 1 and 50 for a token at complete random
 */
export function getTokenScore(): number {
  return Math.floor(Math.random() * 30) + 1;
}

/**
 * Check if a contract address matches between wallet balance and token data
 * Handles case-insensitive comparison and ETH special case
 */
export function isContractAddressMatch(
  walletAddress: string,
  tokenAddress: string
): boolean {
  // Normalize addresses to lowercase
  const normalizedWalletAddress = walletAddress.toLowerCase();
  const normalizedTokenAddress = tokenAddress.toLowerCase();

  // Direct match
  if (normalizedWalletAddress === normalizedTokenAddress) {
    return true;
  }

  // ETH special case mappings
  const ethZeroAddress = "0x0000000000000000000000000000000000000000"; // From selector
  const ethPlaceholderAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // From wallet balances

  // Check for ETH address variants
  if (
    (normalizedWalletAddress === ethPlaceholderAddress &&
      normalizedTokenAddress === ethZeroAddress) ||
    (normalizedWalletAddress === ethZeroAddress &&
      normalizedTokenAddress === ethPlaceholderAddress) ||
    (normalizedWalletAddress === ethPlaceholderAddress &&
      normalizedTokenAddress === ethPlaceholderAddress) ||
    (normalizedWalletAddress === ethZeroAddress &&
      normalizedTokenAddress === ethZeroAddress)
  ) {
    return true;
  }

  return false;
}

/**
 * Match wallet balances with token data and create TokenBalance objects
 */
export function matchWalletBalancesWithTokenData(
  walletBalances: WalletBalance[],
  tokenData: TokenData[]
): TokenBalance[] {
  const matchedTokens: TokenBalance[] = [];

  walletBalances.forEach((walletBalance) => {
    // Find matching token data
    const matchingTokenData = tokenData.find((token) =>
      isContractAddressMatch(walletBalance.contractAddress, token.address)
    );

    if (!matchingTokenData) {
      // Skip tokens that don't have data in our token service
      console.log(
        `⚠️  No token data found for ${walletBalance.symbol} (${walletBalance.contractAddress})`
      );
      return;
    }

    // Log successful matches for debugging ETH mapping
    console.log(
      `✅ Matched ${walletBalance.symbol}: wallet(${walletBalance.contractAddress}) ↔ token(${matchingTokenData.address})`
    );

    // Convert raw balance to decimal
    const decimalBalance = convertRawToDecimal(
      walletBalance.amount,
      walletBalance.decimals
    );

    // Skip tokens with zero balance
    if (decimalBalance === 0) {
      return;
    }

    // Calculate USD value
    const usdBalance = calculateUsdValue(
      decimalBalance,
      matchingTokenData.price
    );

    // Calculate token score based on price change
    const tokenScore = getTokenScore();

    // Create TokenBalance object
    const tokenBalance: TokenBalance = {
      address: matchingTokenData.address,
      name: matchingTokenData.name,
      symbol: matchingTokenData.symbol,
      decimals: matchingTokenData.decimals,
      balance: decimalBalance,
      price: parseFloat(matchingTokenData.price),
      marketValue: usdBalance,
      usdBalance: usdBalance,
      tokenScore: tokenScore,
      image: matchingTokenData.imageUrl,
      chain: matchingTokenData.chain,
    };

    matchedTokens.push(tokenBalance);
  });

  // Sort by USD balance (highest first)
  return matchedTokens.sort((a, b) => b.usdBalance - a.usdBalance);
}

/**
 * Format large numbers for display
 */
export function formatTokenAmount(amount: number): string {
  if (amount === 0) return "0";
  if (amount < 0.000001) return "<0.000001";
  if (amount < 1) return amount.toFixed(6);
  if (amount < 1000) return amount.toFixed(3);
  if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K`;
  return `${(amount / 1000000).toFixed(2)}M`;
}

/**
 * Calculate total portfolio value
 */
export function calculateTotalPortfolioValue(tokens: TokenBalance[]): number {
  return tokens.reduce((total, token) => total + token.usdBalance, 0);
}
