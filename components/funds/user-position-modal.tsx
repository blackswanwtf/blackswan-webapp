"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ExternalLink,
  X,
} from "lucide-react";
import { UserFundPosition } from "@/lib/types/funds";
import { useUserPerformance } from "@/hooks/use-user-performance";
import { useClosedTrades } from "@/hooks/use-closed-trades";
import { format } from "date-fns";

interface UserPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFundPosition: UserFundPosition | null;
  uid: string | null;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export function UserPositionModal({
  isOpen,
  onClose,
  userFundPosition,
  uid,
}: UserPositionModalProps) {
  // Get enhanced user performance data if available
  const { data: userPerformanceData, isLoading: performanceLoading } =
    useUserPerformance(uid, userFundPosition?.fund.apiId || "v2");

  // Get closed trades for this fund
  const { closedTrades, isLoading: tradesLoading } = useClosedTrades(
    userFundPosition?.fund.contractAddress || null
  );

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (percent: number): string => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    try {
      return format(date, "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Format time
  const formatTime = (date: Date): string => {
    try {
      return format(date, "hh:mm a");
    } catch {
      return "Invalid time";
    }
  };

  // Use enhanced performance data if available, otherwise fall back to calculated values
  const enhancedPositionData = useMemo(() => {
    if (!userFundPosition) return null;

    // If we have performance data from the API, use that for more accurate values
    if (userPerformanceData && !performanceLoading) {
      return {
        totalDeposited: userPerformanceData.totalMoneyIn,
        currentValue: userPerformanceData.totalExpectedOut,
        totalWithdrawn: userPerformanceData.breakdown.totalWithdrawn,
        profitLoss: userPerformanceData.profitAmount,
        profitLossPercentage: userPerformanceData.profitPercentage,
        availableForWithdrawal:
          userPerformanceData.breakdown.availableForWithdrawal,
        currentValueInTrades:
          userPerformanceData.breakdown.currentValueInActiveTrades,
        unrealizedPnL: userPerformanceData.breakdown.unrealizedPnL,
        lastUpdated: userPerformanceData.timestamp,
      };
    }

    // Fall back to calculated values from positions
    return {
      totalDeposited: userFundPosition.totalDeposited,
      currentValue: userFundPosition.currentValue,
      totalWithdrawn: userFundPosition.totalWithdrawn,
      profitLoss: userFundPosition.profitLoss,
      profitLossPercentage: userFundPosition.profitLossPercentage,
      availableForWithdrawal: 0, // Not available from basic calculation
      currentValueInTrades: userFundPosition.currentValue,
      unrealizedPnL: userFundPosition.profitLoss,
      lastUpdated: new Date().toISOString(),
    };
  }, [userFundPosition, userPerformanceData, performanceLoading]);

  if (!userFundPosition || !enhancedPositionData) {
    return null;
  }

  const { fund } = userFundPosition;
  const { totalDeposited, currentValue, profitLoss, profitLossPercentage } =
    enhancedPositionData;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-4xl mx-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-8 text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="text-left mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-semibold">{fund.name}</h2>
              </div>
              <p className="text-zinc-400 text-sm">
                Detailed view of your investment position and performance
              </p>
            </div>

            <div className="space-y-12">
              {/* Investment Overview - Simplified to 2 cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Investment */}
                <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                    <span className="text-zinc-400 font-medium">
                      Your Investment
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(totalDeposited)}
                  </p>
                  <p className="text-sm text-zinc-500">
                    Total deposited amount
                  </p>
                </div>

                {/* Current Value */}
                <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {profitLoss >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-zinc-400 font-medium">
                      Current Value
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(currentValue)}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      profitLoss >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatPercentage(profitLossPercentage)} (
                    {formatCurrency(profitLoss)})
                  </p>
                  {performanceLoading && (
                    <p className="text-xs text-zinc-500 mt-1">Updating...</p>
                  )}
                </div>
              </div>

              {/* Closed Trades Section */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Closed Trades
                </h3>
                <div className="bg-zinc-800/30 rounded-xl border border-zinc-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                        <TableHead className="text-zinc-300 font-medium">
                          Token
                        </TableHead>
                        <TableHead className="text-zinc-300 font-medium">
                          Buy Price
                        </TableHead>
                        <TableHead className="text-zinc-300 font-medium">
                          Sell Price
                        </TableHead>
                        <TableHead className="text-zinc-300 font-medium">
                          PNL
                        </TableHead>
                        <TableHead className="text-zinc-300 font-medium">
                          Date Closed
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tradesLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-zinc-500"
                          >
                            Loading closed trades...
                          </TableCell>
                        </TableRow>
                      ) : closedTrades.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-zinc-500"
                          >
                            No closed trades available yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        closedTrades.map((trade) => (
                          <TableRow
                            key={trade.id}
                            className="border-zinc-700 hover:bg-zinc-800/30"
                          >
                            <TableCell className="text-white">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={trade.tokenImage}
                                    alt={trade.tokenName}
                                  />
                                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                                    {trade.tokenSymbol.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">
                                    {trade.tokenName}
                                  </span>
                                  <span className="text-zinc-500 text-xs">
                                    {trade.tokenSymbol}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              $
                              {trade.buyPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 6,
                              })}
                            </TableCell>
                            <TableCell className="text-white">
                              $
                              {trade.sellPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 6,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {trade.pnl >= 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-400" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <div className="flex flex-col">
                                  <span
                                    className={`font-medium text-sm ${
                                      trade.pnl >= 0
                                        ? "text-green-400"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {formatCurrency(Math.abs(trade.pnl))}
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      trade.pnl >= 0
                                        ? "text-green-400/70"
                                        : "text-red-500/70"
                                    }`}
                                  >
                                    {trade.pnlPercentage >= 0 ? "+" : ""}
                                    {trade.pnlPercentage.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {formatDate(trade.dateClosed)}
                                </span>
                                <span className="text-zinc-500 text-xs">
                                  {formatTime(trade.dateClosed)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
