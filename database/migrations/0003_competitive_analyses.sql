CREATE TABLE IF NOT EXISTS competitive_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_url TEXT NOT NULL,
  competitor_urls TEXT[] NOT NULL,
  overall_score INTEGER NOT NULL,
  market_position TEXT NOT NULL,
  comparison_data JSONB NOT NULL,
  advantages JSONB NOT NULL,
  gaps JSONB NOT NULL,
  opportunities JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable PostgreSQL Row Level Security (RLS) for zero-trust tenant isolation
ALTER TABLE competitive_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_analyses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON competitive_analyses;
CREATE POLICY select_tenant_isolation_policy ON competitive_analyses
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON competitive_analyses;
CREATE POLICY insert_tenant_isolation_policy ON competitive_analyses
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON competitive_analyses;
CREATE POLICY update_tenant_isolation_policy ON competitive_analyses
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON competitive_analyses;
CREATE POLICY delete_tenant_isolation_policy ON competitive_analyses
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
