-- Migration: AI Prompt Intelligence Core Schemas
-- Implements Prompt Definitions, Schedules, Executions, and Position Observations with complete RLS.

-- ==========================================
-- 1. PROMPT DEFINITIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS prompt_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  category TEXT NOT NULL,
  intent TEXT NOT NULL,
  locale TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  competitors TEXT[] NOT NULL DEFAULT '{}'::text[],
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  opt_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_prompt_definitions_organization ON prompt_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompt_definitions_brand ON prompt_definitions(brand_id);
CREATE INDEX IF NOT EXISTS idx_prompt_definitions_category ON prompt_definitions(category);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_definitions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON prompt_definitions;
CREATE POLICY select_tenant_isolation_policy ON prompt_definitions
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON prompt_definitions;
CREATE POLICY insert_tenant_isolation_policy ON prompt_definitions
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON prompt_definitions;
CREATE POLICY update_tenant_isolation_policy ON prompt_definitions
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON prompt_definitions;
CREATE POLICY delete_tenant_isolation_policy ON prompt_definitions
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. PROMPT SCHEDULES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS prompt_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompt_definitions(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cron_expression TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  next_execution_at TIMESTAMP WITH TIME ZONE,
  last_execution_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'IDLE',
  failure_reason TEXT,
  schedule_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_prompt_schedules_organization ON prompt_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompt_schedules_prompt ON prompt_schedules(prompt_id);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE prompt_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_schedules FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON prompt_schedules;
CREATE POLICY select_tenant_isolation_policy ON prompt_schedules
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON prompt_schedules;
CREATE POLICY insert_tenant_isolation_policy ON prompt_schedules
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON prompt_schedules;
CREATE POLICY update_tenant_isolation_policy ON prompt_schedules
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON prompt_schedules;
CREATE POLICY delete_tenant_isolation_policy ON prompt_schedules
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 3. PROMPT EXECUTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS prompt_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompt_definitions(id) ON DELETE CASCADE,
  prompt_version INTEGER NOT NULL,
  resolved_prompt_text TEXT NOT NULL,
  variables_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'timed_out', 'cancelled')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  model_version TEXT,
  response_text TEXT,
  latency_ms INTEGER,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_prompt_executions_organization ON prompt_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_prompt ON prompt_executions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_status ON prompt_executions(status);
-- Enforces deterministic identity mapping for scheduled runs (scheduledPromptId + scheduleVersion + scheduledFor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_runs_unique ON prompt_executions(prompt_id, prompt_version, scheduled_for) WHERE scheduled_for IS NOT NULL AND deleted_at IS NULL;

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON prompt_executions;
CREATE POLICY select_tenant_isolation_policy ON prompt_executions
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON prompt_executions;
CREATE POLICY insert_tenant_isolation_policy ON prompt_executions
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON prompt_executions;
CREATE POLICY update_tenant_isolation_policy ON prompt_executions
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON prompt_executions;
CREATE POLICY delete_tenant_isolation_policy ON prompt_executions
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 4. POSITION OBSERVATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS position_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_execution_id UUID NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  subject_entity_id TEXT NOT NULL,
  presence TEXT NOT NULL CHECK (presence IN ('not_present', 'mentioned', 'recommended', 'ranked', 'unknown')),
  numeric_position INTEGER,
  evidence_excerpt TEXT NOT NULL,
  evidence_structure TEXT NOT NULL CHECK (evidence_structure IN ('numbered_list', 'bullet_list', 'table', 'prose', 'unknown')),
  confidence DOUBLE PRECISION NOT NULL,
  analyzer_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_position_obs_organization ON position_observations(organization_id);
CREATE INDEX IF NOT EXISTS idx_position_obs_execution ON position_observations(source_execution_id);
CREATE INDEX IF NOT EXISTS idx_position_obs_subject ON position_observations(subject_entity_id);

-- Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE position_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_observations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON position_observations;
CREATE POLICY select_tenant_isolation_policy ON position_observations
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON position_observations;
CREATE POLICY insert_tenant_isolation_policy ON position_observations
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON position_observations;
CREATE POLICY update_tenant_isolation_policy ON position_observations
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON position_observations;
CREATE POLICY delete_tenant_isolation_policy ON position_observations
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
