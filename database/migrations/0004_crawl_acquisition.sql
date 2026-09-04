CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  requested_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  policy JSONB NOT NULL,
  dedup_key TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED')),
  provider_id TEXT,
  provider_job_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL CHECK (max_attempts > 0),
  scheduled_for TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  lease_expires_at TIMESTAMPTZ,
  worker_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  page_count INTEGER,
  bytes_processed BIGINT,
  cache_outcome TEXT CHECK (cache_outcome IN ('HIT', 'MISS', 'STALE', 'BYPASS')),
  error JSONB,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_requested_by TEXT,
  result_ref UUID,
  correlation_id TEXT,
  request_id TEXT,
  trace_id TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT crawl_results_job_unique UNIQUE (job_id),
  CONSTRAINT crawl_results_tenant_job_unique UNIQUE (tenant_id, job_id)
);

CREATE TABLE IF NOT EXISTS crawl_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  cache_scope TEXT NOT NULL DEFAULT 'tenant'
    CONSTRAINT crawl_cache_scope_check CHECK (cache_scope = 'tenant'),
  cache_key TEXT NOT NULL,
  normalized_result JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crawl_cache DROP CONSTRAINT IF EXISTS crawl_cache_cache_scope_check;
ALTER TABLE crawl_cache DROP CONSTRAINT IF EXISTS crawl_cache_scope_check;
ALTER TABLE crawl_cache
  ADD CONSTRAINT crawl_cache_scope_check CHECK (cache_scope = 'tenant');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conname = 'crawl_results_job_unique'
      AND conrelid = 'public.crawl_results'::pg_catalog.regclass
  ) THEN
    ALTER TABLE crawl_results
      ADD CONSTRAINT crawl_results_job_unique UNIQUE (job_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conname = 'crawl_results_tenant_job_unique'
      AND conrelid = 'public.crawl_results'::pg_catalog.regclass
  ) THEN
    ALTER TABLE crawl_results
      ADD CONSTRAINT crawl_results_tenant_job_unique UNIQUE (tenant_id, job_id);
  END IF;
END;
$$;

-- These indexes serve tenant status/history, queued dispatch ordering, provider
-- callback lookup, active deduplication, and tenant cache lookup respectively.
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_tenant_status
  ON crawl_jobs (tenant_id, status);
