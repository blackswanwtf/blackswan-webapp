"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

// Constants
const REFERRAL_ID_KEY = "referralId";
const COOKIE_EXPIRY_DAYS = 30;

// Create a cached version of the fetchReferralId function to improve performance
let cachedReferralId: string | null = null;
let hasCheckedStorage = false;

export default function ReferralTracker() {
  const searchParams = useSearchParams();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const referralId = searchParams?.get("ref") ?? null;

    // Fast path: Skip if no referral ID in URL or already processed
    if (!referralId || hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Check if there's an existing referral ID
    const existingStorageReferralId = localStorage.getItem(REFERRAL_ID_KEY);
    const existingCookieReferralId = Cookies.get(REFERRAL_ID_KEY);

    // Only log if different from existing
    if (
      existingStorageReferralId !== referralId ||
      existingCookieReferralId !== referralId
    ) {
      // Save to local storage in one operation
      localStorage.setItem(REFERRAL_ID_KEY, referralId);

      // Save to Cookie as a fallback.
      Cookies.set(REFERRAL_ID_KEY, referralId, {
        expires: COOKIE_EXPIRY_DAYS,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      // Update the cache
      cachedReferralId = referralId;
    }
  }, [searchParams]);

  return null;
}

// Optimized utility function to get referral ID
export const fetchReferralId = () => {
  // Fast path: Return cached value if available
  if (cachedReferralId !== null) return cachedReferralId;

  // Server-side, return null.
  if (typeof window === "undefined") return null;

  // Only check storage once
  if (!hasCheckedStorage) {
    hasCheckedStorage = true;

    // Try Local Storage first.
    const referralId = localStorage.getItem(REFERRAL_ID_KEY);
    if (referralId) {
      cachedReferralId = referralId;
      return referralId;
    }

    // Try Cookies next.
    const cookieReferralId = Cookies.get(REFERRAL_ID_KEY);
    if (cookieReferralId) {
      cachedReferralId = cookieReferralId;
      return cookieReferralId;
    }
  }

  // No referral ID found.
  return null;
};
