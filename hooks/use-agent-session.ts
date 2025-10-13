"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot, FirestoreError } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: any;
  rawResponse?: string;
}

interface AgentData {
  name?: string;
  selectedTokens?: string[];
  strategy?: string;
  strategySummary?: string;
  riskProfile?: number; // 1-100 scale
  tradingFrequency?: number; // 1-100 scale
  isComplete?: boolean;
  completionStatus?: "complete" | "partial" | "needs_refinement";
  confidence?: number;
}

interface SessionData {
  sessionId: string;
  messages: SessionMessage[];
  status: string;
  createdAt: any;
  userPrompt: string;
  lastRawResponse?: string;
  agentData?: AgentData;
  userRisk?: string | number; // Can be string (backward compatibility) or number (1-100 scale)
  userFrequency?: string | number; // Can be string (backward compatibility) or number (1-100 scale)
  userId?: string;
  lastUpdated?: any;
  suggestions?: string[];
}

interface UseAgentSessionReturn {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Hook for real-time agent session data using Firestore listeners
 * Replaces HTTP calls to /session/:sessionId endpoint
 */
export function useAgentSession(
  sessionId: string | null | undefined,
  userId: string | null | undefined
): UseAgentSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use ref to track if we've successfully loaded at least once
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Reset state when sessionId or userId changes
    setSession(null);
    setIsLoading(true);
    setError(null);
    setIsConnected(false);
    hasLoadedRef.current = false;

    // Don't start listener if missing required parameters
    if (!sessionId || !userId) {
      setIsLoading(false);
      if (sessionId && !userId) {
        setError("User ID is required");
      }
      return;
    }

    console.log(`🔄 Setting up realtime listener for session: ${sessionId}`);

    const sessionRef = doc(db, "agent-creation-sessions", sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnapshot) => {
        setIsConnected(true);

        if (!docSnapshot.exists()) {
          if (hasLoadedRef.current) {
            setError("Session not found");
          } else {
            // On first load, this might just mean the session hasn't been created yet
            console.log(
              `⏳ Session ${sessionId} doesn't exist yet, waiting...`
            );
          }
          setIsLoading(false);
          return;
        }

        const data = docSnapshot.data();

        // Validate that this session belongs to the current user
        if (data.userId !== userId) {
          setError("Unauthorized access to session");
          setIsLoading(false);
          return;
        }

        // Transform the Firestore document to match the expected API format
        const sessionData: SessionData = {
          sessionId: data.sessionId || sessionId,
          messages: data.messages || [],
          status: data.status || "active",
          createdAt: data.createdAt,
          userPrompt: data.userPrompt || "",
          lastRawResponse: data.lastRawResponse || null,
          agentData: data.agentData || null,
          userRisk: data.userRisk,
          userFrequency: data.userFrequency,
          userId: data.userId,
          lastUpdated: data.lastUpdated,
          suggestions: data.suggestions || [],
        };

        console.log(`✅ Received realtime update for session ${sessionId}:`, {
          messageCount: sessionData.messages.length,
          status: sessionData.status,
          hasAgentData: !!sessionData.agentData,
          isComplete: sessionData.agentData?.isComplete,
        });

        setSession(sessionData);
        setError(null);
        setIsLoading(false);
        hasLoadedRef.current = true;
      },
      (error: FirestoreError) => {
        console.error(
          `❌ Firestore listener error for session ${sessionId}:`,
          error
        );
        setIsConnected(false);

        // Provide user-friendly error messages
        let errorMessage = "Failed to load session data";

        if (error.code === "permission-denied") {
          errorMessage = "Permission denied - please check your authentication";
        } else if (error.code === "unavailable") {
          errorMessage = "Service temporarily unavailable - please try again";
        } else if (error.code === "not-found") {
          errorMessage = "Session not found";
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount or dependency change
    return () => {
      console.log(`🔄 Cleaning up realtime listener for session: ${sessionId}`);
      unsubscribe();
    };
  }, [sessionId, userId]);

  return {
    session,
    isLoading,
    error,
    isConnected,
  };
}
