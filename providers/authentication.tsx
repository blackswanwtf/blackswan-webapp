"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

// Cache keys for localStorage
const CACHE_KEYS = {
  REFERRAL: "hasReferralCode",
  ACCOUNT_TYPE: "accountType", // Add accountType cache key
  POINTS: "points", // Add points cache key
  AUTH_STATE: "authenticationState", // Add auth state cache
  CURRENT_USER: "currentUser", // Add current user cache
  REFERRAL_CODE: "referralCode", // Add referral code cache
} as const;

// Performance-optimized cache
const CACHE = {
  data: new Map<string, any>(),
  initialized: false,

  init() {
    if (this.initialized || typeof window === "undefined") return;
    Object.values(CACHE_KEYS).forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value) this.data.set(key, JSON.parse(value));
      } catch (e) {
        console.warn(`Failed to read cache for ${key}:`, e);
      }
    });
    this.initialized = true;
  },

  get<T>(key: string, defaultValue: T): T {
    this.init();
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  },

  set(key: string, value: any): void {
    this.init();
    this.data.set(key, value);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`Failed to cache ${key}:`, e);
      }
    }
  },

  update(updates: Record<string, any>): void {
    this.init();

    // Update in-memory cache
    Object.entries(updates).forEach(([key, value]) => {
      this.data.set(key, value);
    });

    // Batch write to localStorage
    if (typeof window !== "undefined") {
      try {
        Object.entries(updates).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      } catch (e) {
        console.warn(`Failed to batch update cache:`, e);
      }
    }
  },
};

// Define the context type
interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: any;
  isLoading: boolean;
  hasReferralCode: boolean | null;
  handleSignOut: () => Promise<void>;
  accountType: "free" | "pro" | "alpha";
  points: number;
  authError: string | null;
  email: string | null;
  upgradedAt: any | null;
  referralCode: string | null;
  debugInfo: {
    authLoadingState: string;
    userDataState: string;
    lastUpdate: number;
  };
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  isLoading: true,
  hasReferralCode: null,
  handleSignOut: async () => {},
  accountType: "free", // Default to free
  points: 0, // Default to 0 points
  authError: null,
  email: null,
  upgradedAt: null,
  referralCode: null, // Default to null
  debugInfo: {
    authLoadingState: "initializing",
    userDataState: "not_loaded",
    lastUpdate: 0,
  },
});

/**
 * Hook to use the enhanced auth context
 */
export function useImprovedAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useImprovedAuth must be used within an AuthenticationProvider"
    );
  }
  return context;
}

