"use client";

import { ReactNode } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { User } from "lucide-react";
import { Button } from "./ui/button";
import { useImprovedAuth } from "@/providers/authentication";
import { useAppKit } from "@reown/appkit/react";

interface PageTemplateProps {
  children: ReactNode;
  showMobileHeader?: boolean;
  className?: string;
}

export function PageTemplate({
  children,
  showMobileHeader = true,
  className = "",
}: PageTemplateProps) {
  // Since we need to add useImprovedAuth import, we'll add the import and auth logic
  const { isAuthenticated } = useImprovedAuth();
  const isLoggedIn = isAuthenticated;
  const { isExpanded, isMobile } = useSidebar();
  const { open } = useAppKit();

  return (
    <div
      className={`relative flex flex-col h-full transition-[margin-left] duration-300 ease-in-out ${className}`}
      style={{
        marginLeft: isMobile ? "0" : isExpanded ? "16rem" : "3.5rem",
      }}
    >
      {isMobile && (
        <header className="flex h-16 items-center justify-end border-b border-zinc-900 px-4 md:hidden gap-2">
          {!isLoggedIn && (
            <Button
              className="text-xs font-medium bg-zinc-800/60 hover:bg-zinc-700/70 text-white border border-zinc-600/40 hover:border-zinc-500/60 px-3 py-1.5 h-8 flex items-center gap-1.5 rounded-md"
              onClick={() => open()}
            >
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span className="truncate">Login</span>
              </div>
            </Button>
          )}
          <SidebarTrigger />
        </header>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
}
