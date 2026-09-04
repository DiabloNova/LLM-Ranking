import { PromptIntelligenceService, SUPPORTED_MODELS } from "../../../src/features/ai-intelligence/services/prompt-intelligence-service";
import { BrandRepository, PromptIntelligenceRepository } from "../../../src/features/ai-intelligence/repositories";
import { Brand, PromptDefinition } from "../../../src/features/ai-intelligence/domain/types";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as assert from "assert";

export async function runPromptIntelligenceTests() {
  console.log("=========================================================================");
  console.log("AI PROMPT INTELLIGENCE — SYSTEM, DOMAIN & SECURITY TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-uuid";
  const tenantB = "tenant-beta-uuid";

  const brandRepo = new BrandRepository();
  const repo = new PromptIntelligenceRepository();
  const service = new PromptIntelligenceService(repo, brandRepo);

  const testBrand: Brand = {
    id: "brand-test-999",
    organizationId: tenantA,
    name: "Rasha Gostar",
    website: "https://secure-site.com",
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test",
      updatedBy: "test",
      version: 1
    }
  };

  try {
    // 0. Setup brand
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-setup", async () => {
      await brandRepo.save(testBrand);
    });

    // 1. Parameterized Prompts & Variable Resolutions
    console.log("▶ TEST: Variable resolutions & validation failures...");
    const template = "Who are the best {service} providers in {location}?";
    const variables = [
      { name: "service", defaultValue: "SEO" },
      { name: "location", defaultValue: "Tehran" }
    ];

    // Successful resolution
    const resolved = service.resolvePromptText(template, variables, { service: "RAG", location: "Isfahan" });
    assert.strictEqual(resolved, "Who are the best RAG providers in Isfahan?");

    // Failure on missing variable with no default value
    try {
      service.resolvePromptText(template, [
        { name: "missing_var", defaultValue: "" }
      ], {});
      throw new Error("Failure: Allowed missing variable resolution!");
    } catch (err: any) {
      assert.strictEqual(err.message.includes("Validation Error"), true);
    }
    console.log("  ✅ Variable resolution validated.");

    // 2. State Machine Transitions
    console.log("▶ TEST: Execution State Machine transitions...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-state-test", async () => {
      // Create a prompt definition
      const def = await service.createPromptDefinition(
        tenantA,
        "brand-test-999",
        "Test Template",
        "Hello {name}",
        "Brand Discovery",
        "Discovery",
        "en",
        [{ name: "name", defaultValue: "World" }],
        [],
        [],
        undefined,
        "usr-test-1"
      );

      // Trigger Execution
      const exec = await service.executePrompt(tenantA, def.id, { name: "Jules" }, "sonar-medium", "usr-test-1");
      assert.strictEqual(exec.status, "succeeded");
      assert.strictEqual(exec.resolvedPromptText, "Hello Jules");

      // Verify invalid status transitions throw
      try {
        await service.transitionExecutionStatus(tenantA, exec.id, "running");
        throw new Error("Failure: Allowed transition out of terminal state succeeded!");
      } catch (err: any) {
        assert.strictEqual(err.message.includes("Illegal State Transition"), true);
      }
    });
    console.log("  ✅ State machine transitions validated.");

    // 3. Brand & Competitor Positions Semantic Extraction
    console.log("▶ TEST: Competitor positions & semantic list ranking extraction...");

    // Test Case 3.1: Numbered list ranking (first, middle, last)
    const listResponse = `Here are the top AI Visibility providers:
    1. Competitor A
    2. Rasha Gostar
    3. Competitor B`;

    const obs1 = service.extractEntityPosition(listResponse, "brand", "Rasha Gostar", ["rasha gostar"], "exec-id", tenantA);
    assert.strictEqual(obs1.presence, "ranked");
    assert.strictEqual(obs1.numericPosition, 2);
    assert.strictEqual(obs1.evidenceStructure, "numbered_list");

    const obsCompA = service.extractEntityPosition(listResponse, "compA", "Competitor A", ["Competitor A"], "exec-id", tenantA);
    assert.strictEqual(obsCompA.presence, "ranked");
    assert.strictEqual(obsCompA.numericPosition, 1);

    // Test Case 3.2: Recommendation without numeric ranking
    const proseResponse = "We highly recommend using Rasha Gostar as your primary choice for conversational search optimization.";
    const obs2 = service.extractEntityPosition(proseResponse, "brand", "Rasha Gostar", ["rasha gostar"], "exec-id", tenantA);
    assert.strictEqual(obs2.presence, "recommended");
    assert.strictEqual(obs2.numericPosition, undefined);

    // Test Case 3.3: Bullet list matching
    const bulletResponse = `Here are some options:
    - Competitor X
    - Rasha Gostar`;
    const obs3 = service.extractEntityPosition(bulletResponse, "brand", "Rasha Gostar", ["rasha gostar"], "exec-id", tenantA);
    assert.strictEqual(obs3.presence, "ranked");
    assert.strictEqual(obs3.numericPosition, 2);
    assert.strictEqual(obs3.evidenceStructure, "bullet_list");

    console.log("  ✅ Semantic extraction and evidence tracing validated.");

    // 4. Multi-Tenant Isolation
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation for Prompt library...");

    // Tenant B cannot load Tenant A's prompt definition
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-isolation", async () => {
        // Query definitions for brand belonging to Tenant A
        await repo.findDefinitionsByBrandId(tenantA, "brand-test-999");
      });
      throw new Error("Failure: Tenant B bypassed tenant context check!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
      assert.strictEqual(err.message.includes("Cross-tenant operation blocked"), true);
    }
    console.log("  ✅ Tenant isolation validated.");

    console.log("=========================================================================");
    console.log("✅ ALL AI PROMPT INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runPromptIntelligenceTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
