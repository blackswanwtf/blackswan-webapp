"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useHomeSSE, HomeSSEData } from "@/hooks/use-home-sse";

interface HomeSSEContextValue {
  data: HomeSSEData | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isReconnecting: boolean;
}

const HomeSSEContext = createContext<HomeSSEContextValue | undefined>(
  undefined
);

export function HomeSSEProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, isConnected, isReconnecting } = useHomeSSE();

  return (
    <HomeSSEContext.Provider
      value={{
        data,
        isLoading,
        error,
        isConnected,
        isReconnecting: isReconnecting || false,
      }}
    >
      {children}
    </HomeSSEContext.Provider>
  );
}

export function useHomeSSEContext(): HomeSSEContextValue {
  const ctx = useContext(HomeSSEContext);
  if (!ctx) {
    throw new Error("useHomeSSEContext must be used within a HomeSSEProvider");
  }
  return ctx;
}
