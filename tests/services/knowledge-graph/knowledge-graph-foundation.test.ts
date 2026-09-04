/**
 * Task 8.0 — Knowledge Graph Foundation Tests
 * Verifies canonical Entity and Relationship CRUD with extended fields,
 * deterministic Authority and Completeness calculations, bounded BFS neighborhood traversal,
 * and zero-trust multi-tenant isolation.
 */

import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { EntityRepository } from "../../../src/features/ai-intelligence/repositories";
import {
  EntityService,
  calculateEntityAuthority,
  calculateEntityCompleteness,
  projectNeighborhoodForVisualization
} from "../../../src/features/ai-intelligence/services/entity-service";
import { Entity, EntityRelationship, RelationshipType, AuditMetadata } from "../../../src/features/ai-intelligence/domain/types";
import * as assert from "assert";

function createAudit(createdBy = "test-system"): AuditMetadata {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    updatedBy: createdBy,
    version: 1
  };
}

export async function runKnowledgeGraphTests() {
  console.log("=========================================================================");
  console.log("KNOWLEDGE GRAPH FOUNDATION — INTEGRATION & SECURITY TEST SUITE");
  console.log("=========================================================================");

  // Define Mock Tenant Boundaries
  const tenantA = "tenant-alpha-graph-uuid";
  const tenantB = "tenant-beta-graph-uuid";

  const entityRepo = new EntityRepository();
  const entityService = new EntityService(entityRepo);

  try {
    // ----------------------------------------------------
    // 1. Entity and Relationship CRUD with Extended Fields
    // ----------------------------------------------------
    console.log("▶ TEST: Canonical Entity CRUD with Extended Fields...");

    let entity1Id = "";
    let entity2Id = "";

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-graph-test", async () => {
      // Create Entity 1 with extended properties
      const ent1 = await entityService.createEntity(
        tenantA,
        "brand-acme-01",
        "Optimus AI Corp",
        "Brand",
        "Q889922",
        "https://en.wikipedia.org/wiki/Optimus_AI",
        0.95,
        "usr-test-1",
        ["Optimus", "OAIC"],
        "Enterprise intelligence and graph-rag platform.",
        { chunk_id: "doc-chunk-01" },
        undefined, // authority score (will be dynamically calculated)
        undefined, // completeness score (will be dynamically calculated)
        "active"
      );

      assert.ok(ent1.id.startsWith("entity-"));
      assert.strictEqual(ent1.name, "Optimus AI Corp");
      assert.strictEqual(ent1.type, "Brand");
      assert.deepStrictEqual(ent1.aliases, ["Optimus", "OAIC"]);
      assert.strictEqual(ent1.description, "Enterprise intelligence and graph-rag platform.");
      assert.strictEqual(ent1.status, "active");
      assert.strictEqual(ent1.confidence.score, 0.95);
      assert.strictEqual(ent1.confidence.rating, "high");

      entity1Id = ent1.id;

      // Create Entity 2 (target node)
      const ent2 = await entityService.createEntity(
        tenantA,
        "brand-acme-01",
        "Gemini Model",
        "Product",
        "Q999111",
        "",
        0.75,
        "usr-test-1",
        [],
        "",
        { chunk_id: "doc-chunk-02" },
        undefined,
        undefined,
        "active"
      );

      entity2Id = ent2.id;

      // Retrieve and verify
      const retrieved = await entityService.getEntityById(tenantA, entity1Id);
      assert.notStrictEqual(retrieved, null);
      assert.strictEqual(retrieved!.name, "Optimus AI Corp");

      // Verify findByName case-insensitive helper
      const foundByName = await entityService.getEntityByName(tenantA, "optimus ai corp");
      assert.notStrictEqual(foundByName, null);
      assert.strictEqual(foundByName!.id, entity1Id);
    });
    console.log("  ✅ Canonical Entity CRUD with Extended Fields verified.");

    // ----------------------------------------------------
    // 2. Relationship CRUD with Extended Fields
    // ----------------------------------------------------
    console.log("▶ TEST: Canonical Relationship CRUD with Extended Fields...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-graph-test", async () => {
      // Create Relationship
      const rel = await entityService.addRelationship(
        tenantA,
        entity1Id,
        entity2Id,
        "related_to",
        0.90,
        "usr-test-1",
        "directed",
        { provenance_source: "manual-graph-curation" },
        { weight: 12.5 }
      );

      assert.strictEqual(rel.organizationId, tenantA);
      assert.strictEqual(rel.sourceEntityId, entity1Id);
      assert.strictEqual(rel.targetEntityId, entity2Id);
      assert.strictEqual(rel.relationshipType, "related_to");
      assert.strictEqual(rel.direction, "directed");
      assert.deepStrictEqual(rel.provenance, { provenance_source: "manual-graph-curation" });
      assert.deepStrictEqual(rel.metadata, { weight: 12.5 });

      // Retrieve Relationships list
      const rels = await entityService.getRelationships(tenantA);
      assert.ok(rels.length >= 1);
      const retrievedRel = rels.find(r => r.sourceEntityId === entity1Id && r.targetEntityId === entity2Id);
      assert.notStrictEqual(retrievedRel, undefined);
      assert.strictEqual(retrievedRel!.direction, "directed");
    });
    console.log("  ✅ Canonical Relationship CRUD verified.");

    // ----------------------------------------------------
    // 3. Deterministic Baseline Authority & Completeness Calculations
    // ----------------------------------------------------
    console.log("▶ TEST: Deterministic Baseline Authority & Completeness calculations...");

    const mockEntity: Entity = {
      id: "ent-test-calc",
      organizationId: tenantA,
      brandId: "brand-01",
      name: "Acme SaaS",
      type: "Brand",
      wikidataId: "Q1111",
      wikipediaUrl: "https://wikipedia.org/wiki/Acme_SaaS",
      confidence: { score: 0.90, rating: "high" },
      aliases: ["Acme"],
      description: "Complete description here.",
      provenance: { source: "test" },
      status: "active",
      audit: createAudit()
    };

    // Test Completeness
    // Base name + type = 40
    // + description (20) + wikidata (15) + wikipedia (15) + aliases (10) = 100
    const fullCompleteness = calculateEntityCompleteness(mockEntity);
    assert.strictEqual(fullCompleteness, 100);

    const miniEntity: Entity = {
      id: "ent-test-calc-mini",
      organizationId: tenantA,
      brandId: "brand-01",
      name: "Acme Mini",
      type: "Brand",
      confidence: { score: 0.80, rating: "high" },
      audit: createAudit()
    };
    const miniCompleteness = calculateEntityCompleteness(miniEntity);
    assert.strictEqual(miniCompleteness, 40); // Only name and type present

    // Test Authority
    // Base confidence score contribution = 0.90 * 40 = 36
    // + Wikidata (15) + Wikipedia (15) = 30
    // + relationshipCount = 2 * 3 = 6
    // Total authority = 36 + 30 + 6 = 72
    const authorityValue = calculateEntityAuthority(mockEntity, 2);
    assert.strictEqual(authorityValue, 72);

    console.log("  ✅ Deterministic Calculations verify successfully (Completeness & Authority matches formula).");

    // ----------------------------------------------------
    // 4. Bounded BFS Neighborhood Traversal
    // ----------------------------------------------------
    console.log("▶ TEST: Bounded BFS Neighborhood Traversal...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-graph-test", async () => {
      // Build a chain: Ent1 -> Ent2 -> Ent3
      const ent3 = await entityService.createEntity(
        tenantA,
        "brand-acme-01",
        "Chain Node 3",
        "Concept",
        "",
        "",
        1.0,
        "usr-test-1"
      );

      await entityService.addRelationship(
        tenantA,
        entity2Id,
        ent3.id,
        "creates",
        0.85
      );

      // Traversal with depth=1 (should only see entity1 and entity2)
      const graphDepth1 = await entityService.getNeighborhood(tenantA, entity1Id, 1, 100);
      assert.strictEqual(graphDepth1.nodes.length, 2);
      assert.strictEqual(graphDepth1.edges.length, 1);

      // Traversal with depth=2 (should see entity1, entity2, and entity3)
      const graphDepth2 = await entityService.getNeighborhood(tenantA, entity1Id, 2, 100);
      assert.strictEqual(graphDepth2.nodes.length, 3);
      assert.strictEqual(graphDepth2.edges.length, 2);

      // Traversal with limit/maxNodes constraint (maxNodes=2)
      const graphNodeLimit = await entityService.getNeighborhood(tenantA, entity1Id, 2, 2);
      assert.strictEqual(graphNodeLimit.nodes.length, 2); // strictly capped to maxNodes=2

      // Empty graph / non-existent entity handling
      const emptyGraph = await entityService.getNeighborhood(tenantA, "entity-nonexistent", 2, 100);
      assert.strictEqual(emptyGraph.nodes.length, 0);
      assert.strictEqual(emptyGraph.edges.length, 0);
    });
    console.log("  ✅ Bounded BFS Neighborhood Traversal limit logic verified.");

    // ----------------------------------------------------
    // 5. Zero-Trust Multi-Tenant Isolation Protection
    // ----------------------------------------------------
    console.log("▶ TEST: Zero-Trust Multi-Tenant Graph Isolation...");

    // Scenario A: Attempting to create relationship connecting entities of different tenants
    let crossTenantViolationThrown = false;
    try {
      await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-graph-test", async () => {
        // Create an entity under tenant B
        let entBId = "";
        await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-graph-test-b", async () => {
          const entB = await entityService.createEntity(
            tenantB,
            "brand-acme-b",
            "Tenant B Entity",
            "Brand",
            "",
            "",
            1.0,
            "usr-test-2"
          );
          entBId = entB.id;
        });

        // Now attempt to link tenant A entity1Id with tenant B entBId under tenant A context
        await entityService.addRelationship(
          tenantA,
          entity1Id,
          entBId, // Belongs to Tenant B
          "competes_with"
        );
      });
    } catch (err: unknown) {
      crossTenantViolationThrown = true;
      const error = err as Error;
      assert.strictEqual(error.message.includes("does not exist in your organization"), true);
    }
    assert.strictEqual(crossTenantViolationThrown, true, "Security Failure: Cross-tenant relationship linking allowed!");

    // Scenario B: Reading Tenant A data while inside Tenant B context should be rejected
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-graph-test-b", async () => {
        await entityService.getEntityById(tenantA, entity1Id);
      });
      throw new Error("Security Failure: Allowed reading cross-tenant entities!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.name, "TenantContextViolationException");
    }

    // Scenario C: Traversing neighborhood of Tenant A while inside Tenant B context should be blocked
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-graph-test-b", async () => {
        await entityService.getNeighborhood(tenantA, entity1Id, 2, 100);
      });
      throw new Error("Security Failure: Allowed traversing neighborhood cross-tenant!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.name, "TenantContextViolationException");
    }

    console.log("  ✅ Multi-Tenant Isolation & Intrusion Denial verified successfully.");

    // ----------------------------------------------------
    // 6. Visualization Projection Helper Validation
    // ----------------------------------------------------
    console.log("▶ TEST: Visualization Projection helper mapping validation...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-graph-test", async () => {
      const { nodes, edges } = await entityService.getNeighborhood(tenantA, entity1Id, 2, 100);
      const projection = projectNeighborhoodForVisualization(nodes, edges);

      assert.strictEqual(projection.nodes.length, 3);
      assert.strictEqual(projection.edges.length, 2);

      const centralProj = projection.nodes.find(n => n.id === entity1Id);
      assert.notStrictEqual(centralProj, undefined);
      assert.strictEqual(centralProj!.label, "Optimus AI Corp");
      assert.strictEqual(centralProj!.relevantScores.confidence, 0.95);
      assert.strictEqual(centralProj!.relevantScores.authority, 71); // 40*0.95 (38) + 15 (wikidata) + 15 (wikipedia) + 3*1 (relationships) = 71
      assert.ok(centralProj!.relevantScores.authority > 0);
      assert.strictEqual(centralProj!.relevantScores.completeness, 100);
      assert.deepStrictEqual(centralProj!.metadata.aliases, ["Optimus", "OAIC"]);
    });
    console.log("  ✅ Visualization projection contracts mapped successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL KNOWLEDGE GRAPH FOUNDATION TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Knowledge Graph Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runKnowledgeGraphTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
