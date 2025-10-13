"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id: string;
  analysisId: string;
  message: string;
  originalUrgency: string;
  enhancedUrgency: string;
  blackswanScore: number;
  severityLevel: number;
  confidenceLevel: string;
  affectedMarkets: string[];
  isSignificantChange: boolean;
  delivered: boolean;
  readAt: any;
  createdAt: any;
  processedAt: number;
  changeDetails?: {
    hasSignificantChange: boolean;
    changeType: string;
    details: string;
  };
  metadata?: {
    sourceAnalysisTimestamp: number;
    processingVersion: string;
    processingTimestamp: number;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔔 [NOTIFICATIONS] Setting up Firestore listener...");

    // Create query for latest 20 notifications ordered by processedAt (most recent first)
    const notificationsQuery = query(
      collection(db, "notification_events"),
      orderBy("processedAt", "desc"),
      limit(20)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        try {
          console.log(
            `🔔 [NOTIFICATIONS] Received ${snapshot.docs.length} notifications from Firestore`
          );

          const notificationsList: Notification[] = snapshot.docs.map(
            (doc: QueryDocumentSnapshot<DocumentData>) => {
              const data = doc.data();
              return {
                id: doc.id,
                analysisId: data.analysisId || "",
                message: data.message || "New analysis completed",
                originalUrgency: data.originalUrgency || "routine",
                enhancedUrgency: data.enhancedUrgency || "routine",
                blackswanScore: data.blackswanScore || 0,
                severityLevel: data.severityLevel || 1,
                confidenceLevel: data.confidenceLevel || "low",
                affectedMarkets: data.affectedMarkets || [],
                isSignificantChange: data.isSignificantChange || false,
                delivered: data.delivered || false,
                readAt: data.readAt || null,
                createdAt: data.createdAt || null,
                processedAt: data.processedAt || Date.now(),
                changeDetails: data.changeDetails,
                metadata: data.metadata,
              };
            }
          );

          setNotifications(notificationsList);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("❌ [NOTIFICATIONS] Error processing snapshot:", err);
          setError("Failed to process notifications");
          setLoading(false);
        }
      },
      (err) => {
        console.error("❌ [NOTIFICATIONS] Firestore listener error:", err);
        setError("Failed to connect to notifications");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("🔔 [NOTIFICATIONS] Cleaning up Firestore listener");
      unsubscribe();
    };
  }, []);

  return {
    notifications,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      setError(null);
    },
  };
}
