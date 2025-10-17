-- Add missing columns to integration_credentials if they don't exist
DO $$ 
BEGIN
  -- Add is_active if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integration_credentials' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.integration_credentials ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add last_synced_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integration_credentials' 
    AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.integration_credentials ADD COLUMN last_synced_at TIMESTAMPTZ;
  END IF;

  -- Add credential_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integration_credentials' 
    AND column_name = 'credential_name'
  ) THEN
    ALTER TABLE public.integration_credentials ADD COLUMN credential_name TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add metadata if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integration_credentials' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.integration_credentials ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_integration_credentials_customer ON public.integration_credentials(customer_id);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_type ON public.integration_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_sync ON public.integration_credentials(last_synced_at);