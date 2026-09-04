import { NormalizedIntelligenceFeatures, ScoreStructure, ScoreContributor } from "@/types/audit";

/**
 * Parses normalized feature factor strings into structured, readable ScoreContributors.
 */
function parseContributor(factor: string, category: string): ScoreContributor {
  const isPositive = factor.includes("+");
  let points = 0;

  const pointsMatch = factor.match(/([+-]\d+)/);
  if (pointsMatch) {
    points = Math.abs(parseInt(pointsMatch[1], 10));
  }

  // Clean description by stripping the score suffix like (+15) or (-20)
  const description = factor.replace(/\s*[+-]\d+\s*/g, "").replace(/[()]/g, "").trim();

  return {
    name: `${category.toUpperCase()}: ${description.substring(0, 40)}`,
    points,
    isPositive,
    description
  };
}

/**
 * Deterministic, transparent scoring engine.
 * Computes scores purely from collected features with no randomness.
 */
export function calculateScores(features: NormalizedIntelligenceFeatures): ScoreStructure {
  const { technicalHealth, contentQuality, entitySignals, structuredDataSignals } = features;

  // Weighted overall calculation:
  // Technical Health (30%), Content Quality (30%), Entity Signals (20%), Structured Data (20%)
  const overall = Math.round(
    technicalHealth.score * 0.3 +
    contentQuality.score * 0.3 +
    entitySignals.score * 0.2 +
    structuredDataSignals.score * 0.2
  );

  const contributors: ScoreContributor[] = [];

  // Parse and collect contributors from technicalHealth
  technicalHealth.factors.forEach(f => {
    contributors.push(parseContributor(f, "technical"));
  });

  // Parse and collect contributors from contentQuality
  contentQuality.factors.forEach(f => {
    contributors.push(parseContributor(f, "content"));
  });

  // Parse and collect contributors from entitySignals
  entitySignals.factors.forEach(f => {
    contributors.push(parseContributor(f, "entities"));
  });

  // Parse and collect contributors from structuredDataSignals
  structuredDataSignals.factors.forEach(f => {
    contributors.push(parseContributor(f, "structuredData"));
  });

  return {
    overall,
    breakdown: {
      technical: technicalHealth.score,
      content: contentQuality.score,
      entities: entitySignals.score,
      structuredData: structuredDataSignals.score
    },
    contributors
  };
}
