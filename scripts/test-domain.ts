/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Enterprise Hardened Verification Test Script
 */

import { BrandEntity } from "../src/features/ai-intelligence/domain/entities/brand-entity";
import { ObservationAggregate } from "../src/features/ai-intelligence/domain/models/observation-aggregate";
import { DomainEventFactory } from "../src/features/ai-intelligence/domain/events";
import {
  CitationService,
  VisibilityService,
  ObservationService,
  EntityService,
  BrandRepository,
  db
} from "../src/features/ai-intelligence";

function runTest(name: string, testFn: () => void | Promise<void>) {
  console.log(`\n=== Running Test: ${name} ===`);
  try {
    const res = testFn();
    if (res instanceof Promise) {
      res.then(() => {
        console.log(`\x1b[32m%s\x1b[0m`, `✅ Passed: ${name}`);
      }).catch((err) => {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ Failed: ${name}`);
        console.error(err);
        process.exit(1);
      });
    } else {
      console.log(`\x1b[32m%s\x1b[0m`, `✅ Passed: ${name}`);
    }
  } catch (err) {
    console.error(`\x1b[31m%s\x1b[0m`, `❌ Failed: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. BrandEntity Validation Test
runTest("BrandEntity Validation & Construction", () => {
  const auditMock = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "tester",
    updatedBy: "tester",
    version: 1
  };

  // Valid construction
  const validBrand = BrandEntity.create({
    id: "brand-test-99",
    organizationId: "org-enterprise-01",
    name: "Valid Test Brand",
    website: "https://validbrand.io",
    industry: "E-Commerce",
    country: "US",
    audit: auditMock
  });

  if (validBrand.name !== "Valid Test Brand") {
    throw new Error("BrandEntity name mismatch");
  }

  // Invalid construction should throw
  try {
    BrandEntity.create({
      id: "", // invalid empty ID
      organizationId: "org-01",
      name: "Incomplete Brand",
      website: "ftp://not-http-url", // invalid URL protocol
      audit: auditMock
    });
    throw new Error("Should have thrown error on invalid website protocol");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("Domain Validation Failed")) {
      throw new Error("Expected domain validation failure, got: " + message);
    }
    console.log("-> Successfully caught invalid brand creation: " + message);
  }
});

// 2. CitationService Authority Calculations
runTest("CitationService Domain Authority Calculations", () => {
  const citationService = new CitationService();

  const govScore = citationService.calculateAuthorityScore("https://whitehouse.gov/news/latest");
  const eduScore = citationService.calculateAuthorityScore("https://stanford.edu/research/paper.pdf");
  const wikiScore = citationService.calculateAuthorityScore("https://en.wikipedia.org/wiki/Artificial_intelligence");
  const randomScore = citationService.calculateAuthorityScore("https://myrandomblog.io/article-one");

  console.log(`-> .gov score: ${govScore} (expected 98)`);
  console.log(`-> .edu score: ${eduScore} (expected 95)`);
  console.log(`-> Wikipedia score: ${wikiScore} (expected 96)`);
  console.log(`-> Random blog score: ${randomScore} (expected 65)`);

  if (govScore !== 98) throw new Error("Gov authority score incorrect");
  if (eduScore !== 95) throw new Error("Edu authority score incorrect");
  if (wikiScore !== 96) throw new Error("Wikipedia authority score incorrect");
  if (randomScore !== 65) throw new Error("Random .io score incorrect");
});

// 3. ObservationAggregate Dynamic Metrics Calculation
runTest("ObservationAggregate Dynamic Metrics Calculation", () => {
  const auditMock = {
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "tester",
    updatedBy: "tester",
    version: 1
  };

  const mockObs = {
    id: "obs-test",
    organizationId: "org-enterprise-01",
    promptId: "prompt-test",
    engineId: "engine-test",
    responseText: "This is a response text.",
    visibilityScore: 80,
    sentiment: { score: 85, label: "positive" as const, confidence: 0.95 },
    confidence: { score: 0.9, rating: "high" as const },
    executedAt: new Date(),
    audit: auditMock
  };

  const mockMentions = [
    {
      id: "m-1",
      organizationId: "org-enterprise-01",
      observationId: "obs-test",
      entityId: "ent-1",
      context: { textSnippet: "Acme SaaS", charStart: 10, charEnd: 19 },
      sentiment: { score: 85, label: "positive" as const, confidence: 0.95 },
      confidence: { score: 0.95, rating: "high" as const },
      audit: auditMock
    }
  ];

  const mockCitations = [
    {
      id: "cit-1",
      organizationId: "org-enterprise-01",
      observationId: "obs-test",
      url: "https://acme.io",
      domain: "acme.io",
      title: "Acme",
      authorityScore: 80,
      relevanceScore: 90,
      audit: auditMock
    }
  ];

  const aggregate = new ObservationAggregate(mockObs, mockMentions, mockCitations);

  const dynamicVisibility = aggregate.calculateDynamicVisibility();
  console.log(`-> Dynamic Visibility Score: ${dynamicVisibility}`);

  if (dynamicVisibility < 50 || dynamicVisibility > 100) {
    throw new Error("Dynamic visibility score falls out of normal bounds");
  }
});

// 4. Multi-Tenant Isolation & Repository Contract Pass
runTest("Multi-Tenant Boundary Enforcements", async () => {
  const brandRepo = new BrandRepository();
  const tenantA = "org-enterprise-01";
  const tenantB = "org-malicious-attacker-02";
  const brandId = "brand-acme-01";

  // Attempting to retrieve Tenant A's brand as Tenant B must return null
  const secureLeakedBrandCheck = await brandRepo.findById(tenantB, brandId);
  console.log(`-> Secure leakage block check: got brand object: ${secureLeakedBrandCheck}`);

  if (secureLeakedBrandCheck !== null) {
    throw new Error("Multi-Tenant Isolation Broken! Repository leaked data across organization IDs.");
  }

  // Retrieving Tenant A's brand as Tenant A must succeed
  const legitimateBrandCheck = await brandRepo.findById(tenantA, brandId);
  if (legitimateBrandCheck === null || legitimateBrandCheck.id !== brandId) {
    throw new Error("Repository failed to retrieve brand under legitimate organization boundary.");
  }

  console.log(`-> Correct boundary validated! Tenant A retrieves: "${legitimateBrandCheck.name}"`);
});

// 5. Domain Event Generation Pass
runTest("Domain Event Contract Validations", () => {
  const event = DomainEventFactory.create(
    "aibi.brand.created.v1",
    "brand-acme-01",
    "org-enterprise-01",
    {
      brandId: "brand-acme-01",
      name: "Acme SaaS",
      website: "https://acme-saas.io",
      createdBy: "user-admin-01"
    }
  );

  console.log(`-> Dispatched Event Type: "${event.eventType}"`);
  console.log(`-> Dispatched AggId: "${event.aggregateId}"`);
  console.log(`-> Dispatched TenantId: "${event.metadata.organizationId}"`);

  if (!event.metadata.eventId.startsWith("evt-")) {
    throw new Error("Event factory did not generate correct eventId signature prefix.");
  }
});

// 6. E2E Observation Processing, Autonomous recovery alerts and Rec compilation
runTest("E2E Process, Autonomous Recovery & Recommendations", async () => {
  const observationService = new ObservationService();
  const visibilityService = new VisibilityService();
  const entityService = new EntityService();

  const tenantId = "org-enterprise-01";
  const brandId = "brand-acme-01";

  // Register semantic entities first
  await entityService.createEntity(
    tenantId,
    brandId,
    "Acme Corp Entity",
    "Company",
    "Q111999222",
    "https://wikipedia.org/wiki/Acme_SaaS",
    0.95
  );

  // Register Prompt
  const prompt = await observationService.registerPrompt(
    tenantId,
    brandId,
    "Is Acme SaaS reliable?",
    "Review & Trust",
    "Recommendation",
    "en",
    "high"
  );

  // Trigger high visibility observation (adds citation and mention)
  const highAggregate = await observationService.processObservation(
    tenantId,
    prompt.id,
    "engine-chatgpt",
    "Yes, Acme SaaS is reliable according to https://wikipedia.org/wiki/Acme_SaaS.",
    88, // high visibility
    95, // sentiment
    0.96
  );

  console.log(`-> High execution dynamic visibility: ${highAggregate.calculateDynamicVisibility()}%`);

  // Trigger low visibility observation (triggers automatic recommendation alerts)
  const recommendationsCountBefore = db.recommendations.size;

  const lowAggregate = await observationService.processObservation(
    tenantId,
    prompt.id,
    "engine-claude",
    "We have no reliable details on this topic.",
    25, // low visibility
    50, // neutral sentiment
    0.90
  );

  const lowDynamicScore = lowAggregate.calculateDynamicVisibility();
  console.log(`-> Low execution dynamic visibility: ${lowDynamicScore}%`);
  console.log(`-> Recommendations count before: ${recommendationsCountBefore}`);
  console.log(`-> Recommendations count after: ${db.recommendations.size}`);

  if (lowDynamicScore < 70 && db.recommendations.size <= recommendationsCountBefore) {
    throw new Error("Autonomous alert recommendation should have been generated.");
  }

  // Dashboard Telemetry Compilation Check
  const payload = await visibilityService.prepareDashboardData(tenantId, brandId);
  console.log(`-> Dashboard overall compiled score: ${payload.overallScore}%`);
  console.log(`-> Dashboard overall rating: "${payload.grade}"`);

  if (payload.overallScore < 0 || payload.overallScore > 100) {
    throw new Error("Dashboard compiled score is out of bounds");
  }
});
