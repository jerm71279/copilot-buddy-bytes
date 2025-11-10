
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES (
    'apply_cipp_baseline',
    'Applies a specified security baseline to one or more Microsoft 365 tenants via the CIPP integration.',
    '{
        "baselineId": { "type": "string", "description": "The UUID of the security baseline to apply.", "required": true },
        "targetTenantIds": { "type": "array", "items": { "type": "string" }, "description": "An array of tenant IDs to apply the baseline to.", "required": true },
        "customerId": { "type": "string", "description": "The UUID of the customer whose tenants are being modified.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'apply_baseline',
    ARRAY['admin', 'cipp_admin']
);
