import { useIsMobile } from "@/hooks/use-mobile";

export interface ChartConfig {
  fontSize: number;
  yAxisWidth: number;
  margins: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
  maxTicks: number;
  tickRotation?: number;
}

/**
 * Hook to provide mobile-responsive chart configuration
 * Adjusts font sizes, margins, and tick counts for better mobile readability
 */
export function useMobileChartConfig(): ChartConfig {
  const isMobile = useIsMobile();

  if (isMobile) {
    return {
      fontSize: 10,
      yAxisWidth: 30,
      margins: {
        top: 10,
        right: 15,
        left: 5,
        bottom: 25, // Extra space for rotated labels
      },
      maxTicks: 4, // Fewer ticks on mobile to prevent crowding
      tickRotation: 0, // Rotate labels for better fit
    };
  }

  return {
    fontSize: 12,
    yAxisWidth: 35,
    margins: {
      top: 5,
      right: 30,
      left: 5,
      bottom: 5,
    },
    maxTicks: 10, // More ticks on desktop
    tickRotation: 0, // No rotation needed
  };
}

/**
 * Get mobile-optimized X-axis configuration based on data range and screen size
 */
export function getMobileOptimizedXAxisConfig(
  data: any[],
  isMobile: boolean
): {
  interval: number | "preserveStartEnd" | "preserveStart" | "preserveEnd";
  tickCount: number;
} {
  if (!data || data.length === 0) {
    return {
      interval: "preserveStartEnd" as const,
      tickCount: isMobile ? 3 : 5,
    };
  }

  const timestamps = data.map((d) => d.timestamp).sort((a, b) => a - b);
  const startTime = timestamps[0];
  const endTime = timestamps[timestamps.length - 1];
  const rangeHours = (endTime - startTime) / (1000 * 60 * 60);
  const rangeDays = rangeHours / 24;

  // Mobile gets fewer ticks to prevent crowding
  const maxTicks = isMobile ? 4 : 10;

  // Determine optimal tick interval based on data range and screen size
  if (rangeDays <= 1) {
    // Less than 1 day: show hours
    const optimalTicks = isMobile ? 3 : 8;
    return {
      interval: Math.max(1, Math.floor(data.length / optimalTicks)),
      tickCount: optimalTicks,
    };
  } else if (rangeDays <= 7) {
    // 1-7 days: show days
    const optimalTicks = isMobile ? 3 : 7;
    return {
      interval: Math.max(1, Math.floor(data.length / optimalTicks)),
      tickCount: optimalTicks,
    };
  } else if (rangeDays <= 30) {
    // 1-30 days: show every few days
    const optimalTicks = isMobile ? 4 : 10;
    return {
      interval: Math.max(1, Math.floor(data.length / optimalTicks)),
      tickCount: optimalTicks,
    };
  } else {
    // More than 30 days: show weeks
    const optimalTicks = isMobile ? 3 : 8;
    return {
      interval: Math.max(1, Math.floor(data.length / optimalTicks)),
      tickCount: optimalTicks,
    };
  }
}

/**
 * Get mobile-optimized date formatter that shortens labels for mobile
 */
export function getMobileOptimizedDateFormatter(
  data: any[],
  isMobile: boolean
) {
  if (!data || data.length === 0) {
    return (value: string) => value.split("_")[0];
  }

  const timestamps = data.map((d) => d.timestamp).sort((a, b) => a - b);
  const startTime = timestamps[0];
  const endTime = timestamps[timestamps.length - 1];
  const rangeHours = (endTime - startTime) / (1000 * 60 * 60);
  const rangeDays = rangeHours / 24;

  return (value: string) => {
    // Extract timestamp from the unique key
    const timestampStr = value.split("_")[1];
    if (!timestampStr) return value.split("_")[0];

    const date = new Date(parseInt(timestampStr));

    if (rangeDays <= 1) {
      // Less than 1 day: show time
      if (isMobile) {
        // Shorter format for mobile
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          hour12: false,
        });
      }
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (rangeDays <= 7) {
      // 1-7 days: show day
      if (isMobile) {
        // Even shorter format for mobile
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      // More than 7 days: show date
      if (isMobile) {
        // Shortest format for mobile
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };
}
