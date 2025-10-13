import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import config from "@/lib/config";

// API configuration - Using v1 token data service
const API_BASE_URL = process.env.NEXT_PUBLIC_TOKEN_DATA_SERVICE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cache mechanism to reduce duplicate API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 150000; // 2.5 minutes cache lifetime

// Helper function to get data with caching
async function fetchWithCache<T>(url: string, params?: any): Promise<T> {
  const cacheKey = url + (params ? JSON.stringify(params) : "");
  const now = Date.now();

  // Check if we have a valid cached response
  const cachedData = cache.get(cacheKey);
  if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data as T;
  }

  // If not in cache or expired, fetch from API
  try {
    const response = await axiosInstance.get<T>(url, { params });
    // Store in cache
    cache.set(cacheKey, { data: response.data, timestamp: now });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

// Simple token data structure from /selector endpoint
export interface TokenData {
  name: string;
  symbol: string;
  chain: string;
  address: string;
  price: string;
  priceChange24h: string;
  tokenType: "standard" | "native" | "stablecoin";
  marketCap: string;
  imageUrl: string;
  decimals: number;
}

export interface TokenDataResponse {
  tokens: TokenData[];
  total: number;
}

interface UseTokenDataReturn {
  tokens: TokenData[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refreshTokens: () => Promise<void>;
  getTokenById: (tokenId: string) => TokenData | undefined;
  getTokenBySymbol: (symbol: string) => TokenData | undefined;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Function to invalidate cache for specific keys or all cache
export function invalidateCache(urlPattern?: string) {
  if (urlPattern) {
    const regex = new RegExp(urlPattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// Main token data hook
export function useTokenData(): UseTokenDataReturn {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      if ((config.features as any).tokenDataServicePaused) {
        console.log("⏸️ Token data service is paused. Skipping fetch.");
        setLoading(false);
        setError(null);
        return;
      }

      console.log("🔄 Fetching tokens from token data service...");
      const data = await fetchWithCache<TokenData[]>("/api/tokens/selector");

      console.log(
        `✅ Successfully fetched ${data.length} tokens from token data service`
      );

      setTokens(data);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    if ((config.features as any).tokenDataServicePaused) {
      console.log("⏸️ Token data service is paused. Skipping manual refresh.");
      setLoading(false);
      return;
    }
    setLoading(true);
    await fetchTokens();
  }, [fetchTokens]);

  const getTokenById = useCallback(
    (tokenId: string) => {
      return tokens.find((token) => token.address === tokenId);
    },
    [tokens]
  );

  const getTokenBySymbol = useCallback(
    (symbol: string) => {
      return tokens.find(
        (token) => token.symbol?.toLowerCase() === symbol.toLowerCase()
      );
    },
    [tokens]
  );

  // Initial fetch
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Set up periodic refresh
  useEffect(() => {
    if ((config.features as any).tokenDataServicePaused) {
      return;
    }
    const intervalId = setInterval(() => {
      console.log("⏰ Auto-refreshing token data...");
      fetchTokens();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchTokens]);

  return {
    tokens,
    loading,
    error,
    lastUpdated,
    refreshTokens,
    getTokenById,
    getTokenBySymbol,
  };
}
