-- Enable the pgvector extension to support vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create document_embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  content_chunk TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Fast tenant lookup index
CREATE INDEX IF NOT EXISTS idx_document_embeddings_tenant ON document_embeddings(tenant_id);

-- High-performance HNSW index for fast similarity search using Cosine distance operator (<=>)
CREATE INDEX IF NOT EXISTS idx_document_embeddings_embedding ON document_embeddings USING hnsw (embedding vector_cosine_ops);

-- Enable Row-Level Security for document_embeddings
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings FORCE ROW LEVEL SECURITY;

-- Set up RLS policies for document_embeddings
DROP POLICY IF EXISTS select_tenant_isolation_policy ON document_embeddings;
CREATE POLICY select_tenant_isolation_policy ON document_embeddings
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON document_embeddings;
CREATE POLICY insert_tenant_isolation_policy ON document_embeddings
  FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON document_embeddings;
CREATE POLICY update_tenant_isolation_policy ON document_embeddings
  FOR UPDATE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON document_embeddings;
CREATE POLICY delete_tenant_isolation_policy ON document_embeddings
  FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- 2. Create kg_entities table for the Persian Knowledge Graph Foundation
CREATE TABLE IF NOT EXISTS kg_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Fast tenant lookup index
CREATE INDEX IF NOT EXISTS idx_kg_entities_tenant ON kg_entities(tenant_id);
-- Fast entity name search index
CREATE INDEX IF NOT EXISTS idx_kg_entities_name ON kg_entities(name);

-- Enable Row-Level Security for kg_entities
ALTER TABLE kg_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_entities FORCE ROW LEVEL SECURITY;

-- Set up RLS policies for kg_entities
DROP POLICY IF EXISTS select_tenant_isolation_policy ON kg_entities;
CREATE POLICY select_tenant_isolation_policy ON kg_entities
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON kg_entities;
CREATE POLICY insert_tenant_isolation_policy ON kg_entities
  FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON kg_entities;
CREATE POLICY update_tenant_isolation_policy ON kg_entities
  FOR UPDATE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON kg_entities;
CREATE POLICY delete_tenant_isolation_policy ON kg_entities
  FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- 3. Create kg_relationships table for the Persian Knowledge Graph Foundation
CREATE TABLE IF NOT EXISTS kg_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Fast tenant lookup index
CREATE INDEX IF NOT EXISTS idx_kg_relationships_tenant ON kg_relationships(tenant_id);
-- Fast traversal indices
CREATE INDEX IF NOT EXISTS idx_kg_relationships_source ON kg_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_kg_relationships_target ON kg_relationships(target_entity_id);

-- Enable Row-Level Security for kg_relationships
ALTER TABLE kg_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_relationships FORCE ROW LEVEL SECURITY;

-- Set up RLS policies for kg_relationships
DROP POLICY IF EXISTS select_tenant_isolation_policy ON kg_relationships;
CREATE POLICY select_tenant_isolation_policy ON kg_relationships
  FOR SELECT
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS insert_tenant_isolation_policy ON kg_relationships;
CREATE POLICY insert_tenant_isolation_policy ON kg_relationships
  FOR INSERT
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS update_tenant_isolation_policy ON kg_relationships;
CREATE POLICY update_tenant_isolation_policy ON kg_relationships
  FOR UPDATE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS delete_tenant_isolation_policy ON kg_relationships;
CREATE POLICY delete_tenant_isolation_policy ON kg_relationships
  FOR DELETE
  USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
