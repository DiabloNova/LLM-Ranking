-- Migration: Competitive SEO Findings table and multi-tenant RLS policies
-- Implements Task 6.1 storage schema with indexes and foreign keys

CREATE TABLE IF NOT EXISTS competitive_seo_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('technical_gap', 'content_gap', 'keyword_gap', 'topic_gap', 'structural_difference')),
  comparison_scope TEXT NOT NULL,
  competitive_position TEXT NOT NULL CHECK (competitive_position IN ('advantage', 'disadvantage', 'neutral')),
  tenant_value TEXT,
  competitor_value TEXT,
  difference DOUBLE PRECISION,
  difference_direction TEXT NOT NULL CHECK (difference_direction IN ('positive', 'negative', 'none')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_reference TEXT,
  calculation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Optimize queries by tenant, competitor, and finding types
CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_organization ON competitive_seo_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_competitor ON competitive_seo_findings(competitor_id);
CREATE INDEX IF NOT EXISTS idx_comp_seo_findings_type_scope ON competitive_seo_findings(finding_type, comparison_scope);

-- Enable Row Level Security (RLS) for multi-tenant protection
ALTER TABLE competitive_seo_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_seo_findings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY select_tenant_isolation_policy ON competitive_seo_findings
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY insert_tenant_isolation_policy ON competitive_seo_findings
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY update_tenant_isolation_policy ON competitive_seo_findings
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON competitive_seo_findings;
CREATE POLICY delete_tenant_isolation_policy ON competitive_seo_findings
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
