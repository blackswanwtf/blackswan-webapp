"use client";

import Link from "next/link";
import { Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/black-swan/app-sidebar";
import { useSidebar } from "@/components/ui/sidebar";

export default function NotFound() {
  const { isExpanded, isMobile } = useSidebar();

  return (
    <div className="flex min-h-screen w-full bg-black">
      <AppSidebar />
      <div
        className="relative flex flex-1 flex-col bg-homepage-gradient transition-[margin-left] duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? "0" : isExpanded ? "16rem" : "3.5rem",
        }}
      >
        <main className="flex flex-1 flex-col items-center justify-center text-center p-4">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <Unplug className="h-24 w-24 text-zinc-700" />
          </div>
          <h1
            className="mt-8 text-9xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-400 to-zinc-600 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            404
          </h1>
          <p
            className="mt-4 text-2xl font-semibold text-white animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            Page Not Found
          </p>
          <p
            className="mt-2 text-zinc-400 max-w-sm animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            The page you're looking for might have been removed, or the link you
            followed is broken.
          </p>
          <div
            className="mt-8 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <Button
              asChild
              className="bg-white text-black hover:bg-zinc-200 h-12 px-8 text-base"
            >
              <Link href="/">Return to Homepage</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
