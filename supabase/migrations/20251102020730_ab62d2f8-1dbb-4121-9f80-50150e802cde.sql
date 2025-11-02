-- Add tags and metadata columns to mcp_servers
ALTER TABLE mcp_servers 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tags ON mcp_servers USING GIN(tags);

-- Add server grouping/category support
CREATE TABLE IF NOT EXISTS mcp_server_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, group_name)
);

-- Enable RLS on server groups
ALTER TABLE mcp_server_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for server groups
CREATE POLICY "Users can view their own server groups"
  ON mcp_server_groups FOR SELECT
  USING (auth.uid()::text = customer_id::text);

CREATE POLICY "Users can create their own server groups"
  ON mcp_server_groups FOR INSERT
  WITH CHECK (auth.uid()::text = customer_id::text);

CREATE POLICY "Users can update their own server groups"
  ON mcp_server_groups FOR UPDATE
  USING (auth.uid()::text = customer_id::text);

CREATE POLICY "Users can delete their own server groups"
  ON mcp_server_groups FOR DELETE
  USING (auth.uid()::text = customer_id::text);

-- Add group_id to mcp_servers
ALTER TABLE mcp_servers 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES mcp_server_groups(id) ON DELETE SET NULL;

-- Update trigger for server groups
CREATE TRIGGER update_mcp_server_groups_updated_at
  BEFORE UPDATE ON mcp_server_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();