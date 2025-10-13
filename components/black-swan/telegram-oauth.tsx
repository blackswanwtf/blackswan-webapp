"use client";

import { useState, useEffect } from "react";
import { useImprovedAuth } from "@/providers/authentication";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { config } from "@/lib/config";
import { LoginButton } from "@telegram-auth/react";
import { FaTelegram } from "react-icons/fa";

// Telegram OAuth types
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramOAuthData {
  uid: string;
  telegramUserId: number;
  telegramUsername?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  connectedAt: any; // Firestore timestamp
  isActive: boolean;
  isBlocked: boolean;
}

export function TelegramOAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [telegramData, setTelegramData] = useState<TelegramOAuthData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { currentUser } = useImprovedAuth();
  const { toast } = useToast();
  // Real-time listener for Telegram OAuth connection status
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsConnected(false);
      setTelegramData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log(
      "🔗 Setting up real-time listener for Telegram OAuth:",
      currentUser.uid
    );

    const docRef = doc(db, "telegram_oauth", currentUser.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        console.log(
          "📱 Telegram OAuth listener update:",
          doc.exists() ? "connected" : "disconnected"
        );

        if (doc.exists()) {
          const data = doc.data() as TelegramOAuthData;

          // Check if the connection is active and not blocked
          if (data.isActive && !data.isBlocked) {
            setIsConnected(true);
            setTelegramData(data);
            console.log(
              "✅ Telegram connected:",
              data.telegramUsername || data.firstName
            );
          } else {
            setIsConnected(false);
            setTelegramData(null);
            console.log("❌ Telegram connection inactive or blocked");
          }
        } else {
          setIsConnected(false);
          setTelegramData(null);
          console.log("❌ No Telegram OAuth document found");
        }

        setIsLoading(false);
      },
      (error) => {
        console.error("❌ Telegram OAuth listener error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to monitor Telegram connection status",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount or user change
    return () => {
      console.log("🧹 Cleaning up Telegram OAuth listener");
      unsubscribe();
    };
  }, [currentUser?.uid, toast]);

  // Console logging the user's Telegram data if we have it in the database.
  console.log("Telegram data:", telegramData);

  // Handle Telegram OAuth callback using @telegram-auth/react
  const handleTelegramAuth = async (user: TelegramUser) => {
    if (!currentUser?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in first to connect your Telegram account.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    console.log("📱 Telegram OAuth successful:", user);

    try {
      // Send OAuth data to backend for verification and storage
      const response = await fetch(
        `${config.services.userAuth}/telegram/oauth/callback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: currentUser.uid,
            ...user, // Spread the Telegram user data
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Telegram OAuth stored successfully");
        // State will be updated automatically by the real-time listener

        toast({
          title: "Telegram Connected!",
          description: `Your account @${
            user.username || user.first_name
          } has been connected successfully.`,
        });
      } else {
        throw new Error(result.error || "Failed to connect Telegram account");
      }
    } catch (error) {
      console.error("❌ Failed to connect Telegram:", error);
      toast({
        title: "Connection Failed",
        description:
          "Failed to connect your Telegram account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser || !telegramData) return;

    setIsDisconnecting(true);
    try {
      // Disconnect via user-auth-service API
      const response = await fetch(
        `${config.services.userAuth}/telegram/disconnect/${currentUser.uid}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // State will be updated automatically by the real-time listener

        toast({
          title: "Telegram Disconnected",
          description:
            "Your Telegram account has been disconnected from notifications.",
        });
      } else {
        throw new Error(
          result.error || "Failed to disconnect Telegram account"
        );
      }
    } catch (error) {
      console.error("Failed to disconnect Telegram:", error);
      toast({
        title: "Disconnection Failed",
        description:
          "Failed to disconnect your Telegram account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 h-full">
        <div className="flex flex-col h-full">
          <div className="flex-1 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <FaTelegram className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-medium text-white">Telegram</h3>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-xs text-zinc-400">
                Checking connection...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 h-full">
        <div className="flex flex-col h-full">
          <div className="flex-1 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <FaTelegram className="w-4 h-4 text-white/90" />
              <h3 className="text-sm font-medium text-white">Telegram</h3>
            </div>
            <p className="text-xs text-zinc-400 break-words">
              {isConnected
                ? `Connected as ${
                    telegramData?.telegramUsername
                      ? "@" + telegramData.telegramUsername
                      : telegramData?.firstName
                  }`
                : "Connect your Telegram to receive notifications"}
            </p>
          </div>

          <div className="flex justify-end">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="bg-transparent border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white whitespace-nowrap"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            ) : (
              <LoginButton
                botUsername={config.telegram.botUsername}
                onAuthCallback={handleTelegramAuth}
                buttonSize="medium"
                cornerRadius={3}
                requestAccess="write"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
