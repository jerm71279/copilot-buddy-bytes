
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES (
    'sync_cipp_tenants',
    'Synchronizes all Microsoft 365 tenants from the CIPP instance into OberaConnect.',
    '{
        "customerId": { "type": "string", "description": "The UUID of the customer whose tenants are being synchronized.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'sync_tenants',
    ARRAY['admin', 'it']
);
