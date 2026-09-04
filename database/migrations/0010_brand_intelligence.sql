-- Migration: AI Brand Intelligence Core Schemas
-- Implements Brand Associations and Recommendation Observations with complete RLS.

-- ==========================================
-- 1. BRAND ASSOCIATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS brand_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  supporting_context TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_associations_organization ON brand_associations(organization_id);
CREATE INDEX IF NOT EXISTS idx_brand_associations_brand ON brand_associations(brand_id);
-- Unique index to prevent duplicate associations for same brand and entity relationship within tenant context
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_associations_uniqueness ON brand_associations(organization_id, brand_id, entity_name, relationship_type);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE brand_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_associations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON brand_associations;
CREATE POLICY select_tenant_isolation_policy ON brand_associations
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON brand_associations;
CREATE POLICY insert_tenant_isolation_policy ON brand_associations
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON brand_associations;
CREATE POLICY update_tenant_isolation_policy ON brand_associations
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON brand_associations;
CREATE POLICY delete_tenant_isolation_policy ON brand_associations
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. RECOMMENDATION OBSERVATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS recommendation_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES prompt_executions(id) ON DELETE CASCADE,
  prompt_id UUID,
  observation_id UUID NOT NULL REFERENCES ai_observations(id) ON DELETE CASCADE,
  recommendation_status TEXT NOT NULL CHECK (recommendation_status IN ('mention', 'consideration', 'recommendation', 'strong_recommendation', 'negative_recommendation')),
  position INTEGER,
  evidence_excerpt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_observations_organization ON recommendation_observations(organization_id);
CREATE INDEX IF NOT EXISTS idx_rec_observations_brand ON recommendation_observations(brand_id);
-- Unique index to prevent duplicate recommendation records for same brand and observation run (Idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_observations_uniqueness ON recommendation_observations(organization_id, brand_id, observation_id);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE recommendation_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_observations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON recommendation_observations;
CREATE POLICY select_tenant_isolation_policy ON recommendation_observations
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON recommendation_observations;
CREATE POLICY insert_tenant_isolation_policy ON recommendation_observations
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON recommendation_observations;
CREATE POLICY update_tenant_isolation_policy ON recommendation_observations
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON recommendation_observations;
CREATE POLICY delete_tenant_isolation_policy ON recommendation_observations
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
