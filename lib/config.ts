// Black Swan Configuration
export const config = {
  // Service URLs - update these for your deployment
  services: {
    notifications: process.env.NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL,
    userAuth: process.env.NEXT_PUBLIC_USER_AUTH_SERVICE_URL,
    platformApi: process.env.NEXT_PUBLIC_PLATFORM_API_URL,
    pointsApi: process.env.NEXT_PUBLIC_POINTS_API_URL,
  },

  // Telegram configuration
  telegram: {
    botUsername:
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "blkswanfun_bot",
    botId: process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "8182240446",
  },

  // Feature flags
  features: {
    telegramNotifications: true,
    webAppNotifications: true,
    tokenDataServicePaused: false,
  },
} as const;

export default config;
