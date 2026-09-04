import { AIObservation, BrandMention, Citation } from "../types";

export class ObservationAggregate {
  constructor(
    public readonly observation: AIObservation,
    public readonly mentions: BrandMention[],
    public readonly citations: Citation[]
  ) {}

  /**
   * Returns the count of brand mentions extracted in this observation.
   */
  public getMentionsCount(): number {
    return this.mentions.length;
  }

  /**
   * Returns the count of citations associated with this observation.
   */
  public getCitationsCount(): number {
    return this.citations.length;
  }

  /**
   * Calculates the average authority score of all citations in this observation.
   */
  public getAverageCitationAuthority(): number {
    if (this.citations.length === 0) return 0;
    const sum = this.citations.reduce((acc, cit) => acc + cit.authorityScore, 0);
    return Math.round(sum / this.citations.length);
  }

  /**
   * Determines the dominant sentiment of mentions in this response.
   */
  public getDominantSentiment(): "positive" | "negative" | "neutral" {
    if (this.mentions.length === 0) return "neutral";

    const counts = { positive: 0, negative: 0, neutral: 0 };
    for (const mention of this.mentions) {
      counts[mention.sentiment.label]++;
    }

    if (counts.positive > counts.negative && counts.positive >= counts.neutral) {
      return "positive";
    }
    if (counts.negative > counts.positive && counts.negative >= counts.neutral) {
      return "negative";
    }
    return "neutral";
  }

  /**
   * Dynamically calculates an overall visibility score from elements.
   * Weighs:
   * - 40% Base Observation visibilityScore
   * - 30% Citation presence & authority (up to 30 points)
   * - 30% Mentions frequency & confidence (up to 30 points)
   */
  public calculateDynamicVisibility(): number {
    const baseScoreWeight = this.observation.visibilityScore * 0.4;

    // Citation score component: citation count + average authority score
    const citationCount = Math.min(this.citations.length, 5); // caps at 5 citations
    const avgAuthority = this.getAverageCitationAuthority();
    const citationComponent = ((citationCount / 5) * 15) + ((avgAuthority / 100) * 15);

    // Mention score component: count + average confidence
    const mentionCount = Math.min(this.mentions.length, 4); // caps at 4 mentions
    const averageConfidence = this.mentions.length > 0
      ? this.mentions.reduce((acc, m) => acc + m.confidence.score, 0) / this.mentions.length
      : 0;
    const mentionComponent = ((mentionCount / 4) * 15) + (averageConfidence * 15);

    const calculated = Math.round(baseScoreWeight + citationComponent + mentionComponent);
    return Math.min(Math.max(calculated, 0), 100);
  }
}
