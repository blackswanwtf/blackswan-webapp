import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { base } from "@reown/appkit/networks";
import type {
  SIWEVerifyMessageArgs,
  SIWECreateMessageArgs,
  SIWESession,
} from "@reown/appkit-siwe";
import { auth } from "@/lib/firebase";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { config } from "@/lib/config";
import { fetchReferralId } from "@/providers/referrals";

// Use the configured user auth service URL
const USER_AUTH_SERVICE_URL = config.services.userAuth;

// Nonce storage for SIWE authentication
let currentNonce: string | null = null;

/**
 * Generate a random nonce for SIWE authentication
 */
function generateNonce(): string {
  const timestamp = Date.now().toString();
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `${timestamp}-${randomHex}`;
}

/**
 * Get the current session from Firebase Auth and stored wallet info
 */
async function getCurrentSession(): Promise<SIWESession | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    // Try to get wallet info from local storage first (immediate access)
    let walletAddress: string | null = null;
    let chainId: number = base.id; // Default to Base

    if (typeof window !== "undefined") {
      walletAddress = localStorage.getItem("walletAddress");
    }

    // If we have local storage data, use it
    if (walletAddress) {
      console.log("📋 SIWE: Session found from local storage:", {
        address: walletAddress,
        chainId,
      });
      return {
        address: walletAddress,
        chainId,
      };
    }

    // Fallback: try to get from Firebase custom claims
    const idTokenResult = await user.getIdTokenResult();
    const customClaims = idTokenResult.claims;

    if (customClaims.walletAddress) {
      walletAddress = customClaims.walletAddress as string;
      chainId = (customClaims.chainId as number) || base.id;

      console.log("📋 SIWE: Session found from Firebase claims:", {
        address: walletAddress,
        chainId,
      });

      return {
        address: walletAddress,
        chainId,
      };
    }

    console.log(
      "⚠️ SIWE: No wallet session found, user needs to re-authenticate"
    );
    return null;
  } catch (error) {
    console.error("❌ SIWE: Error getting session:", error);
    return null;
  }
}

/**
 * Sign out from both Firebase and clear wallet connection
 */
async function handleSignOut(): Promise<boolean> {
  try {
    console.log("🚪 SIWE: Starting sign out process");

    // Clear the current nonce
    currentNonce = null;

    // Clear wallet-related local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletType");
      localStorage.removeItem("isNewUser");
      console.log("🧹 SIWE: Cleared wallet info from local storage");
    }

    await signOut(auth);
    console.log("✅ SIWE: Sign out completed");
    return true;
  } catch (error) {
    console.error("❌ SIWE: Sign out error:", error);
    return false;
  }
}

/**
 * Verify message with user-auth-service and authenticate user
 */
async function verifyMessage({
  message,
  signature,
}: SIWEVerifyMessageArgs): Promise<boolean> {
  try {
    console.log("🔍 SIWE: Verifying message with user-auth-service");

    // Extract address from the message
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    if (!addressMatch) {
      throw new Error("Could not extract address from SIWE message");
    }
    const address = addressMatch[0];

    // Get stored referral ID to send with authentication
    const referralId = fetchReferralId();

    console.log("🔗 SIWE: Including referral ID:", referralId);

    // Send verification request to user-auth-service
    const response = await fetch(`${USER_AUTH_SERVICE_URL}/siwe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        signature,
        address,
        referralId, // Include referral ID from URL params or storage
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "SIWE verification failed");
    }

    // Log the complete authentication response
    console.log("🎉 SIWE: Authentication successful, response:", {
      userId: result.userId,
      address: result.address,
      isNewUser: result.isNewUser,
      walletType: result.walletType,
    });

    // If verification successful, sign in with the Firebase token
    if (result.firebaseToken) {
      console.log("🔥 SIWE: Signing in with Firebase custom token");
      await signInWithCustomToken(auth, result.firebaseToken);
      console.log("✅ SIWE: Firebase authentication successful");

      // Store additional user info in session/local storage for immediate access
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("walletAddress", result.address);
          localStorage.setItem("walletType", result.walletType);
          localStorage.setItem("isNewUser", result.isNewUser.toString());
          console.log("💾 SIWE: User wallet info cached locally");
        } catch (storageError) {
          console.warn("⚠️ SIWE: Failed to cache user info:", storageError);
        }
      }

      return true;
    } else {
      throw new Error("No Firebase token received from authentication service");
    }
  } catch (error) {
    console.error("❌ SIWE: Verification failed:", error);
    return false;
  }
}

/**
 * Create SIWE configuration for Reown AppKit
 */
export const siweConfig = createSIWEConfig({
  // Get message parameters for SIWE
  getMessageParams: async () => ({
    domain: typeof window !== "undefined" ? window.location.host : "",
    uri: typeof window !== "undefined" ? window.location.origin : "",
    chains: [base.id], // Using Base network
    statement: "Please sign with your account to authenticate with Blackswan",
  }),

  // Create the SIWE message
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) => {
    console.log("📝 SIWE: Creating message for address:", address);
    return formatMessage(args, address);
  },

  // Get nonce for SIWE message
  getNonce: async () => {
    console.log("🎲 SIWE: Generating new nonce");
    currentNonce = generateNonce();
    return currentNonce;
  },

  // Get current session
  getSession: getCurrentSession,

  // Verify message and authenticate
  verifyMessage,

  // Sign out handler
  signOut: handleSignOut,

  // Optional callbacks
  onSignIn: (session?: SIWESession) => {
    console.log("✅ SIWE: User signed in with session:", session);

    // Dispatch custom event for other parts of the app to listen to
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("siwe-signed-in", {
          detail: { session },
        })
      );
    }
  },

  onSignOut: () => {
    console.log("👋 SIWE: User signed out");
    currentNonce = null;

    // Dispatch custom event for other parts of the app to listen to
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("siwe-signed-out"));
    }
  },

  // Configuration options
  enabled: true,
  nonceRefetchIntervalMs: 300000, // 5 minutes
  sessionRefetchIntervalMs: 300000, // 5 minutes
  signOutOnDisconnect: true,
  signOutOnAccountChange: true,
});

/**
 * Utility functions for accessing wallet information
 */

// Type definition for wallet info
export interface WalletInfo {
  address: string | null;
  walletType: string | null;
  isNewUser: boolean;
}

/**
 * Get the current wallet information from local storage
 */
export function getStoredWalletInfo(): WalletInfo {
  if (typeof window === "undefined") {
    return { address: null, walletType: null, isNewUser: false };
  }

  try {
    const address = localStorage.getItem("walletAddress");
    const walletType = localStorage.getItem("walletType");
    const isNewUser = localStorage.getItem("isNewUser") === "true";

    return {
      address,
      walletType,
      isNewUser,
    };
  } catch (error) {
    console.warn("⚠️ Failed to get stored wallet info:", error);
    return { address: null, walletType: null, isNewUser: false };
  }
}

/**
 * Check if user has a wallet connected and authenticated
 */
export function hasConnectedWallet(): boolean {
  const walletInfo = getStoredWalletInfo();
  return !!walletInfo.address && !!auth.currentUser;
}
