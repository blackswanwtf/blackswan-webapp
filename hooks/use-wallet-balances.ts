import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useImprovedAuth } from "@/providers/authentication";

export interface WalletBalance {
  amount: string;
  contractAddress: string;
  decimals: number;
  name: string;
  network: string;
  symbol: string;
}

export interface WalletBalanceDocument {
  balances: WalletBalance[];
  fetchedAt: {
    __time__: string;
  };
  lastUpdated: {
    __time__: string;
  };
  network: string;
  status: string;
  uid: string;
  walletAddress: string;
}

interface UseWalletBalancesReturn {
  balances: WalletBalance[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  walletAddresses: string[];
}

export function useWalletBalances(): UseWalletBalancesReturn {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [walletAddresses, setWalletAddresses] = useState<string[]>([]);

  const { currentUser, isAuthenticated } = useImprovedAuth();
  const uid = currentUser?.uid;

  useEffect(() => {
    if (!isAuthenticated || !uid) {
      setLoading(false);
      setBalances([]);
      setError(null);
      setLastUpdated(null);
      setWalletAddresses([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Query wallet balances collection for the user's documents
    const walletBalancesRef = collection(db, "walletBalances");
    const q = query(walletBalancesRef, where("uid", "==", uid));

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const allBalances: WalletBalance[] = [];
          const addresses: string[] = [];
          let latestUpdate: string | null = null;

          querySnapshot.forEach((doc) => {
            const data = doc.data() as WalletBalanceDocument;

            // Only process successful balance fetches
            if (data.status === "success" && data.balances) {
              // Add all balances from this wallet
              allBalances.push(...data.balances);

              // Track wallet address
              if (
                data.walletAddress &&
                !addresses.includes(data.walletAddress)
              ) {
                addresses.push(data.walletAddress);
              }

              // Track latest update time
              const updateTime =
                data.lastUpdated?.__time__ || data.fetchedAt?.__time__;
              if (updateTime && (!latestUpdate || updateTime > latestUpdate)) {
                latestUpdate = updateTime;
              }
            }
          });

          // Aggregate balances by contract address (in case same token appears in multiple wallets)
          const aggregatedBalances = aggregateBalancesByContract(allBalances);

          console.log(
            `📊 Loaded balances for ${addresses.length} wallet(s), ${aggregatedBalances.length} unique tokens`
          );

          setBalances(aggregatedBalances);
          setWalletAddresses(addresses);
          setLastUpdated(latestUpdate);
          setError(null);
        } catch (err) {
          console.error("❌ Error processing wallet balances:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to process wallet balances"
          );
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("❌ Error fetching wallet balances:", err);
        setError(err.message || "Failed to fetch wallet balances");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [uid, isAuthenticated]);

  return {
    balances,
    loading,
    error,
    lastUpdated,
    walletAddresses,
  };
}

// Helper function to aggregate balances by contract address
function aggregateBalancesByContract(
  balances: WalletBalance[]
): WalletBalance[] {
  const contractMap = new Map<string, WalletBalance>();

  balances.forEach((balance) => {
    const key = `${balance.contractAddress.toLowerCase()}_${balance.network}`;

    if (contractMap.has(key)) {
      const existing = contractMap.get(key)!;

      // Add amounts using BigInt for precision
      const existingAmount = BigInt(existing.amount);
      const newAmount = BigInt(balance.amount);
      const totalAmount = existingAmount + newAmount;

      contractMap.set(key, {
        ...existing,
        amount: totalAmount.toString(),
      });
    } else {
      contractMap.set(key, { ...balance });
    }
  });

  return Array.from(contractMap.values());
}
