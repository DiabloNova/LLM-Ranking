-- Website Monitoring Foundation Domain

-- 1. Monitoring Configs
CREATE TABLE IF NOT EXISTS monitoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  crawl_policy JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_configs_org ON monitoring_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_website ON monitoring_configs(website_id);

ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_configs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON monitoring_configs;
CREATE POLICY select_tenant_isolation_policy ON monitoring_configs
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON monitoring_configs;
CREATE POLICY insert_tenant_isolation_policy ON monitoring_configs
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON monitoring_configs;
CREATE POLICY update_tenant_isolation_policy ON monitoring_configs
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON monitoring_configs;
CREATE POLICY delete_tenant_isolation_policy ON monitoring_configs
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 2. Crawl Snapshots
CREATE TABLE IF NOT EXISTS crawl_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monitoring_config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
  crawl_job_id UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  content_hash TEXT,
  extracted_content TEXT,
  snapshot_metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crawl_snapshots_org ON crawl_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_crawl_snapshots_config ON crawl_snapshots(monitoring_config_id);
CREATE INDEX IF NOT EXISTS idx_crawl_snapshots_captured ON crawl_snapshots(captured_at DESC);

ALTER TABLE crawl_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_snapshots FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON crawl_snapshots;
CREATE POLICY select_tenant_isolation_policy ON crawl_snapshots
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON crawl_snapshots;
CREATE POLICY insert_tenant_isolation_policy ON crawl_snapshots
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON crawl_snapshots;
CREATE POLICY update_tenant_isolation_policy ON crawl_snapshots
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON crawl_snapshots;
CREATE POLICY delete_tenant_isolation_policy ON crawl_snapshots
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 3. Monitoring Alerts
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monitoring_config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
  crawl_snapshot_id UUID REFERENCES crawl_snapshots(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  dedup_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_org ON monitoring_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_config ON monitoring_alerts(monitoring_config_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monitoring_alerts_dedup ON monitoring_alerts(organization_id, dedup_key);

ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON monitoring_alerts;
CREATE POLICY select_tenant_isolation_policy ON monitoring_alerts
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON monitoring_alerts;
CREATE POLICY insert_tenant_isolation_policy ON monitoring_alerts
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON monitoring_alerts;
CREATE POLICY update_tenant_isolation_policy ON monitoring_alerts
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON monitoring_alerts;
CREATE POLICY delete_tenant_isolation_policy ON monitoring_alerts
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
