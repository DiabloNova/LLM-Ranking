import { SentimentVO, ConfidenceVO, Citation } from "../types";

export class AeoScoreEngine {
  /**
   * Domain Invariant: Asserts that confidence is within valid boundary bounds [0.0 - 1.0]
   */
  public validateConfidence(confidence: ConfidenceVO): void {
    if (confidence.score < 0 || confidence.score > 1) {
      throw new Error(`Domain Invariant Violation: Confidence score must range from 0.0 to 1.0. Got: ${confidence.score}`);
    }
  }

  /**
   * Domain Invariant: Asserts that sentiment is within valid boundary bounds [-100 to 100]
   */
  public validateSentiment(sentiment: SentimentVO): void {
    if (sentiment.score < -100 || sentiment.score > 100) {
      throw new Error(`Domain Invariant Violation: Sentiment score must range from -100 to 100. Got: ${sentiment.score}`);
    }
  }

  /**
   * Computes a highly advanced, mathematically sound AEO Visibility Score from raw parameters
   */
  public computeCompositeVisibility(
    baseResponseScore: number,
    mentionsCount: number,
    averageMentionConfidence: number,
    citations: Citation[],
    sentiment: SentimentVO
  ): number {
    this.validateSentiment(sentiment);

    // 1. Calculate base rating contribution (max 40 points)
    const baseContribution = Math.min(Math.max(baseResponseScore, 0), 100) * 0.40;

    // 2. Mentions contribution: reward volume and accuracy (max 30 points)
    const mentionVolumeFactor = Math.min(mentionsCount, 5) / 5; // caps at 5 mentions
    const mentionContribution = (mentionVolumeFactor * 15) + (averageMentionConfidence * 15);

    // 3. Citations contribution: reward volume and publisher authority (max 30 points)
    const citationCount = Math.min(citations.length, 5); // caps at 5 citations
    const avgAuthority = citations.length > 0
      ? citations.reduce((sum, c) => sum + c.authorityScore, 0) / citations.length
      : 0;
    const citationContribution = ((citationCount / 5) * 15) + ((avgAuthority / 100) * 15);

    // 4. Sentiment Modifier: apply a penalty or reward based on sentiment
    let sentimentModifier = 1.0;
    if (sentiment.label === "positive") {
      sentimentModifier = 1.05 + (sentiment.score / 100) * 0.05; // up to +10% reward
    } else if (sentiment.label === "negative") {
      sentimentModifier = 0.70 + (sentiment.score / 100) * 0.10; // down to -40% penalty
    }

    const unroundedScore = (baseContribution + mentionContribution + citationContribution) * sentimentModifier;

    // Boundary Invariant Enforcement
    return Math.min(Math.max(Math.round(unroundedScore), 0), 100);
  }
}
