import { InMemoryCacheStore } from "../../../src/services/cache/store";
import { CacheService } from "../../../src/services/cache/service";
import { InMemoryDeduplicationStore } from "../../../src/services/cache/deduplication";
import { createSession, setCookiesMock } from "../../../src/services/auth/session";
import { User } from "../../../src/types/auth";

// Mock cookie store for session resolution during cache secure context tests
const mockCookieStore = {
  store: new Map<string, any>(),
  get(name: string) {
    return this.store.get(name);
  },
  set(name: string, value: any, options: any) {
    this.store.set(name, { value, name, ...options });
  },
  delete(name: string) {
    this.store.delete(name);
  },
  clear() {
    this.store.clear();
  }
};

setCookiesMock(() => Promise.resolve(mockCookieStore));

export async function runCacheTests() {
  console.log("=========================================================================");
  console.log("SEORCHABLE — SECURE CACHE LAYER INTEGRATION SUITE");
  console.log("=========================================================================");

  const store = new InMemoryCacheStore();
  const service = new CacheService(store);
  const deduplicator = new InMemoryDeduplicationStore();

  const tenantA = "ws-tenant-a";
  const tenantB = "ws-tenant-b";

  const mockUserA: User = {
    id: "usr-1",
    name: "Alice",
    email: "alice@test.com",
    role: "workspace_member",
    workspaceId: tenantA
  };

  const mockUserB: User = {
    id: "usr-2",
    name: "Bob",
    email: "bob@test.com",
    role: "workspace_member",
    workspaceId: tenantB
  };

  // Set active session to Tenant A
  await createSession(mockUserA);

  // ----------------------------------------------------
  // CACHE-001 & CACHE-002: Set/Get & Cache Miss
  // ----------------------------------------------------
  console.log("▶ CACHE-001 & 002: Set / Get & Cache Miss...");
  const key1 = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { prompt: "Hello" } });

  // Get non-existent -> returns null (CACHE-002)
  const miss = await service.get(tenantA, key1);
  if (miss !== null) {
    throw new Error("CACHE-002 Failed: Expected cache miss, got value.");
  }

  // Set & Get (CACHE-001)
  await service.set(tenantA, key1, "cached-response", "llm");
  const hit = await service.get(tenantA, key1);
  if (hit !== "cached-response") {
    throw new Error(`CACHE-001 Failed: Expected "cached-response", got ${hit}`);
  }
  console.log("  ✅ Set/Get and cache miss logic verified.");

  // ----------------------------------------------------
  // CACHE-003: TTL Expiration
  // ----------------------------------------------------
  console.log("▶ CACHE-003: Cache Expiration / TTL Policies...");
  const shortStore = new InMemoryCacheStore();
  // Centralized short TTL (1 second)
  const shortService = new CacheService(shortStore, { llmResponse: 1, crawlResult: 1, queryResult: 1 });

  const expireKey = shortService.generateKey({ tenantId: tenantA, category: "llm", inputs: { prompt: "Short TTL" } });
  await shortService.set(tenantA, expireKey, "expiring-soon", "llm");

  // Immediate hit
  const freshHit = await shortService.get(tenantA, expireKey);
  if (freshHit !== "expiring-soon") {
    throw new Error("Short TTL set failed.");
  }

  // Wait 1.1s for expiration
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const expiredHit = await shortService.get(tenantA, expireKey);
  if (expiredHit !== null) {
    throw new Error("CACHE-003 Failed: Expired cache entry was returned!");
  }
  console.log("  ✅ Expired entries fail closed and return null correctly.");

  // ----------------------------------------------------
  // CACHE-004: Delete
  // ----------------------------------------------------
  console.log("▶ CACHE-004: Delete Key...");
  const delKey = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { prompt: "To be deleted" } });
  await service.set(tenantA, delKey, "temp-value", "llm");

  await service.invalidateKey(tenantA, delKey);
  const delHit = await service.get(tenantA, delKey);
  if (delHit !== null) {
    throw new Error("CACHE-004 Failed: Deleted key still exists.");
  }
  console.log("  ✅ Key invalidation successfully deletes target entries.");

  // ----------------------------------------------------
  // CACHE-005, CACHE-006 & CACHE-SEC-001/002: Tenant Keys & Cross-Tenant Isolation
  // ----------------------------------------------------
  console.log("▶ CACHE-005, 006 & CACHE-SEC-001/002: Tenant-scoped Cache Isolation...");
  const promptInputs = { prompt: "Common Prompt" };
  const keyTenantA = service.generateKey({ tenantId: tenantA, category: "llm", inputs: promptInputs });
  const keyTenantB = service.generateKey({ tenantId: tenantB, category: "llm", inputs: promptInputs });

  if (keyTenantA === keyTenantB) {
    throw new Error("CACHE-005 Failed: Identical inputs produced matching keys for different tenants!");
  }

  // Write Tenant A (Alice is logged in)
  await service.set(tenantA, keyTenantA, "Tenant A Private Data", "llm");

  // Alice attempts to write to Tenant B's namespace (CACHE-SEC-002) -> must reject
  try {
    await service.set(tenantB, keyTenantB, "Hacker Data", "llm");
    throw new Error("CACHE-SEC-002 Failed: Tenant A allowed to write to Tenant B cache!");
  } catch (err: any) {
    if (err.message && err.message.includes("Security Violation")) {
      // Correct!
    } else {
      throw err;
    }
  }

  // Alice attempts to read Tenant B's keys (CACHE-SEC-001) -> must reject
  try {
    await service.get(tenantA, keyTenantB);
    throw new Error("CACHE-SEC-001 Failed: Tenant A allowed to query Tenant B key prefix!");
  } catch (err: any) {
    if (err.message && err.message.includes("Security Violation")) {
      // Correct!
    } else {
      throw err;
    }
  }
  console.log("  ✅ Zero-trust cross-tenant cache access successfully blocked.");

  // ----------------------------------------------------
  // CACHE-SEC-003: Cross-Tenant Invalidation Prevention
  // ----------------------------------------------------
  console.log("▶ CACHE-SEC-003: Cross-Tenant Cache Invalidation Protection...");
  // Alice attempts to invalidate Tenant B's key/namespace -> must reject
  try {
    await service.invalidateKey(tenantB, keyTenantB);
    throw new Error("CACHE-SEC-003 Failed: Allowed unauthorized single key invalidation.");
  } catch (err: any) {
    if (err.message && err.message.includes("Security Violation")) {
      // Correct!
    } else {
      throw err;
    }
  }

  try {
    await service.invalidateTenantNamespace(tenantB);
    throw new Error("CACHE-SEC-003 Failed: Allowed unauthorized tenant namespace invalidation.");
  } catch (err: any) {
    if (err.message && err.message.includes("Security Violation")) {
      // Correct!
    } else {
      throw err;
    }
  }
  console.log("  ✅ Cross-tenant cache invalidation successfully blocked.");

  // ----------------------------------------------------
  // CACHE-SEC-004: Forged Tenant Identifier Prevention
  // ----------------------------------------------------
  console.log("▶ CACHE-SEC-004: Forged Tenant Identifier Prevention...");
  // Alice attempts to call set() passing tenantB's ID while logged in as Tenant A
  try {
    await service.set(tenantB, keyTenantB, "Hacked", "llm");
    throw new Error("CACHE-SEC-004 Failed: Forged tenant context was trusted!");
  } catch (err: any) {
    if (err.message && err.message.includes("Security Violation")) {
      console.log("  ✅ Spoofed client tenant context correctly blocked.");
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // CACHE-007: Namespace Invalidation
  // ----------------------------------------------------
  console.log("▶ CACHE-007: Tenant Namespace Invalidation...");
  const crawlKey = service.generateKey({ tenantId: tenantA, category: "crawl", inputs: { url: "test.com" } });
  await service.set(tenantA, crawlKey, "crawl-data", "crawl");

  // Invalidate only LLM namespace for Tenant A
  await service.invalidateTenantNamespace(tenantA, "llm");

  // Crawl result must remain untouched
  const crawlHit = await service.get(tenantA, crawlKey);
  if (crawlHit !== "crawl-data") {
    throw new Error("CACHE-007 Failed: Namespace invalidation deleted unrelated categories.");
  }

  // Invalidate everything for Tenant A
  await service.invalidateTenantNamespace(tenantA);
  const crawlHitDeleted = await service.get(tenantA, crawlKey);
  if (crawlHitDeleted !== null) {
    throw new Error("CACHE-007 Failed: Namespace invalidation failed to clear tenant's cache.");
  }
  console.log("  ✅ Tenant namespace invalidation cleans up selectively and respects isolation boundaries.");

  // ----------------------------------------------------
  // CACHE-008, 009, 010: Key Determinism & Versioning
  // ----------------------------------------------------
  console.log("▶ CACHE-008, 009 & 010: LLM Key Determinism & Crawl/Query Versioning...");
  // Determinism (sorted keys) (CACHE-008)
  const keyDet1 = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { b: 2, a: 1 } });
  const keyDet2 = service.generateKey({ tenantId: tenantA, category: "llm", inputs: { a: 1, b: 2 } });
  if (keyDet1 !== keyDet2) {
    throw new Error("CACHE-008 Failed: Input keys out of order resulted in different hashes.");
  }

  // Versioning (CACHE-009, 010)
  const keyVer1 = service.generateKey({ tenantId: tenantA, category: "crawl", inputs: { url: "a.com" }, version: "v1" });
  const keyVer2 = service.generateKey({ tenantId: tenantA, category: "crawl", inputs: { url: "a.com" }, version: "v2" });
  if (keyVer1 === keyVer2) {
    throw new Error("CACHE-009/010 Failed: Versioning was not respected.");
  }
  console.log("  ✅ Hash determinism and version isolation verified.");

  // ----------------------------------------------------
  // CACHE-011 & CACHE-012: Request Deduplication & Cleanup
  // ----------------------------------------------------
  console.log("▶ CACHE-011 & 012: Request Deduplication & Failure Cleanups...");
  let executionCount = 0;

  const expensiveOperation = async () => {
    executionCount++;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return "expensive-result";
  };

  // Run 3 identical concurrent deduplicated calls
  const dedupKey = "ws-tenant-a:compute-x";
  const p1 = deduplicator.deduplicate(dedupKey, expensiveOperation);
  const p2 = deduplicator.deduplicate(dedupKey, expensiveOperation);
  const p3 = deduplicator.deduplicate(dedupKey, expensiveOperation);

  const results = await Promise.all([p1, p2, p3]);

  if (executionCount !== 1) {
    throw new Error(`CACHE-011 Failed: Operation ran ${executionCount} times instead of being deduped to 1!`);
  }
  if (results.some(r => r !== "expensive-result")) {
    throw new Error("Deduplication returned inconsistent values.");
  }

  // CACHE-012: Failed operations clean up in-flight entries
  let failedRunCount = 0;
  const failingOperation = async () => {
    failedRunCount++;
    throw new Error("Simulation Fail");
  };

  const failKey = "ws-tenant-a:compute-fail";
  try {
    await deduplicator.deduplicate(failKey, failingOperation);
  } catch {
    // Expected
  }

  // Assert that after failure, the in-flight reference was deleted, allowing a subsequent attempt to execute (no permanent lock)
  if (deduplicator.hasInFlight(failKey)) {
    throw new Error("CACHE-012 Failed: Failed operation left stale promise in deduplicator!");
  }
  console.log("  ✅ Request deduplication and failure cleanup verified.");

  console.log("=========================================================================");
  console.log("✅ ALL CACHE INTEGRATION TEST SCENARIOS PASSED SUCCESSFULLY!");
  console.log("=========================================================================");
}

if (require.main === module) {
  runCacheTests().catch((err) => {
    console.error("❌ Test Suite Failed with Error:", err);
    process.exit(1);
  });
}
