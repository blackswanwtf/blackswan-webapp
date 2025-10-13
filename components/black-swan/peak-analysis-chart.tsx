"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePeakChartData } from "@/hooks/use-peak-chart-data";
import { useImprovedAuth } from "@/providers/authentication";
import {
  useMobileChartConfig,
  getMobileOptimizedXAxisConfig,
  getMobileOptimizedDateFormatter,
} from "@/hooks/use-mobile-chart-config";
import { useIsMobile } from "@/hooks/use-mobile";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const score = payload[0].value;
    const fullDate = new Date(data.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Determine market signal
    const getPeakMarketSignal = (score: number): string => {
      if (score >= 80) return "ONE WAY DOWN";
      if (score >= 60) return "HOLYF$%K";
      if (score >= 40) return "TAKE PROFITS";
      if (score >= 20) return "BULL SZN";
      return "CALM";
    };

    const getSignalColor = (signal: string): string => {
      switch (signal) {
        case "CALM":
          return "text-green-500";
        case "BULL SZN":
          return "text-green-400";
        case "TAKE PROFITS":
          return "text-yellow-400";
        case "HOLYF$%K":
          return "text-orange-400";
        case "ONE WAY DOWN":
          return "text-red-500";
        default:
          return "text-zinc-400";
      }
    };

    const marketSignal = getPeakMarketSignal(score);

    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-zinc-400 mb-1">{fullDate}</p>
        <p className="text-sm font-semibold text-white mb-1">
          Market Peak Score:{" "}
          <span className="text-white">{Math.round(score)}</span>
        </p>
        <p className={`text-sm font-semibold ${getSignalColor(marketSignal)}`}>
          Signal: {marketSignal}
        </p>
      </div>
    );
  }
  return null;
};

export function PeakAnalysisChart() {
  const { accountType } = useImprovedAuth();
  const { data, isLoading, error } = usePeakChartData();
  const isMobile = useIsMobile();
  const chartConfig = useMobileChartConfig();

  // Get mobile-optimized axis configuration
  const xAxisConfig = getMobileOptimizedXAxisConfig(data || [], isMobile);
  const smartDateFormatter = getMobileOptimizedDateFormatter(
    data || [],
    isMobile
  );

  // Free user check - don't render anything
  if (accountType === "free") {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-sm text-zinc-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h4 className="text-lg font-medium text-white mb-2">
            Unable to Load Chart Data
          </h4>
          <p className="text-sm text-zinc-400">
            Please check your connection and try again
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <h4 className="text-lg font-medium text-white mb-2">
            No Chart Data Available
          </h4>
          <p className="text-sm text-zinc-400">
            No market peak analysis data found for the last 30 days
          </p>
        </div>
      </div>
    );
  }

  // Calculate score statistics
  const scores = data.map((d) => d.peakScore);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const avgScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;

  // Calculate dynamic Y-axis domain (max + 5 buffer)
  const yAxisMax = Math.min(100, maxScore + 5); // Cap at 100 since Peak score is 0-100
  const yAxisMin = Math.max(0); // Small buffer below, but don't go below 0

  // Debug log to see actual data count and range
  if (data.length > 0) {
    const timestamps = data.map((d) => d.timestamp).sort((a, b) => a - b);
    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const rangeHours = (endTime - startTime) / (1000 * 60 * 60);
    const rangeDays = rangeHours / 24;

    console.log(`📊 Peak chart rendering with ${data.length} data points`);
    console.log(
      `📅 Date range: ${rangeDays.toFixed(1)} days (${rangeHours.toFixed(
        1
      )} hours)`
    );
    console.log(`📅 From: ${new Date(startTime).toLocaleString()}`);
    console.log(`📅 To: ${new Date(endTime).toLocaleString()}`);
    console.log(`⚙️ X-axis config:`, xAxisConfig);
    console.log(
      `📈 Y-axis range: ${yAxisMin} - ${yAxisMax} (data: ${minScore.toFixed(
        1
      )} - ${maxScore.toFixed(1)})`
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      {/* Chart */}
      <div className={`h-80 w-full ${isMobile ? "overflow-x-auto" : "-ml-2"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartConfig.margins} syncId="chart">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              fontSize={chartConfig.fontSize}
              tick={{
                fill: "#9CA3AF",
                textAnchor: chartConfig.tickRotation ? "end" : "middle",
              }}
              angle={chartConfig.tickRotation}
              interval={xAxisConfig.interval}
              tickFormatter={smartDateFormatter}
              height={isMobile ? 50 : 30} // Extra height for rotated labels on mobile
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={chartConfig.fontSize}
              tick={{ fill: "#9CA3AF" }}
              domain={[yAxisMin, yAxisMax]}
              width={chartConfig.yAxisWidth}
              tickFormatter={(value) => `${Math.round(value)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="peakScore"
              stroke="#4499EF"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
