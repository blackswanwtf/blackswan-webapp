"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogIn,
  LogOut,
  DollarSign,
  Book,
  Home,
  Coins,
  Bell,
  Banknote,
  MountainSnow,
  Origami,
  Settings,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { SiFarcaster } from "react-icons/si";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { usePricingModal } from "@/contexts/pricing-modal";
import { useImprovedAuth } from "@/providers/authentication";
import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import Image from "next/image";

export function AppSidebar() {
  const { openPricingModal } = usePricingModal();
  const { open } = useAppKit();
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    isAuthenticated,
    accountType,
    isLoading: authLoading,
    handleSignOut,
  } = useImprovedAuth();
  const isLoggedIn = isAuthenticated;

  const handleDocsClick = () => {
    window.open(
      "https://blackswanwtf.gitbook.io/docs",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleXClick = () => {
    window.open("https://x.com/blackswanwtf", "_blank", "noopener,noreferrer");
  };

  const handleFarcasterClick = () => {
    window.open(
      "https://farcaster.xyz/blackswanwtf",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const isPeakPage = pathname === "/peak";
  const isAlertsPage = pathname === "/alerts";
  const isFundPage = pathname === "/funds";
  const isSwanPage = pathname === "/swan";
  const isTokensPage = pathname === "/tokens";

  // Check if user has completed onboarding (has referral code)
  const hasCompletedOnboarding = isLoggedIn;

  // Check if user has pro or alpha access
  const isPro = accountType === "pro" || accountType === "alpha";
  const isAlpha = accountType === "alpha";

  // Show navigation items conditionally
  const showMainNavigation = hasCompletedOnboarding && !authLoading;
  const showFundsPage = showMainNavigation && isAlpha;
  // const showTokensPage = showMainNavigation && isPro;

  // Determine home link destination based on user status
  const homeLink = hasCompletedOnboarding ? "/app" : "/";
  const isOnHomePage = hasCompletedOnboarding
    ? pathname === "/app"
    : pathname === "/";

  // const handleLockedTokensClick = () => {
  //   openPricingModal();
  // };

  const handleLockedFundsClick = () => {
    openPricingModal();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await handleSignOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href={homeLink} aria-label="Home">
          <div className="w-8 h-8 transition-transform hover:scale-110">
            <Image
              src="/logo.svg"
              alt="Black Swan"
              width={100}
              height={100}
              className="text-white"
              style={{
                color: "white",
              }}
            />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        {/* Top Navigation - Only show if user has completed onboarding */}
        {showMainNavigation && (
          <SidebarNav>
            <Link href="/app">
              <SidebarNavItem label="Home" isActive={isOnHomePage}>
                <Home className="w-5 h-5" />
              </SidebarNavItem>
            </Link>

            <Link href="/swan">
              <SidebarNavItem label="Black Swan" isActive={isSwanPage}>
                <Origami className="w-5 h-5" />
              </SidebarNavItem>
            </Link>

            {/* Peak Analysis Page */}
            <Link href="/peak">
              <SidebarNavItem label="Market Peak" isActive={isPeakPage}>
                <MountainSnow className="w-5 h-5" />
              </SidebarNavItem>
            </Link>

            {/* Fund Page - Full Access for Alpha Users */}
            {/* {showFundsPage ? (
              <Link href="/funds">
                <SidebarNavItem label="Fund" isActive={isFundPage}>
                  <Banknote className="w-5 h-5" />
                </SidebarNavItem>
              </Link>
            ) : (
              <SidebarNavItem
                label="Fund"
                onClick={handleLockedFundsClick}
                className="opacity-60 hover:opacity-80"
                badge={{
                  text: "ALPHA",
                  variant: "pro",
                }}
              >
                <Banknote className="w-5 h-5" />
              </SidebarNavItem>
            )} */}

            {/* Tokens Page - Full Access for Pro/Alpha Users */}
            {/* {showTokensPage ? (
              <Link href="/tokens">
                <SidebarNavItem label="Tokens" isActive={isTokensPage}>
                  <Coins className="w-5 h-5" />
                </SidebarNavItem>
              </Link>
            ) : (
              <SidebarNavItem
                label="Tokens"
                onClick={handleLockedTokensClick}
                className="opacity-60 hover:opacity-80"
                badge={{
                  text: "DEGEN",
                  variant: "pro",
                }}
              >
                <Coins className="w-5 h-5" />
              </SidebarNavItem>
            )} */}

            {/* Tokens Page */}
            <SidebarNavItem
              label="Tokens"
              isActive={isTokensPage}
              className="opacity-60 hover:opacity-80"
              badge={{
                text: "SOON",
                variant: "pro",
              }}
            >
              <Coins className="w-5 h-5" />
            </SidebarNavItem>

            {/* Alerts Page */}
            <SidebarNavItem
              label="Alerts"
              isActive={isAlertsPage}
              className="opacity-60 hover:opacity-80"
              badge={{
                text: "SOON",
                variant: "pro",
              }}
            >
              <Bell className="w-5 h-5" />
            </SidebarNavItem>
          </SidebarNav>
        )}

        {/* Bottom Navigation */}
        <div className="mt-auto mb-2">
          <SidebarNav>
            {/* Docs Option - External Link */}
            <SidebarNavItem label="Docs" onClick={handleDocsClick}>
              <Book className="w-5 h-5" />
            </SidebarNavItem>

            {/* Pricing Option */}
            <SidebarNavItem label="Pricing" onClick={openPricingModal}>
              <DollarSign className="w-5 h-5" />
            </SidebarNavItem>

            {/* X (Twitter) Link */}
            {!isLoggedIn && isMobile && (
              <SidebarNavItem label="X" onClick={handleXClick}>
                <FaXTwitter className="w-5 h-5" />
              </SidebarNavItem>
            )}

            {/* Farcaster Link */}
            {!isLoggedIn && isMobile && (
              <SidebarNavItem label="Farcaster" onClick={handleFarcasterClick}>
                <SiFarcaster className="w-5 h-5" />
              </SidebarNavItem>
            )}

            {/* Login/Logout Section */}
            {isLoggedIn ? (
              <SidebarNavItem
                label={"Logout"}
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
              >
                <LogOut
                  className={`w-5 h-5 ${isLoggingOut ? "animate-spin" : ""}`}
                />
              </SidebarNavItem>
            ) : (
              <SidebarNavItem label={"Login"} onClick={() => open()}>
                <LogIn className="w-5 h-5" />
              </SidebarNavItem>
            )}
          </SidebarNav>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
