"use client";

import { useState, useEffect } from "react";
import {
  getStoredWalletInfo,
  hasConnectedWallet,
  type WalletInfo,
} from "@/lib/siwe-config";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook to access wallet information and authentication state
 * Combines Firebase auth state with SIWE wallet information
 */
export function useWalletInfo() {
  const { isAuthenticated, currentUser } = useAuth();
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: null,
    walletType: null,
    isNewUser: false,
  });

  // Update wallet info when authentication state changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const storedInfo = getStoredWalletInfo();
      setWalletInfo(storedInfo);
      console.log("👛 Wallet info loaded:", storedInfo);
    } else {
      setWalletInfo({
        address: null,
        walletType: null,
        isNewUser: false,
      });
    }
  }, [isAuthenticated, currentUser]);

  // Listen for SIWE events
  useEffect(() => {
    const handleSiweSignIn = (event: CustomEvent) => {
      console.log("👛 SIWE sign in detected, refreshing wallet info");
      const storedInfo = getStoredWalletInfo();
      setWalletInfo(storedInfo);
    };

    const handleSiweSignOut = () => {
      console.log("👛 SIWE sign out detected, clearing wallet info");
      setWalletInfo({
        address: null,
        walletType: null,
        isNewUser: false,
      });
    };

    // Add event listeners
    window.addEventListener(
      "siwe-signed-in",
      handleSiweSignIn as EventListener
    );
    window.addEventListener("siwe-signed-out", handleSiweSignOut);

    return () => {
      window.removeEventListener(
        "siwe-signed-in",
        handleSiweSignIn as EventListener
      );
      window.removeEventListener("siwe-signed-out", handleSiweSignOut);
    };
  }, []);

  return {
    walletInfo,
    isConnected: hasConnectedWallet(),
    hasWallet: !!walletInfo.address,
    // Convenience getters
    walletAddress: walletInfo.address,
    walletType: walletInfo.walletType,
    isNewUser: walletInfo.isNewUser,
  };
}
