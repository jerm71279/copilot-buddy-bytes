-- Create file repositories table for centralized file management
CREATE TABLE IF NOT EXISTS public.file_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  repository_type TEXT NOT NULL CHECK (repository_type IN ('sharepoint_site', 'teams_channel', 'onedrive', 'local_upload')),
  repository_name TEXT NOT NULL,
  repository_url TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create file metadata table
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES file_repositories(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_type TEXT,
  mime_type TEXT,
  storage_path TEXT,
  external_file_id TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT file_name_length CHECK (char_length(file_name) <= 255),
  CONSTRAINT file_path_length CHECK (char_length(file_path) <= 2000)
);

-- Create file sync history table
CREATE TABLE IF NOT EXISTS public.file_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES file_repositories(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  sync_status TEXT NOT NULL DEFAULT 'running' CHECK (sync_status IN ('running', 'completed', 'failed', 'cancelled')),
  files_added INTEGER DEFAULT 0,
  files_updated INTEGER DEFAULT 0,
  files_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT error_message_length CHECK (char_length(error_message) <= 1000)
);

-- Enable RLS
ALTER TABLE public.file_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_repositories
CREATE POLICY "Users can view their customer's repositories"
  ON public.file_repositories FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage repositories"
  ON public.file_repositories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'Super Admin')
    )
  );

-- RLS Policies for file_metadata
CREATE POLICY "Users can view their customer's files"
  ON public.file_metadata FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    ) AND is_deleted = false
  );

CREATE POLICY "Users can upload files"
  ON public.file_metadata FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all files"
  ON public.file_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'Super Admin')
    )
  );

-- RLS Policies for file_sync_history
CREATE POLICY "Users can view their customer's sync history"
  ON public.file_sync_history FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage sync history"
  ON public.file_sync_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('Admin', 'Super Admin')
    )
  );

-- Indexes for performance
CREATE INDEX idx_file_repositories_customer ON public.file_repositories(customer_id);
CREATE INDEX idx_file_repositories_type ON public.file_repositories(repository_type);

CREATE INDEX idx_file_metadata_customer ON public.file_metadata(customer_id);
CREATE INDEX idx_file_metadata_repository ON public.file_metadata(repository_id);
CREATE INDEX idx_file_metadata_name ON public.file_metadata(file_name);
CREATE INDEX idx_file_metadata_tags ON public.file_metadata USING GIN(tags);
CREATE INDEX idx_file_metadata_search ON public.file_metadata USING GIN(to_tsvector('english', file_name || ' ' || COALESCE(description, '')));

CREATE INDEX idx_file_sync_history_customer ON public.file_sync_history(customer_id);
CREATE INDEX idx_file_sync_history_repository ON public.file_sync_history(repository_id);

-- Triggers for updated_at
CREATE TRIGGER update_file_repositories_updated_at
  BEFORE UPDATE ON public.file_repositories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_metadata_updated_at
  BEFORE UPDATE ON public.file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();