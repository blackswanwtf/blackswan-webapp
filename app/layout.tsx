import "./globals.css";
import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AuthenticationProvider } from "@/providers/authentication";
import { Suspense } from "react";
import ReferralTracker from "@/providers/referrals";
import { AccessGateProvider } from "@/providers/access-gate";
import { PricingModalProvider } from "@/contexts/pricing-modal";
import { FundPerformanceProvider } from "@/contexts/fund-performance-context";
import { LayoutContent } from "@/components/layout-content";
import { MiniKitContextProvider } from "@/providers/minikit";
import { HomeSSEProvider } from "@/contexts/home-sse-context";
import ReownProvider from "@/contexts/reown";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Black Swan",
  description: "Know when to Sell. Whatever the market.",
  metadataBase: new URL("https://blackswan.wtf"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://blackswan.wtf",
    title: "Black Swan",
    description: "Know when to Sell. Whatever the market.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Black Swan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Swan",
    description: "Know when to Sell. Whatever the market.",
    images: ["/opengraph-image.png"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://blackswan.wtf/frame.png",
      button: {
        title: "Launch Black Swan AI",
        action: {
          type: "launch_frame",
          name: "Black Swan AI",
          url: "https://blackswan.wtf",
          splashImageUrl: "https://blackswan.wtf/logo.png",
          splashBackgroundColor: "#000000",
        },
      },
    }),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-black font-sans text-white antialiased",
          inter.variable
        )}
      >
        <MiniKitContextProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <ReownProvider cookies={null}>
              <AuthenticationProvider>
                <FundPerformanceProvider>
                  <AccessGateProvider>
                    <PricingModalProvider>
                      <Suspense fallback={null}>
                        <ReferralTracker />
                      </Suspense>
                      <SidebarProvider defaultExpanded={false}>
                        <HomeSSEProvider>
                          <LayoutContent>{children}</LayoutContent>
                        </HomeSSEProvider>
                      </SidebarProvider>
                    </PricingModalProvider>
                  </AccessGateProvider>
                </FundPerformanceProvider>
              </AuthenticationProvider>
            </ReownProvider>
          </ThemeProvider>
        </MiniKitContextProvider>
      </body>
    </html>
  );
}
