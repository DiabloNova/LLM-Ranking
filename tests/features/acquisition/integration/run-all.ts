import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Pool, type PoolClient } from "pg";
import { TenantContextManager } from "../../../../src/core/database/tenant-context";
import { PostgresClient } from "../../../../src/features/admin/infrastructure/persistence/postgres";
import {
  CrawlCacheRepository,
  CrawlDispatcherRepository,
  CrawlJobRepository,
  CrawlResultRepository
} from "../../../../src/features/acquisition/infrastructure/persistence/postgres";
import { resolveCrawlPolicy } from "../../../../src/features/acquisition/domain/policy";
import { normalizeUrl } from "../../../../src/features/acquisition/domain/url/normalizer";
import type {
  CrawlRequest,
  CrawlResult
} from "../../../../src/features/acquisition/domain/contracts";
import { CrawlOrchestrator } from "../../../../src/features/acquisition/application/orchestrator";
import { ProviderRouter } from "../../../../src/features/acquisition/application/provider-router";
import { HttpCrawlProvider } from "../../../../src/features/acquisition/infrastructure/providers/http-crawl-provider";

const databaseUrl = process.env.DATABASE_URL;
const policy = resolveCrawlPolicy({});
const normalized = normalizeUrl("https://example.com/");

const normalizedUrl = normalized.ok
  ? normalized.value
  : (() => {
      throw normalized.error;
    })();

const result: CrawlResult = {
  documents: [],
  pageCount: 0,
  bytesProcessed: 0,
  partial: false,
  durationMs: 0,
  provider: { id: "integration" },
  errors: []
};

function request(
  tenantId: string,
  policyOverride = policy
): CrawlRequest {
  return {
    tenantId,
    requestedUrl: "https://example.com/",
    normalizedUrl,
    policy: policyOverride,
    priority: 0,
    requestId: `integration-${tenantId}`
  };
}

async function withTenant<T>(
  tenantId: string,
  work: () => Promise<T>
): Promise<T> {
  return TenantContextManager.runWithTenantContext(
    tenantId,
    null,
    `integration-${tenantId}`,
    work
  );
}

async function rawTenant(
  pool: Pool,
  tenantId: string,
  work: (client: PoolClient) => Promise<void>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.current_tenant_id', $1, true)",
      [tenantId]
    );
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function cleanup(pool: Pool, tenantId: string): Promise<void> {
  await rawTenant(pool, tenantId, async client => {
    await client.query("DELETE FROM crawl_cache WHERE tenant_id = $1", [
      tenantId
    ]);
    await client.query("DELETE FROM crawl_jobs WHERE tenant_id = $1", [
      tenantId
    ]);
  });
}

