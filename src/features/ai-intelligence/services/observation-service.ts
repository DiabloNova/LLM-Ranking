import { AIObservation, BrandMention,
  CompetitorMention, Citation, Prompt, PromptIntent, PriorityLevel } from "../domain/types";
import { IObservationRepository, IPromptRepository, IRecommendationRepository } from "../repositories/interfaces";
import { ObservationRepository, PromptRepository, RecommendationRepository } from "../repositories";
import { ObservationAggregate } from "../domain/models/observation-aggregate";

export class ObservationService {
  private obsRepo: IObservationRepository;
  private promptRepo: IPromptRepository;
  private recRepo: IRecommendationRepository;

  constructor(
    obsRepo?: IObservationRepository,
    promptRepo?: IPromptRepository,
    recRepo?: IRecommendationRepository
  ) {
    this.obsRepo = obsRepo || new ObservationRepository();
    this.promptRepo = promptRepo || new PromptRepository();
    this.recRepo = recRepo || new RecommendationRepository();
  }

  /**
   * Register a new query prompt to monitor inside a tenant boundary
   */
  public async registerPrompt(
    organizationId: string,
    brandId: string,
    text: string,
    category: string,
    intent: PromptIntent,
    language: string = "en",
    priority: PriorityLevel = "medium",
    actorId = "system"
  ): Promise<Prompt> {
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      organizationId,
      brandId,
      text,
      category,
      intent,
      language,
      priority,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      }
    };

    return this.promptRepo.save(prompt);
  }

  /**
   * Process a brand observation payload from an AI query event execution inside a tenant boundary
   */
  public async processObservation(
    organizationId: string,
    promptId: string,
    engineId: string,
    responseText: string,
    rawVisibilityScore: number,
    sentimentScore: number,
    confidenceScore: number = 0.95,
    actorId = "system"
  ): Promise<ObservationAggregate> {
    const prompt = await this.promptRepo.findById(organizationId, promptId);
    if (!prompt) {
      throw new Error(`Linked prompt query with ID ${promptId} does not exist in your organization`);
    }

    // 1. Create and save the AI observation
    const observationId = crypto.randomUUID();

    const sentimentLabel = sentimentScore > 75 ? "positive" : sentimentScore < 45 ? "negative" : "neutral";
    const confidenceRating = confidenceScore >= 0.8 ? "high" : confidenceScore >= 0.5 ? "medium" : "low";

    const observation: AIObservation = {
      id: observationId,
      organizationId,
      promptId,
      engineId,
      responseText,
      visibilityScore: rawVisibilityScore,
      sentiment: { score: sentimentScore, label: sentimentLabel, confidence: 0.95 },
      confidence: { score: confidenceScore, rating: confidenceRating },
      executedAt: new Date(),
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      }
    };
    await this.obsRepo.save(observation);

    // Entity mentions must come from a provider-backed extraction result.
    const mentions: BrandMention[] = [];
    const citations: Citation[] = [];
    const competitorMentions: CompetitorMention[] = [];
    // Logic for extracting competitor mentions from responseText would be implemented here or handled via AI.

    // Extract links as Citations if present (represented as urls)
    const urlMatches = responseText.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      for (let i = 0; i < urlMatches.length; i++) {
        const fullUrl = urlMatches[i].replace(/[.,);]$/, ""); // sanitize tail chars
        try {
          const domain = new URL(fullUrl).hostname.replace("www.", "");
          const citationId = crypto.randomUUID();
          const citation: Citation = {
            id: citationId,
            organizationId,
            observationId,
            url: fullUrl,
            domain,
            title: `${domain.split(".")[0].toUpperCase()} Citation Resource`,
            authorityScore: domain.endsWith(".org") || domain.endsWith(".edu") ? 88 : 65,
            relevanceScore: 90,
            audit: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: actorId,
              updatedBy: actorId,
              version: 1
            }
          };
          await this.obsRepo.saveCitation(citation);
          citations.push(citation);
        } catch {
          // Ignore invalid or malformed URL patterns extracted from LLM text
        }
      }
    }

    // 3. Assemble Domain Aggregate Root
    const aggregate = new ObservationAggregate(observation, mentions, citations);

    // 4. Autonomous Recommendation Engine Trigger
    // If the dynamic calculated score falls below a critical threshold, automatically trigger recommendations!
    const dynamicScore = aggregate.calculateDynamicVisibility();
    if (dynamicScore < 70) {
      await this.recRepo.save({
        id: crypto.randomUUID(),
        organizationId,
        brandId: prompt.brandId,
        category: "Low Visibility Recovery",
        priority: "high",
        impactScore: 20,
        description: `Autonomous Agent Alert: Visibility rating fell to ${dynamicScore}% on execution. Audit and increase brand citations for prompt: "${prompt.text}".`,
        status: "pending",
        audit: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "autonomous-agent",
          updatedBy: "autonomous-agent",
          version: 1
        }
      });
    }

    return aggregate;
  }
}
