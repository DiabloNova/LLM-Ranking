CREATE TABLE IF NOT EXISTS technical_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  url TEXT NOT NULL,
  technical_score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  pages_analyzed INTEGER NOT NULL,
  categories JSONB NOT NULL,
  critical_issues JSONB NOT NULL,
  quick_wins JSONB NOT NULL,
  performance_metrics JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
