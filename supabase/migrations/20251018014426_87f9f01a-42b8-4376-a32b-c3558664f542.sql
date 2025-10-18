-- Add api_key_instructions column to documentation_vendors table
ALTER TABLE documentation_vendors ADD COLUMN IF NOT EXISTS api_key_instructions JSONB DEFAULT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN documentation_vendors.api_key_instructions IS 'AI-extracted instructions for obtaining API keys from vendor, stored as structured JSON';