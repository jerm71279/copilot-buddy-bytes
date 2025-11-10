
CREATE TABLE public.mcp_tools (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text UNIQUE NOT NULL,
    description text NOT NULL,
    parameters jsonb NOT NULL,
    edge_function text NOT NULL,
    edge_function_action text NOT NULL,
    required_permissions text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.mcp_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.mcp_tools FOR SELECT USING (true);