export function AuthenticationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    CACHE.init();
  }, []);

  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  // Use the existing auth hook
  const {
    isAuthenticated,
    currentUser: firebaseUser,
    isLoading: authLoading,
    handleSignOut,
  } = useAuth();

  // Timeout and error handling refs
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Get cached auth state to avoid loading on refresh
  const cachedAuthState = CACHE.get(CACHE_KEYS.AUTH_STATE, null);
  const cachedUser = CACHE.get(CACHE_KEYS.CURRENT_USER, null);

  // Initialize states with cached values - use cached auth if available
  const [userState, setUserState] = useState<{
    hasReferralCode: boolean | null;
    accountType: "free" | "pro" | "alpha";
    points: number;
    currentUser: any | null;
    email: string | null;
    upgradedAt: any | null;
    referralCode: string | null;
    hasInitialData: boolean;
    error: string | null;
    debugInfo: {
      authLoadingState: string;
      userDataState: string;
      lastUpdate: number;
    };
  }>({
    hasReferralCode: CACHE.get(CACHE_KEYS.REFERRAL, null),
    accountType: CACHE.get(CACHE_KEYS.ACCOUNT_TYPE, "free"),
    points: CACHE.get(CACHE_KEYS.POINTS, 0),
    currentUser: cachedUser || firebaseUser,
    email: null,
    upgradedAt: null,
    referralCode: CACHE.get(CACHE_KEYS.REFERRAL_CODE, null),
    hasInitialData: !!cachedAuthState, // If we have cached auth, we have initial data
    error: null,
    debugInfo: {
      authLoadingState: cachedAuthState ? "cached" : "initializing",
      userDataState: cachedAuthState ? "cached" : "not_loaded",
      lastUpdate: Date.now(),
    },
  });

  // Override loading state if we have cached auth data
  const effectiveAuthLoading = cachedAuthState ? false : authLoading;
  const effectiveIsAuthenticated =
    cachedAuthState !== null ? cachedAuthState : isAuthenticated;

  const handleUserDataUpdate = useCallback((userData: any) => {
    if (!mountedRef.current) return;
    if (!userData) {
      console.log("⚠️ No user data received");
      return;
    }

    console.log("📄 Raw user data from Firestore:", userData);

    // Determine accountType based on backend data, with migration from accessLevel
    let accountType = userData.accountType || "free";

    // Migration: if accessLevel exists and accountType is not set, use accessLevel
    if (!userData.accountType && userData.accessLevel === "alpha") {
      accountType = "alpha";
    }

    // Multiple ways to check for referral access
    const hasReferral = !!(
      (userData.referredBy || accountType === "pro" || accountType === "alpha") // Pro and alpha users automatically have access
    );

    // Extract email, upgradedAt, points, and referralCode from user data
    const email = userData.email || null;
    const upgradedAt = userData.upgradedAt || null;
    const points = userData.points || 0; // Default to 0 if no points field exists
    const referralCode = userData.referralCode || null; // Extract referralCode

    console.log("🔍 Processed user data:", {
      accountType,
      hasReferral,
      email,
      upgradedAt,
      points,
      referralCode,
      referredBy: userData.referredBy,
    });

    const updates = {
      [CACHE_KEYS.REFERRAL]: hasReferral,
      [CACHE_KEYS.ACCOUNT_TYPE]: accountType,
      [CACHE_KEYS.POINTS]: points,
      [CACHE_KEYS.REFERRAL_CODE]: referralCode,
    };

    CACHE.update(updates);
    setUserState((prevState) => ({
      ...prevState,
      hasReferralCode: hasReferral,
      accountType: accountType,
      points: points,
      email: email,
      upgradedAt: upgradedAt,
      referralCode: referralCode,
      hasInitialData: true,
      error: null,
      debugInfo: {
        ...prevState.debugInfo,
        userDataState: "loaded",
        lastUpdate: Date.now(),
      },
    }));

    // Clear user data timeout since we got data
    if (userDataTimeoutRef.current) {
      clearTimeout(userDataTimeoutRef.current);
      userDataTimeoutRef.current = null;
    }
  }, []);

  // Simplified timeout - only for actual user data loading
  useEffect(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Only set timeout for authenticated users waiting for Firestore data
    if (!isAuthenticated || userState.hasInitialData || authLoading) {
      return;
    }

    console.log("⏱️ Setting user data timeout - 10 seconds");
    loadingTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      console.warn("🚨 User data timeout - using defaults");
      setUserState((prevState) => ({
        ...prevState,
        hasReferralCode: false,
        accountType: "free",
        points: 0,
        email: null,
        upgradedAt: null,
        referralCode: null,
        hasInitialData: true,
        error: "Failed to load user data - using defaults",
        debugInfo: {
          ...prevState.debugInfo,
          userDataState: "timeout",
          lastUpdate: Date.now(),
        },
      }));
    }, 10000);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isAuthenticated, userState.hasInitialData, authLoading]);

  useEffect(() => {
    if (!mountedRef.current) return;

    if (!isAuthenticated || !firebaseUser?.uid) {
      // Immediately clear all user state when not authenticated
      console.log("🔄 User not authenticated - clearing user state");
      setUserState((prevState) => ({
        ...prevState,
        hasReferralCode: null,
        accountType: "free",
        points: 0,
        currentUser: null, // Ensure currentUser is null when not authenticated
        email: null,
        upgradedAt: null,
        referralCode: null,
        hasInitialData: true, // Always true for unauthenticated state - we have all the data we need
        error: null,
        debugInfo: {
          ...prevState.debugInfo,
          userDataState: "not_authenticated",
          authLoadingState: "not_authenticated",
          lastUpdate: Date.now(),
        },
      }));
      return undefined;
    }

    // Clear any existing user data timeout
    if (userDataTimeoutRef.current) {
      clearTimeout(userDataTimeoutRef.current);
    }

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (!mountedRef.current) return;

        const userData = docSnapshot.data();
        if (userData) {
          handleUserDataUpdate(userData);
        } else {
          // User document doesn't exist - create default state
          console.log("📝 User document doesn't exist, using defaults");
          setUserState((prevState) => ({
            ...prevState,
            hasReferralCode: false,
            accountType: "free",
            points: 0,
            email: null,
            upgradedAt: null,
            referralCode: null,
            hasInitialData: true,
            error: null,
            debugInfo: {
              ...prevState.debugInfo,
              userDataState: "no_document",
              lastUpdate: Date.now(),
            },
          }));
        }
      },
      (error) => {
        if (!mountedRef.current) return;

        console.error("Error fetching user data:", error);
        // Set defaults on error
        setUserState((prevState) => ({
          ...prevState,
          currentUser: firebaseUser,
          accountType: "free",
          points: 0,
          hasReferralCode: false,
          email: null,
          upgradedAt: null,
          referralCode: null,
          hasInitialData: true,
          error: `Firestore error: ${error.message}`,
          debugInfo: {
            ...prevState.debugInfo,
            userDataState: "error",
            lastUpdate: Date.now(),
          },
        }));
      }
    );

    return () => {
      unsubscribe();
      if (userDataTimeoutRef.current) {
        clearTimeout(userDataTimeoutRef.current);
      }
    };
  }, [isAuthenticated, firebaseUser, handleUserDataUpdate]);

  // Update current user when firebaseUser changes
  useEffect(() => {
    if (!mountedRef.current) return;

    setUserState((prevState) => ({
      ...prevState,
      currentUser: firebaseUser,
      debugInfo: {
        ...prevState.debugInfo,
        authLoadingState: authLoading ? "loading" : "loaded",
        lastUpdate: Date.now(),
      },
    }));
  }, [firebaseUser, authLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (userDataTimeoutRef.current) {
        clearTimeout(userDataTimeoutRef.current);
      }
    };
  }, []);

  // Clear stale cache on initial load if user is not authenticated
  useEffect(() => {
    if (typeof window === "undefined") return;

    // On first load, if we have cached auth state but user is not authenticated,
    // clear the stale cache immediately
    const hasCachedAuth = cachedAuthState !== null;
    if (hasCachedAuth && !authLoading && isAuthenticated === false) {
      console.log("🧹 Clearing stale cached auth state on app start");
      CACHE.update({
        [CACHE_KEYS.CURRENT_USER]: null,
        [CACHE_KEYS.REFERRAL]: null,
        [CACHE_KEYS.ACCOUNT_TYPE]: "free",
        [CACHE_KEYS.POINTS]: 0,
        [CACHE_KEYS.REFERRAL_CODE]: null,
        [CACHE_KEYS.AUTH_STATE]: false,
      });
    }
  }, []); // Run only once on mount

  // Cache auth state changes to avoid loading on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only cache when we have definitive auth state (not loading)
    if (!authLoading && isAuthenticated !== undefined) {
      console.log("💾 Caching auth state:", isAuthenticated);
      CACHE.set(CACHE_KEYS.AUTH_STATE, isAuthenticated);

      // Cache current user if authenticated
      if (isAuthenticated && firebaseUser) {
        CACHE.set(CACHE_KEYS.CURRENT_USER, firebaseUser);
      } else if (!isAuthenticated) {
        // Clear ALL auth-related cached data when not authenticated
        console.log("🧹 Clearing all auth cache on logout");
        CACHE.update({
          [CACHE_KEYS.CURRENT_USER]: null,
          [CACHE_KEYS.REFERRAL]: null,
          [CACHE_KEYS.ACCOUNT_TYPE]: "free",
          [CACHE_KEYS.POINTS]: 0,
          [CACHE_KEYS.REFERRAL_CODE]: null,
          [CACHE_KEYS.AUTH_STATE]: false,
        });
      }
    }
  }, [isAuthenticated, authLoading, firebaseUser]);

  // Enhanced sign out handler that immediately clears all state
  const enhancedHandleSignOut = useCallback(async () => {
    console.log("🚪 Starting enhanced sign out process");

    // Immediately clear all cached auth data
    CACHE.update({
      [CACHE_KEYS.CURRENT_USER]: null,
      [CACHE_KEYS.REFERRAL]: null,
      [CACHE_KEYS.ACCOUNT_TYPE]: "free",
      [CACHE_KEYS.POINTS]: 0,
      [CACHE_KEYS.REFERRAL_CODE]: null,
      [CACHE_KEYS.AUTH_STATE]: false,
    });

    // Immediately clear user state
    setUserState({
      hasReferralCode: null,
      accountType: "free",
      points: 0,
      currentUser: null,
      email: null,
      upgradedAt: null,
      referralCode: null,
      hasInitialData: true,
      error: null,
      debugInfo: {
        authLoadingState: "signed_out",
        userDataState: "signed_out",
        lastUpdate: Date.now(),
      },
    });

    // Call the original sign out function (which now includes wallet disconnection)
    try {
      await handleSignOut();
      console.log("✅ Enhanced sign out completed successfully");
    } catch (error) {
      console.error("❌ Enhanced sign out error:", error);
      // Even if sign out fails, we've already cleared local state
      // The base handleSignOut will still redirect to home
    }
  }, [handleSignOut]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated: effectiveIsAuthenticated,
      currentUser: userState.currentUser,
      isLoading:
        effectiveAuthLoading ||
        (effectiveIsAuthenticated && !userState.hasInitialData),
      hasReferralCode: userState.hasReferralCode,
      handleSignOut: enhancedHandleSignOut,
      accountType: userState.accountType,
      points: userState.points,
      authError: userState.error,
      email: userState.email,
      upgradedAt: userState.upgradedAt,
      referralCode: userState.referralCode,
      debugInfo: userState.debugInfo,
    }),
    [
      effectiveIsAuthenticated,
      userState,
      effectiveAuthLoading,
      enhancedHandleSignOut,
    ]
  );

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Auth State Debug:", {
        isAuthenticated: effectiveIsAuthenticated,
        authLoading: effectiveAuthLoading,
        originalAuthLoading: authLoading,
        cachedAuthState,
        hasInitialData: userState.hasInitialData,
        hasReferralCode: userState.hasReferralCode,
        accountType: userState.accountType,
        points: userState.points,
        referralCode: userState.referralCode,
        debugInfo: userState.debugInfo,
        isLoading: contextValue.isLoading,
      });
    }
  }, [
    effectiveIsAuthenticated,
    effectiveAuthLoading,
    authLoading,
    cachedAuthState,
    userState,
    contextValue.isLoading,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
