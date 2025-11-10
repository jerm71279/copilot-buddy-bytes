
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES 
-- NinjaOne Tools
(
    'get_ninjaone_devices',
    'Fetches a list of all devices from NinjaOne for a customer.',
    '{
        "customerId": { "type": "string", "description": "The UUID of the customer to fetch devices for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_devices',
    ARRAY['admin', 'it']
),
(
    'get_ninjaone_device_details',
    'Fetches detailed information for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch details for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_device_details',
    ARRAY['admin', 'it']
),
(
    'run_ninjaone_script',
    'Runs a specified script on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to run the script on.", "required": true },
        "scriptId": { "type": "string", "description": "The ID of the script to run.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'run_script',
    ARRAY['admin', 'it']
),
(
    'reboot_ninjaone_device',
    'Reboots a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to reboot.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'reboot_device',
    ARRAY['admin', 'it']
),
(
    'get_ninjaone_alerts',
    'Fetches a list of active alerts from NinjaOne.',
    '{
        "customerId": { "type": "string", "description": "The UUID of the customer to fetch alerts for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_alerts',
    ARRAY['admin', 'it', 'operations']
),
-- Keeper Security Tools
(
    'get_keeper_records',
    'Fetches a list of records from a Keeper Security vault.',
    '{
        "vaultId": { "type": "string", "description": "The ID of the vault to fetch records from.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_records',
    ARRAY['admin', 'it', 'security']
),
(
    'create_keeper_record',
    'Creates a new record in a Keeper Security vault.',
    '{
        "vaultId": { "type": "string", "description": "The ID of the vault to create the record in.", "required": true },
        "recordData": { "type": "object", "description": "The data for the new record.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'create_record',
    ARRAY['admin', 'it', 'security']
),
(
    'get_keeper_password_history',
    'Fetches the password history for a specific record in Keeper Security.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to get password history for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_password_history',
    ARRAY['admin', 'it', 'security', 'compliance']
),
(
    'rotate_keeper_password',
    'Rotates the password for a specific record in Keeper Security.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to rotate the password for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'rotate_password',
    ARRAY['admin', 'it', 'security']
),
(
    'get_keeper_security_audit_log',
    'Fetches the security audit log from Keeper Security.',
    '{
        "days": { "type": "number", "description": "The number of days of audit logs to fetch.", "required": false }
    }'::jsonb,
    'keeper-security-sync',
    'get_audit_log',
    ARRAY['admin', 'it', 'security', 'compliance']
);
