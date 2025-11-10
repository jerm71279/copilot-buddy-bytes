
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES 
-- NinjaOne Troubleshooting Tools (10)
(
    'ninjaone_check_device_status',
    'Checks the current operational status of a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to check status for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'check_device_status',
    ARRAY['admin', 'it']
),
(
    'ninjaone_restart_service',
    'Restarts a specified service on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device.", "required": true },
        "serviceName": { "type": "string", "description": "The name of the service to restart.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'restart_service',
    ARRAY['admin', 'it']
),
(
    'ninjaone_check_process_status',
    'Checks the status of a specific process on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device.", "required": true },
        "processName": { "type": "string", "description": "The name of the process to check.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'check_process_status',
    ARRAY['admin', 'it']
),
(
    'ninjaone_get_event_logs',
    'Fetches recent event logs from a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch event logs from.", "required": true },
        "logType": { "type": "string", "description": "The type of log to fetch (e.g., Application, System).", "required": false }
    }'::jsonb,
    'ninjaone-sync',
    'get_event_logs',
    ARRAY['admin', 'it', 'compliance']
),
(
    'ninjaone_run_diagnostic_script',
    'Runs a pre-defined diagnostic script on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to run the script on.", "required": true },
        "scriptId": { "type": "string", "description": "The ID of the diagnostic script to run.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'run_diagnostic_script',
    ARRAY['admin', 'it']
),
(
    'ninjaone_check_disk_space',
    'Checks the available disk space on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to check disk space on.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'check_disk_space',
    ARRAY['admin', 'it']
),
(
    'ninjaone_check_network_connectivity',
    'Performs a network connectivity test from a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to perform the test from.", "required": true },
        "targetHost": { "type": "string", "description": "The target host to test connectivity to.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'check_network_connectivity',
    ARRAY['admin', 'it']
),
(
    'ninjaone_get_installed_drivers',
    'Fetches a list of installed drivers on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch drivers from.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_installed_drivers',
    ARRAY['admin', 'it']
),
(
    'ninjaone_collect_system_info',
    'Collects comprehensive system information from a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to collect system info from.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'collect_system_info',
    ARRAY['admin', 'it']
),
(
    'ninjaone_isolate_device_from_network',
    'Isolates a device from the network in NinjaOne for security incidents.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to isolate.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'isolate_device',
    ARRAY['admin', 'it', 'security']
),
-- Keeper Security Troubleshooting Tools (10)
(
    'keeper_check_user_access',
    'Checks a user''s access permissions to a specific record or folder in Keeper Security.',
    '{
        "userId": { "type": "string", "description": "The ID of the user.", "required": true },
        "resourceId": { "type": "string", "description": "The ID of the record or folder.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'check_user_access',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_reset_master_password',
    'Initiates a master password reset for a user in Keeper Security (requires admin approval).',
    '{
        "userId": { "type": "string", "description": "The ID of the user to reset master password for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'reset_master_password',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_get_record_sharing_info',
    'Fetches sharing information for a specific record in Keeper Security.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to get sharing info for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_record_sharing_info',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_audit_record_access',
    'Audits access attempts for a specific record in Keeper Security.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to audit access for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'audit_record_access',
    ARRAY['admin', 'it', 'security', 'compliance']
),
(
    'keeper_check_breachwatch_status',
    'Checks the BreachWatch status for a user or organization in Keeper Security.',
    '{
        "targetId": { "type": "string", "description": "The ID of the user or organization to check BreachWatch status for.", "required": true },
        "targetType": { "type": "string", "description": "Type of target: user or organization.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'check_breachwatch_status',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_get_user_devices',
    'Fetches a list of devices associated with a user in Keeper Security.',
    '{
        "userId": { "type": "string", "description": "The ID of the user to fetch devices for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_user_devices',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_revoke_device_access',
    'Revokes access for a specific device associated with a user in Keeper Security.',
    '{
        "userId": { "type": "string", "description": "The ID of the user.", "required": true },
        "deviceId": { "type": "string", "description": "The ID of the device to revoke access for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'revoke_device_access',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_get_enterprise_settings',
    'Fetches current enterprise-level security settings in Keeper Security.',
    '{}'::jsonb,
    'keeper-security-sync',
    'get_enterprise_settings',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_check_sso_integration',
    'Checks the status of SSO integration with Keeper Security.',
    '{}'::jsonb,
    'keeper-security-sync',
    'check_sso_integration',
    ARRAY['admin', 'it', 'security']
),
(
    'keeper_get_policy_violations',
    'Fetches a list of policy violations for a user or organization in Keeper Security.',
    '{
        "targetId": { "type": "string", "description": "The ID of the user or organization to check policy violations for.", "required": true },
        "targetType": { "type": "string", "description": "Type of target: user or organization.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_policy_violations',
    ARRAY['admin', 'it', 'security', 'compliance']
);
