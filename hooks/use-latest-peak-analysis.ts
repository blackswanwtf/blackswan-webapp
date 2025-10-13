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

export interface LatestPeakAnalysisData {
  score: number;
  timestamp: number;
  analysis: string;
  keyFactors: string[];
  reasoning: string[];
}

interface FirestorePeakAnalysisDoc {
  score?: number;
  analysis?: string;
  timestamp?: string;
  createdAt?: {
    __time__: string;
  };
  key_factors?: string[];
  reasoning?: string[];
  [key: string]: any; // Other fields we don't care about
}

export function useLatestPeakAnalysis() {
  const [data, setData] = useState<LatestPeakAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "🔄 Setting up real-time listener for latest market peak analysis",
      new Date().toISOString()
    );

    // Query for the most recent document in market_peak_analyses collection
    const analysisRef = collection(db, "market_peak_analyses");
    const q = query(
      analysisRef,
      orderBy("createdAt", "desc"), // Get most recent first
      limit(1) // Only get the latest one
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "📊 Peak analysis snapshot received:",
          snapshot.size,
          "documents",
          new Date().toISOString()
        );

        if (snapshot.empty) {
          console.log("⚠️ No market peak analysis documents found");
          setError("No market peak analysis data available");
          setIsLoading(false);
          return;
        }

        const doc = snapshot.docs[0];
        const rawData = doc.data() as FirestorePeakAnalysisDoc;

        console.log("📄 Raw peak document data keys:", Object.keys(rawData));
        console.log("📄 Raw peak document data sample:", {
          score: rawData.score,
          score_type: typeof rawData.score,
          timestamp: rawData.timestamp,
          timestamp_type: typeof rawData.timestamp,
          createdAt: rawData.createdAt,
          analysis: rawData.analysis ? "present" : "missing",
          key_factors: rawData.key_factors ? rawData.key_factors.length : 0,
          reasoning: rawData.reasoning ? rawData.reasoning.length : 0,
        });
        console.log(
          "🔍 Peak analysis field:",
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

        const filteredData: LatestPeakAnalysisData = {
          score: rawData.score || 0,
          timestamp: timestampMs,
          analysis: rawData.analysis || "No analysis available",
          keyFactors: rawData.key_factors || [],
          reasoning: rawData.reasoning || [],
        };

        console.log("✅ Filtered peak analysis data:", {
          score: filteredData.score,
          timestamp: new Date(filteredData.timestamp).toISOString(),
          analysisLength: filteredData.analysis.length,
          keyFactorsCount: filteredData.keyFactors.length,
          reasoningCount: filteredData.reasoning.length,
        });

        setData(filteredData);
        setError(null);
        setIsLoading(false);
      },
      (firestoreError) => {
        console.error(
          "❌ Firestore peak analysis listener error:",
          firestoreError
        );
        setError(`Failed to load peak analysis: ${firestoreError.message}`);
        setIsLoading(false);
      }
    );

    return () => {
      console.log("🔌 Cleaning up peak analysis listener");
      unsubscribe();
    };
  }, []);

  return { data, isLoading, error };
}

// Utility function to get peak status based on score
export function getPeakStatus(score: number): string {
  if (score >= 80) return "ONE WAY DOWN";
  if (score >= 60) return "HOLYF$%K";
  if (score >= 40) return "TAKE PROFITS";
  if (score >= 20) return "BULL SZN";
  return "CALM";
}

// Utility function to get peak status color
export function getPeakStatusColor(score: number): string {
  if (score >= 80) return "text-red-600";
  if (score >= 60) return "text-red-500";
  if (score >= 40) return "text-orange-500";
  if (score >= 20) return "text-yellow-500";
  return "text-green-500";
}
