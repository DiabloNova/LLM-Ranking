-- Migration: Unified Intelligence Data Model Schemas
-- Implements Websites, Pages, Keywords, Topics, Competitors, Historical Metrics, and all associative relationship link tables.

-- ==========================================
-- 1. WEBSITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_websites_organization ON websites(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_domain_org ON websites(organization_id, domain) WHERE deleted_at IS NULL;

ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON websites;
CREATE POLICY select_tenant_isolation_policy ON websites
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON websites;
CREATE POLICY insert_tenant_isolation_policy ON websites
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON websites;
CREATE POLICY update_tenant_isolation_policy ON websites
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON websites;
CREATE POLICY delete_tenant_isolation_policy ON websites
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. PAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  indexability TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pages_organization ON pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_pages_website ON pages(website_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_url_website ON pages(website_id, normalized_url) WHERE deleted_at IS NULL;

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages;
CREATE POLICY select_tenant_isolation_policy ON pages
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages;
CREATE POLICY insert_tenant_isolation_policy ON pages
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages;
CREATE POLICY update_tenant_isolation_policy ON pages
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages;
CREATE POLICY delete_tenant_isolation_policy ON pages
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 3. KEYWORDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  intent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_keywords_organization ON keywords(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_name_org ON keywords(organization_id, name) WHERE deleted_at IS NULL;

ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON keywords;
CREATE POLICY select_tenant_isolation_policy ON keywords
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON keywords;
CREATE POLICY insert_tenant_isolation_policy ON keywords
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON keywords;
CREATE POLICY update_tenant_isolation_policy ON keywords
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON keywords;
CREATE POLICY delete_tenant_isolation_policy ON keywords
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 4. TOPICS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_topics_organization ON topics(organization_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_topic_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_name_org ON topics(organization_id, name) WHERE deleted_at IS NULL;

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON topics;
CREATE POLICY select_tenant_isolation_policy ON topics
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON topics;
CREATE POLICY insert_tenant_isolation_policy ON topics
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON topics;
CREATE POLICY update_tenant_isolation_policy ON topics
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON topics;
CREATE POLICY delete_tenant_isolation_policy ON topics
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 5. COMPETITORS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_by TEXT NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_competitors_organization ON competitors(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_domain_org ON competitors(organization_id, domain) WHERE deleted_at IS NULL;

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON competitors;
CREATE POLICY select_tenant_isolation_policy ON competitors
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON competitors;
CREATE POLICY insert_tenant_isolation_policy ON competitors
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON competitors;
CREATE POLICY update_tenant_isolation_policy ON competitors
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON competitors;
CREATE POLICY delete_tenant_isolation_policy ON competitors
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 6. HISTORICAL METRICS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS historical_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system',
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_historical_metrics_organization ON historical_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_historical_metrics_target ON historical_metrics(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_historical_metrics_name_time ON historical_metrics(metric_name, timestamp DESC);

ALTER TABLE historical_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_metrics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON historical_metrics;
CREATE POLICY select_tenant_isolation_policy ON historical_metrics
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON historical_metrics;
CREATE POLICY insert_tenant_isolation_policy ON historical_metrics
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON historical_metrics;
CREATE POLICY update_tenant_isolation_policy ON historical_metrics
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON historical_metrics;
CREATE POLICY delete_tenant_isolation_policy ON historical_metrics
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 7. MANY-TO-MANY RELATIONSHIP JOIN TABLES
-- ==========================================

-- PAGES <-> KEYWORDS
CREATE TABLE IF NOT EXISTS pages_keywords (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, keyword_id)
);

ALTER TABLE pages_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_keywords FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages_keywords;
CREATE POLICY select_tenant_isolation_policy ON pages_keywords
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages_keywords;
CREATE POLICY insert_tenant_isolation_policy ON pages_keywords
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages_keywords;
CREATE POLICY update_tenant_isolation_policy ON pages_keywords
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages_keywords;
CREATE POLICY delete_tenant_isolation_policy ON pages_keywords
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- PAGES <-> TOPICS
CREATE TABLE IF NOT EXISTS pages_topics (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, topic_id)
);

ALTER TABLE pages_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_topics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages_topics;
CREATE POLICY select_tenant_isolation_policy ON pages_topics
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages_topics;
CREATE POLICY insert_tenant_isolation_policy ON pages_topics
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages_topics;
CREATE POLICY update_tenant_isolation_policy ON pages_topics
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages_topics;
CREATE POLICY delete_tenant_isolation_policy ON pages_topics
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- PAGES <-> ENTITIES
CREATE TABLE IF NOT EXISTS pages_entities (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, entity_id)
);

ALTER TABLE pages_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages_entities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON pages_entities;
CREATE POLICY select_tenant_isolation_policy ON pages_entities
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON pages_entities;
CREATE POLICY insert_tenant_isolation_policy ON pages_entities
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON pages_entities;
CREATE POLICY update_tenant_isolation_policy ON pages_entities
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON pages_entities;
CREATE POLICY delete_tenant_isolation_policy ON pages_entities
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- KEYWORDS <-> TOPICS
CREATE TABLE IF NOT EXISTS keywords_topics (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (keyword_id, topic_id)
);

ALTER TABLE keywords_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords_topics FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON keywords_topics;
CREATE POLICY select_tenant_isolation_policy ON keywords_topics
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON keywords_topics;
CREATE POLICY insert_tenant_isolation_policy ON keywords_topics
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON keywords_topics;
CREATE POLICY update_tenant_isolation_policy ON keywords_topics
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON keywords_topics;
CREATE POLICY delete_tenant_isolation_policy ON keywords_topics
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- TOPICS <-> ENTITIES
CREATE TABLE IF NOT EXISTS topics_entities (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, entity_id)
);

ALTER TABLE topics_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics_entities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON topics_entities;
CREATE POLICY select_tenant_isolation_policy ON topics_entities
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON topics_entities;
CREATE POLICY insert_tenant_isolation_policy ON topics_entities
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON topics_entities;
CREATE POLICY update_tenant_isolation_policy ON topics_entities
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON topics_entities;
CREATE POLICY delete_tenant_isolation_policy ON topics_entities
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
