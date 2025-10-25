-- Data Lake & Data Mesh Architecture
-- Bronze Layer (Raw Data Ingestion)
CREATE TABLE IF NOT EXISTS data_lake_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL, -- 'hr', 'it', 'finance', 'sales', 'compliance', 'external'
  source_table TEXT NOT NULL,
  source_id TEXT,
  raw_data JSONB NOT NULL,
  ingestion_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ingestion_method TEXT DEFAULT 'batch', -- 'batch', 'stream', 'api'
  data_size_bytes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Silver Layer (Cleaned & Transformed Data)
CREATE TABLE IF NOT EXISTS data_lake_silver (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  raw_data_id UUID REFERENCES data_lake_raw(id) ON DELETE SET NULL,
  domain TEXT NOT NULL, -- 'hr', 'it', 'finance', 'sales', 'compliance'
  entity_type TEXT NOT NULL, -- 'employee', 'ticket', 'invoice', 'lead', 'control'
  entity_id UUID,
  transformed_data JSONB NOT NULL,
  transformation_rules TEXT[],
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'failed'
  validation_errors JSONB,
  transformed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gold Layer (Business-Ready Analytics)
CREATE TABLE IF NOT EXISTS data_lake_gold (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  silver_data_ids UUID[],
  data_product_id UUID,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  dimensions JSONB DEFAULT '{}'::jsonb, -- Time, department, category, etc.
  aggregation_type TEXT, -- 'sum', 'avg', 'count', 'min', 'max'
  calculation_logic TEXT,
  business_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_to TIMESTAMPTZ
);

-- Data Products (Domain-Specific Data Assets)
CREATE TABLE IF NOT EXISTS data_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  domain TEXT NOT NULL, -- 'hr', 'it', 'finance', 'sales', 'compliance'
  description TEXT,
  owner_user_id UUID REFERENCES auth.users(id),
  owner_department TEXT,
  data_sources TEXT[], -- Source tables/systems
  update_frequency TEXT DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
  schema_definition JSONB,
  quality_sla INTEGER DEFAULT 95, -- Minimum quality score %
  access_policy TEXT DEFAULT 'private', -- 'private', 'department', 'organization', 'public'
  consumers TEXT[], -- Which departments/systems use this
  lineage JSONB, -- Upstream/downstream dependencies
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data Catalog (Metadata & Discovery)
CREATE TABLE IF NOT EXISTS data_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  catalog_type TEXT NOT NULL, -- 'table', 'view', 'metric', 'report', 'dataset'
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  domain TEXT,
  tags TEXT[],
  data_classification TEXT, -- 'public', 'internal', 'confidential', 'restricted'
  contains_pii BOOLEAN DEFAULT false,
  retention_policy TEXT,
  source_location TEXT, -- Bronze/Silver/Gold layer reference
  schema_definition JSONB,
  sample_data JSONB,
  data_lineage JSONB, -- Visual lineage graph
  usage_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data Quality Rules
CREATE TABLE IF NOT EXISTS data_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'completeness', 'accuracy', 'consistency', 'timeliness', 'validity'
  target_table TEXT,
  target_column TEXT,
  rule_logic JSONB NOT NULL,
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  threshold INTEGER, -- Minimum pass rate %
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Quality Metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES data_quality_rules(id) ON DELETE CASCADE,
  data_product_id UUID REFERENCES data_products(id) ON DELETE CASCADE,
  check_timestamp TIMESTAMPTZ DEFAULT now(),
  records_checked INTEGER,
  records_passed INTEGER,
  records_failed INTEGER,
  pass_rate INTEGER, -- Percentage
  quality_score INTEGER,
  issues_found JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ETL Pipeline Runs
CREATE TABLE IF NOT EXISTS etl_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  pipeline_name TEXT NOT NULL,
  pipeline_type TEXT, -- 'ingestion', 'transformation', 'aggregation', 'export'
  source_system TEXT,
  target_layer TEXT, -- 'bronze', 'silver', 'gold'
  status TEXT DEFAULT 'running', -- 'pending', 'running', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  error_message TEXT,
  execution_logs JSONB,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Lineage Tracking
CREATE TABLE IF NOT EXISTS data_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  target_entity_type TEXT NOT NULL,
  target_entity_id UUID NOT NULL,
  transformation_type TEXT, -- 'copy', 'filter', 'aggregate', 'join', 'enrich'
  transformation_logic TEXT,
  pipeline_run_id UUID REFERENCES etl_pipeline_runs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics Queries (Cross-Domain)
CREATE TABLE IF NOT EXISTS analytics_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  query_name TEXT NOT NULL,
  query_description TEXT,
  query_sql TEXT NOT NULL,
  data_products_used UUID[],
  domains TEXT[],
  output_schema JSONB,
  is_scheduled BOOLEAN DEFAULT false,
  schedule_cron TEXT,
  last_run TIMESTAMPTZ,
  avg_execution_time_ms INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_raw_customer_source ON data_lake_raw(customer_id, source_system);
CREATE INDEX IF NOT EXISTS idx_raw_timestamp ON data_lake_raw(ingestion_timestamp);
CREATE INDEX IF NOT EXISTS idx_silver_customer_domain ON data_lake_silver(customer_id, domain);
CREATE INDEX IF NOT EXISTS idx_silver_entity ON data_lake_silver(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gold_customer_metric ON data_lake_gold(customer_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_gold_valid ON data_lake_gold(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_products_customer_domain ON data_products(customer_id, domain);
CREATE INDEX IF NOT EXISTS idx_catalog_customer_type ON data_catalog(customer_id, catalog_type);
CREATE INDEX IF NOT EXISTS idx_catalog_tags ON data_catalog USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_product ON data_quality_metrics(data_product_id, check_timestamp);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_customer ON etl_pipeline_runs(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lineage_source ON data_lineage(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_lineage_target ON data_lineage(target_entity_type, target_entity_id);

-- RLS Policies
ALTER TABLE data_lake_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lake_silver ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lake_gold ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_queries ENABLE ROW LEVEL SECURITY;

-- Raw data access
CREATE POLICY "Users can view raw data for their customer"
  ON data_lake_raw FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert raw data for their customer"
  ON data_lake_raw FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Silver data access
CREATE POLICY "Users can view silver data for their customer"
  ON data_lake_silver FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert silver data for their customer"
  ON data_lake_silver FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Gold data access
CREATE POLICY "Users can view gold data for their customer"
  ON data_lake_gold FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert gold data for their customer"
  ON data_lake_gold FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Data products access
CREATE POLICY "Users can view data products for their customer"
  ON data_products FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create data products for their customer"
  ON data_products FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own data products"
  ON data_products FOR UPDATE
  USING (
    customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND (owner_user_id = auth.uid() OR auth.uid() IN (
      SELECT ur.user_id FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name IN ('Super Admin', 'Admin')
    ))
  );

-- Data catalog access
CREATE POLICY "Users can view catalog for their customer"
  ON data_catalog FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage catalog for their customer"
  ON data_catalog FOR ALL
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Quality rules access
CREATE POLICY "Users can view quality rules for their customer"
  ON data_quality_rules FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage quality rules"
  ON data_quality_rules FOR ALL
  USING (
    customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND auth.uid() IN (
      SELECT ur.user_id FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE r.name IN ('Super Admin', 'Admin')
    )
  );

-- Quality metrics access
CREATE POLICY "Users can view quality metrics for their customer"
  ON data_quality_metrics FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert quality metrics"
  ON data_quality_metrics FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Pipeline runs access
CREATE POLICY "Users can view pipeline runs for their customer"
  ON etl_pipeline_runs FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create pipeline runs for their customer"
  ON etl_pipeline_runs FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their pipeline runs"
  ON etl_pipeline_runs FOR UPDATE
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Lineage access
CREATE POLICY "Users can view lineage for their customer"
  ON data_lineage FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert lineage"
  ON data_lineage FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

-- Analytics queries access
CREATE POLICY "Users can view analytics queries for their customer"
  ON analytics_queries FOR SELECT
  USING (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create analytics queries"
  ON analytics_queries FOR INSERT
  WITH CHECK (customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own queries"
  ON analytics_queries FOR UPDATE
  USING (
    customer_id = (SELECT customer_id FROM user_profiles WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- Triggers
CREATE OR REPLACE FUNCTION update_data_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_data_products_timestamp
  BEFORE UPDATE ON data_products
  FOR EACH ROW
  EXECUTE FUNCTION update_data_product_timestamp();

CREATE TRIGGER update_catalog_timestamp
  BEFORE UPDATE ON data_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_queries_timestamp
  BEFORE UPDATE ON analytics_queries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();