-- Migration: AI Citation Intelligence Core Schemas
-- Implements Citation Sources and Citation Occurrences with complete RLS.

-- ==========================================
-- 1. CITATION SOURCES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS citation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  canonical_url TEXT,
  classification TEXT NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  authority_score INTEGER NOT NULL CHECK (authority_score >= 0 AND authority_score <= 100),
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citation_sources_organization ON citation_sources(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_citation_sources_domain_org ON citation_sources(organization_id, domain);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE citation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_sources FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON citation_sources;
CREATE POLICY select_tenant_isolation_policy ON citation_sources
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON citation_sources;
CREATE POLICY insert_tenant_isolation_policy ON citation_sources
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON citation_sources;
CREATE POLICY update_tenant_isolation_policy ON citation_sources
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON citation_sources;
CREATE POLICY delete_tenant_isolation_policy ON citation_sources
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. CITATION OCCURRENCES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS citation_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES citation_sources(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES ai_visibility_audits(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES prompt_executions(id) ON DELETE CASCADE,
  prompt_id UUID,
  observation_id UUID REFERENCES ai_observations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  position INTEGER,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citation_occurrences_organization ON citation_occurrences(organization_id);
CREATE INDEX IF NOT EXISTS idx_citation_occurrences_source ON citation_occurrences(source_id);
CREATE INDEX IF NOT EXISTS idx_citation_occurrences_audit ON citation_occurrences(audit_id);
CREATE INDEX IF NOT EXISTS idx_citation_occurrences_execution ON citation_occurrences(execution_id);
-- Unique index to prevent duplicate occurrence discoveries from same source in same observation run (Idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS idx_citation_occ_uniqueness ON citation_occurrences(organization_id, source_id, observation_id, url);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE citation_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_occurrences FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON citation_occurrences;
CREATE POLICY select_tenant_isolation_policy ON citation_occurrences
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON citation_occurrences;
CREATE POLICY insert_tenant_isolation_policy ON citation_occurrences
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON citation_occurrences;
CREATE POLICY update_tenant_isolation_policy ON citation_occurrences
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON citation_occurrences;
CREATE POLICY delete_tenant_isolation_policy ON citation_occurrences
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
