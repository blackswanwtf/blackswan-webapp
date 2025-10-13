"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";

type SidebarContextType = {
  isExpanded: boolean;
  isMobile: boolean;
  setExpanded: (isExpanded: boolean) => void;
  toggle: () => void;
  closeMobileSheet: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultExpanded = true,
}: {
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const isMobile = useIsMobile();
  const [isExpanded, setExpandedState] = React.useState(defaultExpanded);
  const [isMobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  const setExpanded = React.useCallback(
    (expanded: boolean) => {
      // On desktop, always keep collapsed (false)
      // On mobile, this state doesn't matter as we use Sheet
      const newState = isMobile ? false : false;
      setExpandedState(newState);
      // Don't save cookie state since desktop is always collapsed
    },
    [isMobile]
  );

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setMobileSheetOpen((prev) => !prev);
    }
    // Remove desktop toggle functionality - do nothing for desktop
  }, [isMobile]);

  const closeMobileSheet = React.useCallback(() => {
    if (isMobile) {
      setMobileSheetOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (isMobile) {
      setExpandedState(true); // Mobile should always be in "expanded" state conceptually
    } else {
      // Desktop: always collapsed, ignore cookie
      setExpandedState(false);
    }
  }, [isMobile]);

  const contextValue = React.useMemo(
    () => ({ isExpanded, isMobile, setExpanded, toggle, closeMobileSheet }),
    [isExpanded, isMobile, setExpanded, toggle, closeMobileSheet]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          {children}
        </Sheet>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isExpanded, isMobile } = useSidebar();

  if (isMobile) {
    return (
      <SheetContent
        side="left"
        className="w-[--sidebar-width-mobile] bg-black p-0 border-r border-zinc-900"
        style={
          {
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
          } as React.CSSProperties
        }
      >
        {children}
      </SheetContent>
    );
  }

  return (
    <aside
      ref={ref}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-zinc-900 transition-[width] duration-300 ease-in-out bg-black",
        isExpanded ? "w-[--sidebar-width]" : "w-[--sidebar-width-icon]",
        className
      )}
      style={
        {
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </aside>
  );
});
Sidebar.displayName = "Sidebar";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { isMobile } = useSidebar();

  if (isMobile) {
    return (
      <SheetTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className={cn("text-zinc-400 hover:text-white", className)}
          {...props}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </SheetTrigger>
    );
  }

  return null;
});
SidebarTrigger.displayName = "SidebarTrigger";

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex h-16 items-center p-4 lg:p-3", className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("p-2", className)} {...props} />;
});
SidebarFooter.displayName = "SidebarFooter";

export const SidebarNav = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <nav
      ref={ref}
      className={cn("flex flex-col gap-2 px-2", className)}
      {...props}
    />
  );
});
SidebarNav.displayName = "SidebarNav";

export const SidebarNavItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    label: string;
    isActive?: boolean;
    badge?: {
      text: string;
      variant: "pro" | "coming-soon";
    };
  }
>(({ className, children, label, isActive, badge, onClick, ...props }, ref) => {
  const { isExpanded, isMobile, closeMobileSheet } = useSidebar();
  const showText = isExpanded || isMobile;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Close mobile sheet when any nav item is clicked
    closeMobileSheet();
    // Call the original onClick handler
    onClick?.(e);
  };

  const getBadgeStyles = (variant: "pro" | "coming-soon") => {
    switch (variant) {
      case "pro":
        return "px-1 text-[10px] font-semibold bg-white text-black rounded-md";
      case "coming-soon":
        return "px-1 text-[10px] font-semibold bg-white text-black rounded-md";
      default:
        return "";
    }
  };

  const buttonContent = (
    <Button
      ref={ref}
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "h-10 gap-3",
        showText ? "w-full justify-start" : "w-10 justify-center",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      {showText && (
        <div className="flex items-center gap-2 flex items-center justify-between w-full">
          <span className="truncate">{label}</span>
          {badge && (
            <span className={getBadgeStyles(badge.variant)}>{badge.text}</span>
          )}
        </div>
      )}
    </Button>
  );

  if (isMobile || isExpanded) {
    return buttonContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        <div className="flex items-center gap-2">
          <p>{label}</p>
          {badge && (
            <span className={getBadgeStyles(badge.variant)}>{badge.text}</span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});
SidebarNavItem.displayName = "SidebarNavItem";
