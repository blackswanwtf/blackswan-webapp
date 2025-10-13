"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useImprovedAuth } from "@/providers/authentication";
import { LoadingScreen } from "@/components/ui/loading-spinner";

// Route configuration for access control
// Access Levels:
// 1. Public: requireAuth: false - No authentication needed
// 2. Authenticated: requireAuth: true, requirePro: false, requireAlpha: false - Any authenticated user
// 3. Pro: requireAuth: true, requirePro: true - Pro and Alpha users get access
// 4. Alpha: requireAuth: true, requireAlpha: true - Only Alpha users get access
interface RouteConfig {
  requireAuth?: boolean;
  requirePro?: boolean;
  requireAlpha?: boolean;
  redirectTo?: string;
}

// Route configurations - centralized access control rules
const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  // PUBLIC ROUTES - No authentication needed
  "/": {
    requireAuth: false,
  },
  "/telegram-callback": {
    requireAuth: false,
  },

  // AUTHENTICATED ROUTES - Any authenticated user can access
  "/app": {
    requireAuth: true,
  },
  "/peak": {
    requireAuth: true,
  },
  // "/alerts": {
  //   requireAuth: true,
  // },
  "/swan": {
    requireAuth: true,
  },

  // PRO ROUTES - Pro and Alpha users can access
  "/tokens": {
    requireAuth: true,
    requirePro: true,
  },
  // (Add routes here that require pro subscription)

  // ALPHA ROUTES - Only Alpha users can access
  "/funds": {
    requireAuth: true,
    requireAlpha: true,
  },
};

interface AccessGateContextType {
  hasAccess: boolean;
  isCheckingAccess: boolean;
  registerRouteRequirements: (requirements: RouteConfig) => void;
  accessError: string | null;
  getAndClearIntendedUrl: () => string | null;
  debugInfo: {
    currentRoute: string;
    routeConfig: RouteConfig;
    authState: string;
    lastCheck: number;
  };
}

const AccessGateContext = createContext<AccessGateContextType>({
  hasAccess: false,
  isCheckingAccess: true,
  registerRouteRequirements: () => {},
  accessError: null,
  getAndClearIntendedUrl: () => null,
  debugInfo: {
    currentRoute: "",
    routeConfig: {},
    authState: "unknown",
    lastCheck: 0,
  },
});

export function useAccessGate() {
  const context = useContext(AccessGateContext);
  if (context === undefined) {
    throw new Error("useAccessGate must be used within an AccessGateProvider");
  }
  return context;
}

interface AccessGateProviderProps {
  children: ReactNode;
}