DROP INDEX IF EXISTS idx_crawl_jobs_status_scheduled;
CREATE INDEX idx_crawl_jobs_status_scheduled
  ON crawl_jobs (status, scheduled_for)
  WHERE status = 'QUEUED';
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_provider_job_id
  ON crawl_jobs (provider_job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_tenant_created
  ON crawl_jobs (tenant_id, created_at);
DROP INDEX IF EXISTS idx_crawl_jobs_active_dedup;
CREATE UNIQUE INDEX idx_crawl_jobs_active_dedup
  ON crawl_jobs (tenant_id, dedup_key)
  WHERE status IN ('PENDING', 'QUEUED', 'RUNNING');
CREATE UNIQUE INDEX IF NOT EXISTS idx_crawl_cache_key
  ON crawl_cache (tenant_id, cache_scope, cache_key);

ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_results FORCE ROW LEVEL SECURITY;
ALTER TABLE crawl_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_cache FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crawl_jobs_tenant_policy ON crawl_jobs;
CREATE POLICY crawl_jobs_tenant_policy ON crawl_jobs
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS crawl_results_tenant_policy ON crawl_results;
CREATE POLICY crawl_results_tenant_policy ON crawl_results
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

DROP POLICY IF EXISTS crawl_cache_tenant_policy ON crawl_cache;
CREATE POLICY crawl_cache_tenant_policy ON crawl_cache
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

-- The migrating role must be a superuser or have BYPASSRLS. The application
-- role receives EXECUTE only; it receives no blanket RLS bypass privilege.
CREATE OR REPLACE FUNCTION claim_crawl_jobs(
  requested_worker_id TEXT,
  requested_limit INTEGER,
  requested_lease_ms INTEGER
)
RETURNS TABLE (id UUID, tenant_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT jobs.id
    FROM public.crawl_jobs AS jobs
    WHERE jobs.status = 'QUEUED'
      AND (jobs.scheduled_for IS NULL OR jobs.scheduled_for <= pg_catalog.now())
    ORDER BY jobs.priority DESC, jobs.scheduled_for ASC NULLS FIRST, jobs.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT requested_limit
  )
  UPDATE public.crawl_jobs AS jobs
  SET status = 'RUNNING',
      worker_id = requested_worker_id,
      claimed_at = pg_catalog.now(),
      heartbeat_at = pg_catalog.now(),
      lease_expires_at = pg_catalog.now() +
        (requested_lease_ms * INTERVAL '1 millisecond'),
      attempts = jobs.attempts + 1,
      updated_at = pg_catalog.now(),
      version = jobs.version + 1
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.id, jobs.tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION recover_expired_crawl_jobs()
RETURNS TABLE (id UUID, tenant_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.crawl_jobs AS jobs
  SET status = CASE
        WHEN jobs.attempts >= jobs.max_attempts THEN 'FAILED'
        ELSE 'QUEUED'
      END,
      worker_id = NULL,
      claimed_at = NULL,
      heartbeat_at = NULL,
      lease_expires_at = NULL,
      completed_at = CASE
        WHEN jobs.attempts >= jobs.max_attempts THEN pg_catalog.now()
        ELSE jobs.completed_at
      END,
      error = CASE
        WHEN jobs.attempts >= jobs.max_attempts THEN
          pg_catalog.jsonb_build_object(
            'code', 'TIMEOUT',
            'public', pg_catalog.jsonb_build_object(
              'code', 'TIMEOUT',
              'message', 'The crawl worker lease expired'
            )
          )
        ELSE jobs.error
      END,
      updated_at = pg_catalog.now(),
      version = jobs.version + 1
  WHERE jobs.status = 'RUNNING'
    AND jobs.lease_expires_at < pg_catalog.now()
  RETURNING jobs.id, jobs.tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION complete_crawl_job_if_lease_owner(
  requested_job_id UUID,
  requested_worker_id TEXT,
  expected_version INTEGER,
  next_status TEXT,
  requested_provider_id TEXT DEFAULT NULL,
  requested_provider_job_id TEXT DEFAULT NULL,
  requested_duration_ms INTEGER DEFAULT NULL,
  requested_page_count INTEGER DEFAULT NULL,
  requested_bytes_processed BIGINT DEFAULT NULL,
  requested_cache_outcome TEXT DEFAULT NULL,
  requested_result_ref UUID DEFAULT NULL,
  requested_error JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  changed INTEGER;
BEGIN
  IF next_status NOT IN ('SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Invalid terminal crawl status: %', next_status;
  END IF;

  UPDATE public.crawl_jobs AS jobs
  SET status = next_status,
      provider_id = COALESCE(requested_provider_id, jobs.provider_id),
      provider_job_id = COALESCE(requested_provider_job_id, jobs.provider_job_id),
      duration_ms = COALESCE(requested_duration_ms, jobs.duration_ms),
      page_count = COALESCE(requested_page_count, jobs.page_count),
      bytes_processed = COALESCE(requested_bytes_processed, jobs.bytes_processed),
      cache_outcome = COALESCE(requested_cache_outcome, jobs.cache_outcome),
      result_ref = COALESCE(requested_result_ref, jobs.result_ref),
      error = COALESCE(requested_error, jobs.error),
      completed_at = pg_catalog.now(),
      updated_at = pg_catalog.now(),
      version = jobs.version + 1
  WHERE jobs.id = requested_job_id
    AND jobs.worker_id = requested_worker_id
    AND jobs.version = expected_version
    AND jobs.status = 'RUNNING'
    AND jobs.lease_expires_at > pg_catalog.now();

  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

REVOKE ALL ON FUNCTION claim_crawl_jobs(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION recover_expired_crawl_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_crawl_job_if_lease_owner(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, BIGINT, TEXT, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_crawl_jobs(TEXT, INTEGER, INTEGER) TO crawler;
GRANT EXECUTE ON FUNCTION recover_expired_crawl_jobs() TO crawler;
GRANT EXECUTE ON FUNCTION complete_crawl_job_if_lease_owner(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, BIGINT, TEXT, UUID, JSONB) TO crawler;
