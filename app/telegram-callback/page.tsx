"use client";

import { useEffect } from "react";

export default function TelegramCallbackPage() {
  useEffect(() => {
    console.log("📥 Telegram callback page loaded");
    console.log("🔍 Current URL:", window.location.href);
    console.log("🔍 URL Search Params:", window.location.search);

    if (typeof window === "undefined") return;

    // Extract OAuth parameters from URL
    const urlParams = new URLSearchParams(window.location.search);

    const telegramData = {
      id: urlParams.get("id"),
      first_name: urlParams.get("first_name"),
      last_name: urlParams.get("last_name"),
      username: urlParams.get("username"),
      photo_url: urlParams.get("photo_url"),
      auth_date: urlParams.get("auth_date"),
      hash: urlParams.get("hash"),
    };

    console.log("🔍 Extracted Telegram data:", telegramData);

    // Check if we have the minimum required data
    if (telegramData.id && telegramData.hash && telegramData.auth_date) {
      console.log(
        "✅ Valid Telegram auth data found, sending to parent window"
      );

      // Convert to the expected format
      const userData = {
        id: parseInt(telegramData.id),
        first_name: telegramData.first_name || "",
        last_name: telegramData.last_name || "",
        username: telegramData.username || "",
        photo_url: telegramData.photo_url || "",
        auth_date: parseInt(telegramData.auth_date),
        hash: telegramData.hash,
      };

      // Send data to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "TELEGRAM_OAUTH_SUCCESS",
            userData: userData,
          },
          window.location.origin
        );
        console.log("📤 OAuth data sent to parent window");

        // Close the popup
        window.close();
      } else {
        console.error("❌ No parent window found");
      }
    } else {
      console.log("❌ Incomplete Telegram auth data");
      console.log(
        "🔍 Available URL params:",
        Object.fromEntries(urlParams.entries())
      );
      console.log("🔍 This could mean:");
      console.log("   - User cancelled authentication");
      console.log("   - Bot is not configured for web authentication");
      console.log("   - OAuth URL parameters are missing");

      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "TELEGRAM_OAUTH_ERROR",
            error: "Incomplete authentication data",
            debug: {
              url: window.location.href,
              params: Object.fromEntries(urlParams.entries()),
            },
          },
          window.location.origin
        );

        // Close the popup after a short delay to allow reading logs
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        // If no opener (debug mode), show error on page
        document.body.innerHTML = `
          <div style="color: white; background: black; padding: 20px; font-family: monospace;">
            <h2>⚠️ Telegram OAuth Debug</h2>
            <p><strong>Status:</strong> Callback page loaded but no OAuth data received</p>
            <p><strong>URL:</strong> ${window.location.href}</p>
            <p><strong>Params:</strong> ${window.location.search || "None"}</p>
            <p><strong>Possible causes:</strong></p>
            <ul>
              <li>Bot not configured for web authentication in BotFather</li>
              <li>Domain not added to bot settings</li>
              <li>User cancelled authentication</li>
              <li>Bot ID mismatch</li>
            </ul>
            <p>Check the console for more details.</p>
          </div>
        `;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-sm">
          Completing Telegram authentication...
        </p>
        <p className="text-zinc-400 text-xs mt-2">
          This window will close automatically.
        </p>
      </div>
    </div>
  );
}
