-- Migration: AEO Content Intelligence Schemas
-- Implements aeo_analyses, faq_opportunities, and kg_alignments tables.

-- ==========================================
-- 1. AEO ANALYSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS aeo_analyses (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  overall_score DOUBLE PRECISION NOT NULL,
  answerability JSONB NOT NULL,
  entity_coverage JSONB NOT NULL,
  semantic_coverage JSONB NOT NULL,
  question_coverage JSONB NOT NULL,
  citation_readiness JSONB NOT NULL,
  structured_answer_quality JSONB NOT NULL,
  kg_alignment JSONB NOT NULL,
  scoring_version TEXT NOT NULL,
  analyzer_version TEXT NOT NULL,
  provenance JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aeo_analyses_organization ON aeo_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_aeo_analyses_page ON aeo_analyses(page_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aeo_analyses_page_unique ON aeo_analyses(page_id, analyzer_version, scoring_version);

ALTER TABLE aeo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_analyses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON aeo_analyses;
CREATE POLICY select_tenant_isolation_policy ON aeo_analyses
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON aeo_analyses;
CREATE POLICY insert_tenant_isolation_policy ON aeo_analyses
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON aeo_analyses;
CREATE POLICY update_tenant_isolation_policy ON aeo_analyses
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON aeo_analyses;
CREATE POLICY delete_tenant_isolation_policy ON aeo_analyses
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 2. FAQ OPPORTUNITIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS faq_opportunities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  source_type TEXT NOT NULL,
  evidence_source_id UUID,
  priority TEXT NOT NULL,
  impact_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_opportunities_organization ON faq_opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_faq_opportunities_page ON faq_opportunities(page_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_faq_opportunities_page_question ON faq_opportunities(page_id, question);

ALTER TABLE faq_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_opportunities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON faq_opportunities;
CREATE POLICY select_tenant_isolation_policy ON faq_opportunities
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON faq_opportunities;
CREATE POLICY insert_tenant_isolation_policy ON faq_opportunities
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON faq_opportunities;
CREATE POLICY update_tenant_isolation_policy ON faq_opportunities
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON faq_opportunities;
CREATE POLICY delete_tenant_isolation_policy ON faq_opportunities
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ==========================================
-- 3. KG ALIGNMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS kg_alignments (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  alignment_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  property_name TEXT,
  expected_value TEXT,
  actual_value TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_alignments_organization ON kg_alignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_kg_alignments_page ON kg_alignments(page_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_alignments_unique ON kg_alignments(page_id, alignment_type, entity_name, COALESCE(property_name, ''));

ALTER TABLE kg_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_alignments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_tenant_isolation_policy ON kg_alignments;
CREATE POLICY select_tenant_isolation_policy ON kg_alignments
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON kg_alignments;
CREATE POLICY insert_tenant_isolation_policy ON kg_alignments
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON kg_alignments;
CREATE POLICY update_tenant_isolation_policy ON kg_alignments
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON kg_alignments;
CREATE POLICY delete_tenant_isolation_policy ON kg_alignments
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
