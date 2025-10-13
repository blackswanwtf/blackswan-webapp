"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface LatestAnalysisData {
  blackSwanScore: number;
  timestamp: number;
  confidence: string;
  analysisSummary: string;
}

interface FirestoreAnalysisDoc {
  certainty?: number;
  analysis?: string;
  blackswan_score?: number;
  timestamp?: string;
  createdAt?: {
    __time__: string;
  };
  current_market_indicators?: string[];
  primary_risk_factors?: string[];
  reasoning?: string;
  [key: string]: any; // Other fields we don't care about
}

export function useLatestAnalysis() {
  const [data, setData] = useState<LatestAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "🔄 Setting up real-time listener for latest analysis",
      new Date().toISOString()
    );

    // Query for the most recent document in blackswan_analyses collection
    const analysisRef = collection(db, "blackswan_analyses");
    const q = query(
      analysisRef,
      orderBy("createdAt", "desc"), // Get most recent first
      limit(1) // Only get the latest one
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "📊 Analysis snapshot received:",
          snapshot.size,
          "documents",
          new Date().toISOString()
        );

        if (snapshot.empty) {
          console.log("⚠️ No analysis documents found");
          setError("No analysis data available");
          setIsLoading(false);
          return;
        }

        const doc = snapshot.docs[0];
        const rawData = doc.data() as FirestoreAnalysisDoc;

        console.log("📄 Raw document data keys:", Object.keys(rawData));
        console.log("📄 Raw document data sample:", {
          blackswan_score: rawData.blackswan_score,
          certainty: rawData.certainty,
          certainty_type: typeof rawData.certainty,
          timestamp: rawData.timestamp,
          timestamp_type: typeof rawData.timestamp,
          createdAt: rawData.createdAt,
          analysis: rawData.analysis ? "present" : "missing",
        });
        console.log(
          "🔍 Analysis field:",
          rawData.analysis ? "present" : "missing"
        );

        // Manual field filtering - only extract what we need
        // Convert timestamp from string to number (milliseconds since epoch)
        let timestampMs = 0;
        if (rawData.timestamp) {
          timestampMs = new Date(rawData.timestamp).getTime();
        } else if (rawData.createdAt?.__time__) {
          timestampMs = new Date(rawData.createdAt.__time__).getTime();
        }

        // Convert certainty number to confidence string
        const getConfidenceLevel = (certainty: number): string => {
          if (certainty >= 90) return "very high";
          if (certainty >= 70) return "high";
          if (certainty >= 50) return "medium";
          if (certainty >= 30) return "low";
          if (certainty >= 10) return "very low";
          return "unknown";
        };

        const filteredData: LatestAnalysisData = {
          blackSwanScore: rawData.blackswan_score || 0,
          timestamp: timestampMs,
          confidence: getConfidenceLevel(rawData.certainty || 0),
          analysisSummary: rawData.analysis || "No analysis available",
        };

        console.log("✅ Filtered analysis data:", {
          blackSwanScore: filteredData.blackSwanScore,
          confidence: filteredData.confidence,
          timestamp: new Date(filteredData.timestamp).toISOString(),
          summaryLength: filteredData.analysisSummary.length,
        });

        setData(filteredData);
        setError(null);
        setIsLoading(false);
      },
      (firestoreError) => {
        console.error("❌ Firestore listener error:", firestoreError);
        setError(`Failed to load analysis: ${firestoreError.message}`);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("🔌 Cleaning up analysis listener");
      unsubscribe();
    };
  }, []);

  return { data, isLoading, error };
}

// Utility function to convert black swan probability to market signal level
export function convertBlackSwanToMarketSignal(blackSwanScore: string): number {
  const score = parseFloat(blackSwanScore);

  // Direct 1:1 mapping of black swan score to market signal level
  // Higher black swan score = higher sell signal
  // 0-20: GOOD TIMES
  // 21-40: CAUTION
  // 41-60: SHAKY
  // 61-80: SELL
  // 81-100: GTFO

  // Clamp the score between 0 and 100 to ensure it's within valid range
  return Math.max(0, Math.min(100, score));
}
