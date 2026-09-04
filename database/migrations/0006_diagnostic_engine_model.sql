-- Migration: Unified Diagnostic Engine Model Schemas
-- Implements Diagnostic Findings and Diagnostic Finding Relationships tables.

-- ==========================================
-- 1. DIAGNOSTIC FINDINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS diagnostic_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
  affected_resource TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_organization ON diagnostic_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_website ON diagnostic_findings(website_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_findings_category ON diagnostic_findings(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostic_findings_dedup ON diagnostic_findings(organization_id, website_id, code, affected_resource) WHERE deleted_at IS NULL;

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE diagnostic_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_findings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY select_tenant_isolation_policy ON diagnostic_findings
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY insert_tenant_isolation_policy ON diagnostic_findings
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY update_tenant_isolation_policy ON diagnostic_findings
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON diagnostic_findings;
CREATE POLICY delete_tenant_isolation_policy ON diagnostic_findings
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. DIAGNOSTIC FINDING RELATIONSHIPS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS diagnostic_finding_relationships (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_finding_id UUID NOT NULL REFERENCES diagnostic_findings(id) ON DELETE CASCADE,
  target_finding_id UUID NOT NULL REFERENCES diagnostic_findings(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (source_finding_id, target_finding_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_finding_relationships_organization ON diagnostic_finding_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_finding_relationships_source ON diagnostic_finding_relationships(source_finding_id);
CREATE INDEX IF NOT EXISTS idx_finding_relationships_target ON diagnostic_finding_relationships(target_finding_id);

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE diagnostic_finding_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_finding_relationships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY select_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY insert_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY update_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON diagnostic_finding_relationships;
CREATE POLICY delete_tenant_isolation_policy ON diagnostic_finding_relationships
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
