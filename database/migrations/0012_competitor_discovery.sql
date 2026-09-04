-- Migration: Competitor Discovery and Monitoring Foundation
-- Extends competitors table with discovery metadata and creates competitor_changes table for change detection.

-- 1. Alter competitors table incrementally
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS discovery_source TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS discovery_evidence JSONB;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS first_discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_observed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_monitored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS monitoring_status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS notes_metadata JSONB;

-- 2. Create competitor_changes table for change detection
CREATE TABLE IF NOT EXISTS competitor_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL,
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Add Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_competitor_changes_organization ON competitor_changes(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_competitor ON competitor_changes(competitor_id);

-- 4. Enable Row Level Security (RLS) for competitor_changes
ALTER TABLE competitor_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_changes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON competitor_changes;
CREATE POLICY select_tenant_isolation_policy ON competitor_changes
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON competitor_changes;
CREATE POLICY insert_tenant_isolation_policy ON competitor_changes
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON competitor_changes;
CREATE POLICY update_tenant_isolation_policy ON competitor_changes
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON competitor_changes;
CREATE POLICY delete_tenant_isolation_policy ON competitor_changes
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
