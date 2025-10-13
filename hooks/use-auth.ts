"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";

/**
 * Simplified auth hook that only handles Firebase authentication via SIWE
 */
export function useAuth() {
  const mountedRef = useRef(true);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { disconnect } = useDisconnect();
  const router = useRouter();

  // Firebase auth state
  const [authState, setAuthState] = useState({
    currentUser: auth.currentUser,
    isLoading: true,
    isInitialized: false,
  });

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!mountedRef.current) return;

      console.log(
        "🔥 Firebase auth state changed:",
        user ? user.uid : "no user"
      );

      setAuthState({
        currentUser: user,
        isLoading: false,
        isInitialized: true,
      });
    });

    // Set timeout to initialize as loaded even if no auth change
    authTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
      }));
    }, 3000);

    return () => {
      unsubscribe();
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  // Handle sign out - includes both Firebase and wallet disconnection
  const handleSignOut = async () => {
    try {
      console.log("🚪 Starting complete sign out process...");

      // 1. Disconnect wallet first
      try {
        console.log("🔌 Disconnecting wallet...");
        disconnect();
        console.log("✅ Wallet disconnected successfully");
      } catch (walletError) {
        console.warn(
          "⚠️ Wallet disconnect error (continuing with signout):",
          walletError
        );
      }

      // 2. Sign out from Firebase
      console.log("🔥 Signing out from Firebase...");
      await signOut(auth);

      // 3. Clear any local storage or session data
      if (typeof window !== "undefined") {
        // Clear auth-related local storage
        localStorage.removeItem("authenticationState");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("hasReferralCode");
        localStorage.removeItem("accountType");
        localStorage.removeItem("points");

        // Clear any wallet-related storage
        localStorage.removeItem("walletconnect");
        localStorage.removeItem("WALLETCONNECT_DEEPLINK_CHOICE");

        // Clear SIWE-related storage
        localStorage.removeItem("reown-session");
        localStorage.removeItem("reown-siwe");
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("walletType");
        localStorage.removeItem("isNewUser");

        // Clear session storage as well
        sessionStorage.removeItem("authenticationState");
        sessionStorage.removeItem("currentUser");
      }

      console.log("✅ Complete sign out successful");

      // 4. Redirect to home page after successful logout
      router.replace("/");
    } catch (error) {
      console.error("❌ Sign out error:", error);
      // Even if there's an error, still try to redirect
      router.replace("/");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentUser: authState.currentUser,
    isAuthenticated: !!authState.currentUser,
    isLoading: authState.isLoading,
    handleSignOut,
  };
}
