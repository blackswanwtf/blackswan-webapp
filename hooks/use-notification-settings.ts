"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { useToast } from "./use-toast";

export interface NotificationSettings {
  daily_summary: boolean;
  blackswan_threshold_enabled: boolean;
  blackswan_threshold: number;
  blackswan_telegram_enabled: boolean;
  peak_threshold_enabled: boolean;
  peak_threshold: number;
  peak_telegram_enabled: boolean;
  market_status_changes: boolean;
  telegram_notifications: boolean; // Keep for backward compatibility
  lastUpdated?: any; // Firestore timestamp
  uid?: string;
}

const defaultSettings: NotificationSettings = {
  // Default Settings For New Users
  daily_summary: true,
  blackswan_threshold_enabled: false,
  blackswan_threshold: 0,
  blackswan_telegram_enabled: false,
  peak_threshold_enabled: false,
  peak_threshold: 0,
  peak_telegram_enabled: false,
  market_status_changes: false,
  telegram_notifications: false, // Keep for backward compatibility
};

export function useNotificationSettings() {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Load settings from Firestore on mount and set up real-time listener
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "notification_preferences", currentUser.uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data() as NotificationSettings;
            // Merge with defaults to ensure all fields exist
            const mergedSettings: NotificationSettings = {
              ...defaultSettings,
              ...data,
            };
            setSettings(mergedSettings);
          } else {
            // No document exists, use defaults and create it
            setSettings(defaultSettings);
            // Initialize with defaults
            const initialData = {
              ...defaultSettings,
              uid: currentUser.uid,
              lastUpdated: new Date(),
            };
            setDoc(docRef, initialData, { merge: true }).catch((error) => {
              console.error(
                "Error initializing notification preferences:",
                error
              );
            });
          }
        } catch (error) {
          console.error("Error processing notification settings:", error);
          toast({
            title: "Error",
            description: "Failed to load notification settings",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to notification settings:", error);
        toast({
          title: "Error",
          description: "Failed to sync notification settings",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, toast]);

  // Update individual settings (automatically saves to Firestore)
  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean | number
  ) => {
    console.log("updateSetting", key, value);
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please log in to update notification settings",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const docRef = doc(db, "notification_preferences", currentUser.uid);
      await setDoc(
        docRef,
        {
          [key]: value,
          uid: currentUser.uid,
          lastUpdated: new Date(),
        },
        { merge: true }
      );

      // The real-time listener will automatically update the UI
    } catch (error) {
      console.error("Failed to save notification setting:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save notification setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    updating,
    updateSetting,
  };
}
