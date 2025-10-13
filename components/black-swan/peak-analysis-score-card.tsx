"use client";

import { ScoreCardGeneric } from "@/components/black-swan/score-card-generic";
import { useHomeSSEContext } from "@/contexts/home-sse-context";

interface PeakAnalysisScoreCardProps {
  showExternalLink?: boolean;
}

export function PeakAnalysisScoreCard({
  showExternalLink = true,
}: PeakAnalysisScoreCardProps) {
  const { data, isLoading, error } = useHomeSSEContext();
  const currentScore = data?.peak?.score ?? 0;
  const scoreChange = data?.peak?.change ?? 0;
  const timestamp = data?.peak?.timestamp ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getCharacterImage = (score: number) => {
    if (score >= 80) return "/avatars/peak/5.png"; // ONE WAY DOWN
    if (score >= 60) return "/avatars/peak/4.png"; // HOLYF$%K
    if (score >= 40) return "/avatars/peak/3.png"; // TAKE PROFITS
    if (score >= 20) return "/avatars/peak/2.png"; // BULL SZN
    return "/avatars/peak/1.png"; // CALM
  };

  return (
    <ScoreCardGeneric
      title="Market Peak Score"
      value={currentScore}
      getColorClass={getScoreColor}
      showExternalLink={showExternalLink}
      externalHref="/peak"
      externalLabel="Market Peak"
      isLoading={isLoading}
      error={error}
      change={scoreChange}
      characterImage={getCharacterImage(currentScore)}
      timestamp={timestamp}
    />
  );
}
