"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import config from "@/lib/config";

export interface HomeSSEData {
  blackswan: {
    score: number;
    confidence: string;
    timestamp: number;
    analysis: string;
    reasoning?: string | string[];
    currentMarketIndicators?: string[];
    primaryRiskFactors?: string[];
    change?: number;
  };
  peak: {
    score: number;
    timestamp: number;
    summary: string;
    reasoning?: string | string[];
    keyFactors?: string[];
    change?: number;
  };
  market: {
    signal: string;
    description: string;
    combinedScore: number;
    timestamp: number;
  };
  timestamp: number;
}

interface UseHomeSSEOptions {
  // Optional: allow pausing the stream when off-screen
  enabled?: boolean;
}

// Global event buffer and connection state - exists outside React lifecycle
let globalEventSource: EventSource | null = null;
let globalEventBuffer: HomeSSEData[] = [];
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let globalConnectionState = {
  isConnected: false,
  lastError: null as string | null,
  subscribers: new Set<(data: HomeSSEData) => void>(),
  errorSubscribers: new Set<(error: string) => void>(),
};

// Initialize global SSE connection immediately
function initializeGlobalSSE() {
  if (
    globalEventSource &&
    globalEventSource.readyState !== EventSource.CLOSED
  ) {
    return; // Already connected
  }

  // Connect directly to the upstream SSE service to avoid expensive Vercel proxy costs
  // Note: This requires the upstream service to have proper CORS headers set
  const url = `${config.services.platformApi}/api/home`;
  globalEventSource = new EventSource(url, { withCredentials: false });

  globalEventSource.onopen = () => {
    globalConnectionState.isConnected = true;
    globalConnectionState.lastError = null;
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection

    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  globalEventSource.onmessage = (evt: MessageEvent) => {
    try {
      const payload = JSON.parse(evt.data);
      if (payload && payload.blackswan && payload.peak && payload.market) {
        const eventData = payload as HomeSSEData;

        // Always buffer the event
        globalEventBuffer.push(eventData);
        // Keep only the latest 5 events
        if (globalEventBuffer.length > 5) {
          globalEventBuffer.shift();
        }

        // Notify all subscribers immediately
        globalConnectionState.subscribers.forEach((callback) => {
          try {
            callback(eventData);
          } catch (e) {
            console.error("SSE subscriber error:", e);
          }
        });
      }
    } catch (e) {
      // Ignore malformed messages
    }
  };

  globalEventSource.addEventListener("update", globalEventSource.onmessage);
  globalEventSource.addEventListener("init", globalEventSource.onmessage);

  globalEventSource.onerror = () => {
    globalConnectionState.isConnected = false;
    const error = "Connection lost. Reconnecting...";
    globalConnectionState.lastError = error;

    globalConnectionState.errorSubscribers.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        console.error("SSE error subscriber error:", e);
      }
    });

    // Auto-reconnect with exponential backoff
    reconnectAttempts++;
    const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30 seconds

    // Clear any existing timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      if (globalConnectionState.subscribers.size > 0) {
        initializeGlobalSSE();
      }
    }, backoffDelay);
  };
}

// Start connection immediately when module loads
if (typeof window !== "undefined") {
  initializeGlobalSSE();
}

/**
 * Single-connection SSE hook for the /api/home stream.
 *
 * - Uses global EventSource connection that starts immediately
 * - Guarantees no events are missed during component mounting
 * - Processes buffered events synchronously with useLayoutEffect
 */
export function useHomeSSE(options: UseHomeSSEOptions = {}) {
  const { enabled = true } = options;

  const [data, setData] = useState<HomeSSEData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastUpdateRef = useRef<number>(0);

  // Use useLayoutEffect to process buffered events synchronously before paint
  useLayoutEffect(() => {
    if (!enabled) return;

    // Immediately check for buffered events
    if (globalEventBuffer.length > 0) {
      const latestEvent = globalEventBuffer[globalEventBuffer.length - 1];
      setData(latestEvent);
      setIsLoading(false);
      lastUpdateRef.current = latestEvent.timestamp;

      // If we have data, clear any connection errors since we have valid data to show
      if (
        globalConnectionState.lastError &&
        globalConnectionState.lastError.includes("Connection lost")
      ) {
        setError(null);
      }
    } else {
      // Only show connection errors if we don't have any buffered data
      if (globalConnectionState.lastError) {
        setError(globalConnectionState.lastError);
        setIsLoading(false);
      } else if (globalConnectionState.isConnected) {
        setError(null);
      }
    }
  }, [enabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled) return;

    // Ensure global connection is active
    initializeGlobalSSE();

    const handleNewData = (eventData: HomeSSEData) => {
      // Debounce updates to prevent excessive re-renders
      if (eventData.timestamp > lastUpdateRef.current) {
        setData(eventData);
        setIsLoading(false);
        setError(null);
        lastUpdateRef.current = eventData.timestamp;
      }
    };

    const handleError = (errorMsg: string) => {
      // Only show connection errors if we don't have any existing data
      // This prevents the UI from showing error states when we have valid cached data
      if (
        globalEventBuffer.length === 0 ||
        !errorMsg.includes("Connection lost")
      ) {
        setError(errorMsg);
      }
      setIsLoading(false);
    };

    // Subscribe to global events
    globalConnectionState.subscribers.add(handleNewData);
    globalConnectionState.errorSubscribers.add(handleError);

    return () => {
      // Unsubscribe
      globalConnectionState.subscribers.delete(handleNewData);
      globalConnectionState.errorSubscribers.delete(handleError);

      // Close global connection if no more subscribers
      if (globalConnectionState.subscribers.size === 0 && globalEventSource) {
        globalEventSource.close();
        globalEventSource = null;
      }
    };
  }, [enabled]);

  return {
    data,
    isLoading,
    error,
    isConnected: globalConnectionState.isConnected,
    isReconnecting:
      globalConnectionState.lastError?.includes("Connection lost") &&
      globalEventBuffer.length > 0,
  };
}
