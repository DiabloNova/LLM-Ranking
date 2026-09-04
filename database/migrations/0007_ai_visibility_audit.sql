-- Migration: AI Visibility Audit Core Schemas
-- Implements AI Visibility Audits and Audit Prompts tables with complete RLS.

-- ==========================================
-- 1. AI VISIBILITY AUDITS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_visibility_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'ANALYZING', 'COMPLETED', 'FAILED')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  prompts_coverage JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring_version TEXT NOT NULL DEFAULT '1.0.0',
  analyzer_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_organization ON ai_visibility_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_brand ON ai_visibility_audits(brand_id);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_audits_status ON ai_visibility_audits(status);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE ai_visibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_visibility_audits FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY select_tenant_isolation_policy ON ai_visibility_audits
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY insert_tenant_isolation_policy ON ai_visibility_audits
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY update_tenant_isolation_policy ON ai_visibility_audits
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON ai_visibility_audits;
CREATE POLICY delete_tenant_isolation_policy ON ai_visibility_audits
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. AUDIT PROMPTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES ai_visibility_audits(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  error_message TEXT,
  latency_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE,
  response_text TEXT,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_audit_prompts_organization ON audit_prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_prompts_audit ON audit_prompts(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_prompts_status ON audit_prompts(status);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE audit_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_prompts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON audit_prompts;
CREATE POLICY select_tenant_isolation_policy ON audit_prompts
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON audit_prompts;
CREATE POLICY insert_tenant_isolation_policy ON audit_prompts
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON audit_prompts;
CREATE POLICY update_tenant_isolation_policy ON audit_prompts
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON audit_prompts;
CREATE POLICY delete_tenant_isolation_policy ON audit_prompts
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
