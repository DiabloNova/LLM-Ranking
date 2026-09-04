import { BrandEntity } from "../../../src/features/ai-intelligence/domain/entities/brand-entity";
import { ObservationAggregate } from "../../../src/features/ai-intelligence/domain/models/observation-aggregate";
import { AeoScoreEngine } from "../../../src/features/ai-intelligence/domain/services/aeo-score-engine";

export function testDomain() {
  console.log("▶ Running Domain Layer Tests...");

  const auditMock = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "test",
    updatedBy: "test",
    version: 1
  };

  // 1. BrandEntity Validation
  const validBrand = BrandEntity.create({
    id: "brand-test-01",
    organizationId: "org-test-01",
    name: "Valid Brand",
    website: "https://mybrand.io",
    audit: auditMock
  });
  if (validBrand.id !== "brand-test-01") throw new Error("BrandEntity ID mismatch");

  try {
    BrandEntity.create({
      id: "", // Empty ID
      organizationId: "org-01",
      name: "Incomplete Brand",
      website: "invalid-url",
      audit: auditMock
    });
    throw new Error("Should have thrown error on invalid website URL");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("Domain Validation Failed")) {
      throw new Error(`Expected domain validation failure, got: ${message}`);
    }
  }

  // 2. AeoScoreEngine Calculations
  const engine = new AeoScoreEngine();
  const sentiment = { score: 90, label: "positive" as const, confidence: 0.95 };

  const score = engine.computeCompositeVisibility(
    80, // base response
    2,  // mentions count
    0.95, // average mention confidence
    [
      {
        id: "cit-1",
        organizationId: "org-test-01",
        observationId: "obs-1",
        url: "https://wikipedia.org",
        domain: "wikipedia.org",
        title: "Wiki",
        authorityScore: 96,
        relevanceScore: 90,
        audit: auditMock
      }
    ],
    sentiment
  );

  console.log(`  * Calculated AeoScoreEngine visibility score: ${score}`);
  if (score < 50 || score > 100) {
    throw new Error(`Computed visibility score is out of logical bounds: ${score}`);
  }

  // 3. ObservationAggregate Calculations
  const mockObs = {
    id: "obs-1",
    organizationId: "org-test-01",
    promptId: "prompt-1",
    engineId: "engine-1",
    responseText: "Hello Acme!",
    visibilityScore: 75,
    sentiment: { score: 0, label: "neutral" as const, confidence: 1.0 },
    confidence: { score: 0.95, rating: "high" as const },
    executedAt: new Date().toISOString(),
    audit: auditMock
  };

  const mockMentions = [
    {
      id: "m-1",
      organizationId: "org-test-01",
      observationId: "obs-1",
      entityId: "ent-1",
      context: { textSnippet: "Acme is a SaaS", charStart: 6, charEnd: 10 },
      sentiment: { score: 85, label: "positive" as const, confidence: 0.95 },
      confidence: { score: 0.95, rating: "high" as const },
      audit: auditMock
    }
  ];

  const aggregate = new ObservationAggregate(mockObs, mockMentions, []);
  if (aggregate.getMentionsCount() !== 1) throw new Error("Expected 1 brand mention");
  if (aggregate.getDominantSentiment() !== "positive") throw new Error("Expected positive dominant sentiment");

  console.log("✅ Domain Layer Tests Passed Successfully!");
}
