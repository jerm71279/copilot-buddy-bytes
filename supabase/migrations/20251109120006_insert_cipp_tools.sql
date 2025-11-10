
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES 
(
    'get_cipp_tenant_users',
    'Fetches a list of users for a specific Microsoft 365 tenant from CIPP.',
    '{
        "tenantId": { "type": "string", "description": "The UUID of the tenant to fetch users from.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'get_tenant_users',
    ARRAY['admin', 'it']
),
(
    'get_cipp_tenant_licenses',
    'Fetches a list of licenses for a specific Microsoft 365 tenant from CIPP.',
    '{
        "tenantId": { "type": "string", "description": "The UUID of the tenant to fetch licenses from.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'get_tenant_licenses',
    ARRAY['admin', 'it', 'finance']
),
(
    'remove_cipp_user_license',
    'Removes a license from a user in a specific Microsoft 365 tenant via CIPP.',
    '{
        "tenantId": { "type": "string", "description": "The UUID of the tenant.", "required": true },
        "userId": { "type": "string", "description": "The UUID of the user to remove the license from.", "required": true },
        "licenseId": { "type": "string", "description": "The ID of the license to remove.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'remove_user_license',
    ARRAY['admin', 'it']
),
(
    'reset_cipp_user_password',
    'Resets the password for a user in a specific Microsoft 365 tenant via CIPP.',
    '{
        "tenantId": { "type": "string", "description": "The UUID of the tenant.", "required": true },
        "userId": { "type": "string", "description": "The UUID of the user whose password to reset.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'reset_user_password',
    ARRAY['admin', 'it']
),
(
    'get_cipp_security_recommendations',
    'Fetches security recommendations for a specific Microsoft 365 tenant from CIPP.',
    '{
        "tenantId": { "type": "string", "description": "The UUID of the tenant to get recommendations for.", "required": true }
    }'::jsonb,
    'cipp-sync',
    'get_security_recommendations',
    ARRAY['admin', 'it', 'compliance']
);