export function AccessGateProvider({ children }: AccessGateProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    hasReferralCode,
    accountType,
    isLoading: authLoading,
    authError,
    debugInfo: authDebugInfo,
    currentUser,
  } = useImprovedAuth();

  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [dynamicRouteRequirements, setDynamicRouteRequirements] =
    useState<RouteConfig | null>(null);

  const mountedRef = useRef(true);

  const getAndClearIntendedUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const intendedUrl = localStorage.getItem("intendedUrl");
      if (intendedUrl) {
        localStorage.removeItem("intendedUrl");
        return intendedUrl;
      }
    }
    return null;
  }, []);

  // Function to register route requirements dynamically (from RouteGuard)
  const registerRouteRequirements = (requirements: RouteConfig) => {
    setDynamicRouteRequirements(requirements);
  };

  // Get route configuration (from static config or dynamic registration)
  const getRouteConfig = (): RouteConfig => {
    const staticConfig = ROUTE_CONFIGS[pathname];
    if (staticConfig) return staticConfig;

    if (dynamicRouteRequirements) return dynamicRouteRequirements;

    // Default: restrictive access control for unspecified routes
    return {
      requireAuth: true,
      requirePro: false,
      requireAlpha: false,
    };
  };

  // Debug info state
  const [debugInfo, setDebugInfo] = useState({
    currentRoute: pathname,
    routeConfig: {} as RouteConfig,
    authState: "unknown",
    lastCheck: Date.now(),
  });

  // SIMPLIFIED: Single effect to determine access
  useEffect(() => {
    if (!mountedRef.current) return;

    const routeConfig = getRouteConfig();

    // Update debug info
    setDebugInfo({
      currentRoute: pathname,
      routeConfig,
      authState: `auth:${isAuthenticated}, loading:${authLoading}, referral:${hasReferralCode}, type:${accountType}`,
      lastCheck: Date.now(),
    });

    console.log(`🔍 Access check for ${pathname}:`, {
      isAuthenticated,
      authLoading,
      hasReferralCode,
      accountType,
      routeConfig,
    });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log("⏳ Auth loading - waiting...");
      setIsCheckingAccess(true);
      return;
    }

    // Clear any previous errors
    setAccessError(null);

    // LEVEL 1: PUBLIC ROUTES - No authentication needed
    if (!routeConfig.requireAuth) {
      console.log("✅ Public route - access granted");
      setHasAccess(true);
      setIsCheckingAccess(false);
      return;
    }

    // LEVEL 2+: All other routes require authentication first
    if (!isAuthenticated) {
      console.log("❌ Not authenticated - redirecting to home");
      setHasAccess(false);
      setIsCheckingAccess(false);
      if (!isRedirecting) {
        setIsRedirecting(true);
        router.replace("/");
      }
      return;
    }

    // LEVEL 3: PRO ROUTES - Check account type (pro and alpha users get access)
    if (routeConfig.requirePro && accountType === "free") {
      console.log("❌ Pro required but user is free - redirecting");
      setHasAccess(false);
      setIsCheckingAccess(false);
      if (!isRedirecting) {
        setIsRedirecting(true);
        router.replace(routeConfig.redirectTo || "/");
      }
      return;
    }

    // LEVEL 4: ALPHA ROUTES - Check account type (only alpha users get access)
    if (routeConfig.requireAlpha && accountType !== "alpha") {
      console.log("❌ Alpha required but user is not alpha - redirecting");
      setHasAccess(false);
      setIsCheckingAccess(false);
      if (!isRedirecting) {
        setIsRedirecting(true);
        router.replace(routeConfig.redirectTo || "/");
      }
      return;
    }

    // LEVEL 2: AUTHENTICATED ROUTES - All checks passed, user has access
    console.log("✅ All access requirements met");
    setHasAccess(true);
    setIsCheckingAccess(false);
  }, [
    isAuthenticated,
    authLoading,
    hasReferralCode,
    accountType,
    pathname,
    router,
    isRedirecting,
    dynamicRouteRequirements,
  ]);

  // Reset redirecting state when pathname changes
  useEffect(() => {
    if (!mountedRef.current) return;

    console.log(`🔄 Route changed to: ${pathname}`);
    setIsRedirecting(false);
    setDynamicRouteRequirements(null);
    setAccessError(null);
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Access Gate Debug:", {
        pathname,
        isCheckingAccess,
        hasAccess,
        isRedirecting,
        accessError,
        authDebugInfo,
        debugInfo,
      });
    }
  }, [
    pathname,
    isCheckingAccess,
    hasAccess,
    isRedirecting,
    accessError,
    authDebugInfo,
    debugInfo,
  ]);

  // Show loading state while checking access
  if (isCheckingAccess) {
    return <LoadingScreen />;
  }

  // If user doesn't have access and is being redirected, show loading
  if (!hasAccess && isRedirecting) {
    return <LoadingScreen />;
  }

  // If there's a critical error and we're not on a public route, show error message
  if (accessError && !hasAccess && pathname !== "/") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Error</h2>
          <p className="text-zinc-400 mb-4">{accessError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-4 py-2 rounded hover:bg-zinc-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const contextValue = {
    hasAccess,
    isCheckingAccess,
    registerRouteRequirements,
    accessError,
    getAndClearIntendedUrl,
    debugInfo,
  };

  return (
    <AccessGateContext.Provider value={contextValue}>
      {children}
    </AccessGateContext.Provider>
  );
}
