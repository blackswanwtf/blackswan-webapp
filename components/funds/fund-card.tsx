"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FundCardProps } from "@/lib/types/funds";

export function FundCard({
  fund,
  userInvestment,
  userPosition,
  onClick,
  onViewPosition,
  showCardClickForPosition = false,
}: FundCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPerformance = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  const getPerformanceGradient = (value: number) => {
    return value > 0
      ? "bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent"
      : "bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent";
  };

  // Calculate days until unlock
  const calculateDaysUntilUnlock = (unlockDate: string) => {
    const unlock = new Date(unlockDate);
    const today = new Date();
    const diffTime = unlock.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate detailed countdown (days, hours, minutes)
  const calculateCountdown = (date: string) => {
    const unlock = new Date(date);
    const now = new Date();
    const diffTime = unlock.getTime() - now.getTime();

    if (diffTime <= 0) {
      return "ACTIVE";
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}D ${hours}H ${minutes}M`;
    } else if (hours > 0) {
      return `${hours}H ${minutes}M`;
    } else {
      return `${minutes}M`;
    }
  };

  // Handle card click behavior
  const handleCardClick = () => {
    // If user has position and we're on the funds page, open position modal
    if (
      showCardClickForPosition &&
      userPosition?.hasActivePosition &&
      onViewPosition
    ) {
      onViewPosition(userPosition);
    } else {
      // Otherwise, use the default onClick behavior
      onClick();
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden border border-zinc-800/50 shadow-lg relative group cursor-pointer transition-all duration-300 hover:border-zinc-700/50 hover:shadow-xl"
      style={{
        boxShadow:
          "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px",
      }}
      onClick={handleCardClick}
    >
      {/* Background Image */}
      <div className="relative h-[550px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${fund.bannerImage})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      {/* Deposit Status Badge */}
      <div className="absolute top-4 left-4">
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30 px-3 py-1">
          {fund.depositDate && fund.depositsOpen
            ? calculateCountdown(fund.depositDate)
            : "ACTIVE"}
        </Badge>
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="space-y-4">
          {/* Fund Title */}
          <h3 className="text-2xl font-bold mb-4">{fund.name}</h3>

          {/* Fund Stats based on deposit status */}
          {!fund.depositsOpen ? (
            // Deposits are closed - show fund performance and unlock info for all users
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Fund Performance */}
                <div className="transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xl font-bold ${getPerformanceGradient(
                        fund.fundPerformancePercentage || 0
                      )}`}
                    >
                      {formatPerformance(fund.fundPerformancePercentage || 0)}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider font-medium text-white/80">
                    Fund Performance
                  </div>
                </div>

                {/* Days Till Unlock */}
                <div className="transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      {fund.unlockDate
                        ? calculateDaysUntilUnlock(fund.unlockDate)
                        : 0}{" "}
                      Days
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider font-medium text-white/80">
                    Days Till Unlock
                  </div>
                </div>
              </div>
              {/* Show different buttons based on user position */}
              {userPosition?.hasActivePosition && onViewPosition ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when clicking button
                    onViewPosition(userPosition);
                  }}
                  className="w-full text-white border border-zinc-600/20 bg-zinc-800/50 hover:bg-zinc-800/80 backdrop-blur-sm"
                >
                  View Details
                </Button>
              ) : (
                <Button
                  disabled={true}
                  className="w-full text-zinc-400 border-zinc-600/20 backdrop-blur-sm bg-zinc-800/20 cursor-not-allowed group border"
                >
                  Deposits Closed
                </Button>
              )}
            </div>
          ) : (
            // Deposits are open - show investment information
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Max Amount */}
                <div className="transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      $
                      {Number(fund.maximumInvestment).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider font-medium text-white/80">
                    Max Amount
                  </div>
                </div>

                {/* Lock Duration */}
                <div className="transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      {fund.lockDuration}
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wider font-medium text-white/80">
                    Lock Time
                  </div>
                </div>
              </div>
              {/* Show different buttons based on user position */}
              <div className="flex gap-2">
                {userPosition?.hasActivePosition && onViewPosition ? (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when clicking button
                        onViewPosition(userPosition);
                      }}
                      variant="outline"
                      className="flex-1 bg-transparent border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when clicking button
                        onClick();
                      }}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 font-semibold transition-all duration-300"
                    >
                      Invest More
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking button
                      onClick();
                    }}
                    className="w-full bg-white text-black hover:bg-zinc-200 font-semibold transition-all duration-300"
                  >
                    Invest Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
