"use client";

import { ScoreCardGeneric } from "@/components/black-swan/score-card-generic";
import { useHomeSSEContext } from "@/contexts/home-sse-context";

interface BlackswanScoreCardProps {
  showExternalLink?: boolean;
}

export function BlackswanScoreCard({
  showExternalLink = true,
}: BlackswanScoreCardProps) {
  const { data, isLoading, error } = useHomeSSEContext();

  const currentScore = data?.blackswan?.score ?? 0;
  const scoreChange = data?.blackswan?.change ?? 0;
  const timestamp = data?.blackswan?.timestamp ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getCharacterImage = (score: number) => {
    if (score >= 80) return "/avatars/blackswan/5.png"; // GTFO
    if (score >= 60) return "/avatars/blackswan/4.png"; // SELL
    if (score >= 40) return "/avatars/blackswan/3.png"; // SHAKY
    if (score >= 20) return "/avatars/blackswan/2.png"; // CAUTION
    return "/avatars/blackswan/1.png"; // GOOD TIMES
  };

  return (
    <ScoreCardGeneric
      title="Black Swan Score"
      value={currentScore}
      getColorClass={getScoreColor}
      showExternalLink={showExternalLink}
      externalHref="/swan"
      externalLabel="Black Swan"
      isLoading={isLoading}
      error={error}
      change={scoreChange}
      characterImage={getCharacterImage(currentScore)}
      timestamp={timestamp}
    />
  );
}