async function main(): Promise<void> {
  if (!databaseUrl) {
    console.log(
      "⚠️ acquisition integration suite skipped: DATABASE_URL is not set"
    );
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 24 });
  const jobs = new CrawlJobRepository();
  const cache = new CrawlCacheRepository();
  const results = new CrawlResultRepository();
  const dispatcher = new CrawlDispatcherRepository(pool);

  try {
    await withTenant("ws-context", async () => {
      const client = TenantContextManager.getDbClient() as PoolClient | null;
      assert.ok(client);
      const setting = await client.query<{ value: string }>(
        "SELECT current_setting('app.current_tenant_id', true) AS value"
      );
      assert.equal(setting.rows[0]?.value, "ws-context");
    });

    await cleanup(pool, "ws-a");
    await cleanup(pool, "ws-b");
    const tenantAJob = await withTenant("ws-a", () =>
      jobs.createOrGetByDedup({ request: request("ws-a") })
    );
    await withTenant("ws-a", async () => {
      await results.put(tenantAJob.id, result);
      await cache.put("cache-a", result, new Date(Date.now() + 60_000));
    });
    await withTenant("ws-b", async () => {
      assert.equal(await jobs.getById(tenantAJob.id), null);
      assert.equal((await results.getByJobId(tenantAJob.id)), null);
      assert.equal((await cache.get("cache-a")).outcome, "MISS");
      await assert.rejects(
        () => cache.get("cache-a", "global"),
        error => error instanceof Error && error.name === "CrawlError"
      );
    });

    await cleanup(pool, "ws-concurrent");
    const concurrent = await Promise.all(
      Array.from({ length: 12 }, () =>
        withTenant("ws-concurrent", () =>
          jobs.createOrGetByDedup({
            request: request("ws-concurrent")
          })
        )
      )
    );
    assert.equal(new Set(concurrent.map(job => job.id)).size, 1);
    const observedActive = await withTenant("ws-concurrent", async () => {
      const client = TenantContextManager.getDbClient() as PoolClient;
      const rows = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM crawl_jobs
         WHERE tenant_id = $1 AND dedup_key = $2
           AND status IN ('PENDING', 'QUEUED', 'RUNNING')`,
        ["ws-concurrent", concurrent[0].dedupKey]
      );
      return Number(rows.rows[0]?.count);
    });
    assert.equal(observedActive, 1);

    await cleanup(pool, "ws-policy");
    const first = await withTenant("ws-policy", () =>
      jobs.createOrGetByDedup({ request: request("ws-policy") })
    );
    const second = await withTenant("ws-policy", () =>
      jobs.createOrGetByDedup({
        request: request("ws-policy", { ...policy, maxPages: 2 })
      })
    );
    assert.notEqual(first.id, second.id);

    await cleanup(pool, "ws-race");
    const raceJob = await withTenant("ws-race", () =>
      jobs.createOrGetByDedup({ request: request("ws-race") })
    );
    const queued = await withTenant("ws-race", () =>
      jobs.transition(raceJob.id, "PENDING", raceJob.version, "QUEUED")
    );
    const transitions = await Promise.allSettled(
      [0, 1].map(() =>
        withTenant("ws-race", () =>
          jobs.transition(queued.id, "QUEUED", queued.version, "RUNNING")
        )
      )
    );
    assert.equal(
      transitions.filter(entry => entry.status === "fulfilled").length,
      1
    );
    assert.equal(
      transitions.filter(entry => entry.status === "rejected").length,
      1
    );

    await cleanup(pool, "ws-dispatch-a");
    await cleanup(pool, "ws-dispatch-b");
    await cleanup(pool, "ws-recovery");
    await cleanup(pool, "ws-e2e");
    const dispatchA = await withTenant("ws-dispatch-a", () =>
      jobs.createOrGetByDedup({ request: request("ws-dispatch-a") })
    );
    const dispatchB = await withTenant("ws-dispatch-b", () =>
      jobs.createOrGetByDedup({ request: request("ws-dispatch-b") })
    );
    await withTenant("ws-dispatch-a", () =>
      jobs.transition(dispatchA.id, "PENDING", dispatchA.version, "QUEUED")
    );
    await withTenant("ws-dispatch-b", () =>
      jobs.transition(dispatchB.id, "PENDING", dispatchB.version, "QUEUED")
    );
    const claimed = await dispatcher.claim("integration-worker", 2, 60_000);
    assert.deepEqual(
      new Set(claimed.map(candidate => candidate.tenantId)),
      new Set(["ws-dispatch-a", "ws-dispatch-b"])
    );

    await cleanup(pool, "ws-recovery");
    const recoveryJob = await withTenant("ws-recovery", () =>
      jobs.createOrGetByDedup({ request: request("ws-recovery") })
    );
    const recoveryQueued = await withTenant("ws-recovery", () =>
      jobs.transition(
        recoveryJob.id,
        "PENDING",
        recoveryJob.version,
        "QUEUED"
      )
    );
    const recoveryClaim = (await dispatcher.claim(
      "dead-worker",
      1,
      60_000
    )).find(candidate => candidate.id === recoveryQueued.id);
    assert.ok(recoveryClaim);
    const running = await withTenant("ws-recovery", () =>
      jobs.getById(recoveryClaim.id)
    );
    assert.ok(running);
    await rawTenant(pool, "ws-recovery", async client => {
      await client.query(
        "UPDATE crawl_jobs SET lease_expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1",
        [recoveryClaim.id]
      );
    });
    const recovered = await dispatcher.recoverExpired();
    assert.ok(recovered.some(candidate => candidate.id === recoveryClaim.id));
    assert.equal(
      await dispatcher.completeIfLeaseOwner(
        recoveryClaim.id,
        "dead-worker",
        running.version,
        "SUCCEEDED"
      ),
      false
    );
    const queuedAgain = await withTenant("ws-recovery", () =>
      jobs.getById(recoveryClaim.id)
    );
    assert.equal(queuedAgain?.status, "QUEUED");

    await cleanup(pool, "ws-e2e");
    const server = createServer((_request, response) => {
      response
        .writeHead(200, { "content-type": "text/html" })
        .end("<html><title>E2E</title><body>crawl result</body></html>");
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const localUrl = `http://127.0.0.1:${address.port}/`;
    const localPolicy = resolveCrawlPolicy({
      robotsPolicy: "ignore",
      maxPages: 1
    });
    const localRouter = new ProviderRouter([
      new HttpCrawlProvider({
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      })
    ]);
    const localOrchestrator = new CrawlOrchestrator(
      jobs,
      cache,
      results,
      localRouter,
      async () => ({ ok: true, ips: ["127.0.0.1"] })
    );
    const submission = await withTenant("ws-e2e", () =>
      localOrchestrator.submit("ws-e2e", localUrl, localPolicy)
    );
    assert.ok(submission.job);
    const candidate = (await dispatcher.claim("e2e-worker", 100, 60_000)).find(
      item => item.id === submission.job?.id
    );
    assert.ok(candidate);
    const leaseVersion = submission.job.version + 1;
    const e2eRunning = await withTenant("ws-e2e", () => jobs.getById(candidate.id));
    assert.equal(e2eRunning?.status, "RUNNING");
    await localOrchestrator.execute(e2eRunning as NonNullable<typeof e2eRunning>, new AbortController().signal, {
      runTenantOperation: operation => withTenant("ws-e2e", operation),
      getExpectedVersion: () => leaseVersion,
      completeIfLeaseOwner: (status, expectedVersion, facts) =>
        dispatcher.completeIfLeaseOwner(
          candidate.id,
          "e2e-worker",
          expectedVersion,
          status,
          facts
        )
    });
    const terminal = await withTenant("ws-e2e", () => jobs.getById(candidate.id));
    assert.equal(terminal?.status, "SUCCEEDED");
    assert.ok(await withTenant("ws-e2e", () => results.getByJobId(candidate.id)));
    const hit = await withTenant("ws-e2e", () =>
      localOrchestrator.submit("ws-e2e", localUrl, localPolicy)
    );
    assert.equal(hit.cacheOutcome, "HIT");
    await new Promise<void>(resolve => server.close(() => resolve()));

    console.log("✅ acquisition integration suites passed");
  } finally {
    await pool.end();
    await PostgresClient.getInstance().getPool().end();
  }
}

main().catch((error: unknown) => {
  console.error("❌ acquisition integration suite failed", error);
  process.exitCode = 1;
});
