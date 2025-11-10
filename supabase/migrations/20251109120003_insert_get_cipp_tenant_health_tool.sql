
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES (
    'get_cipp_tenant_health',
    'Fetches the security score and health metrics for a specific Microsoft 365 tenant from the CIPP instance.',
    '{
        "tenantId": { "type": "string", "description": "The UUID of the tenant to get the health score for.", "required": true },
        "customerId": { "type": "string", "description": "The UUID of the customer who owns the tenant.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'get_tenant_health',
    ARRAY['admin', 'it', 'compliance']
);
