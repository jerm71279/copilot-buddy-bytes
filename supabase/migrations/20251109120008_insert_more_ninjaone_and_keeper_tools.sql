
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES 
-- NinjaOne Tools (10 more)
(
    'get_ninjaone_device_software',
    'Fetches a list of installed software for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch software for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_device_software',
    ARRAY['admin', 'it']
),
(
    'install_ninjaone_software',
    'Installs a software package on a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to install software on.", "required": true },
        "softwareId": { "type": "string", "description": "The ID of the software to install.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'install_software',
    ARRAY['admin', 'it']
),
(
    'uninstall_ninjaone_software',
    'Uninstalls a software package from a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to uninstall software from.", "required": true },
        "softwareId": { "type": "string", "description": "The ID of the software to uninstall.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'uninstall_software',
    ARRAY['admin', 'it']
),
(
    'get_ninjaone_device_backups',
    'Fetches the backup history for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch backup history for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_device_backups',
    ARRAY['admin', 'it', 'operations']
),
(
    'start_ninjaone_backup',
    'Starts a backup job for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to start a backup for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'start_backup',
    ARRAY['admin', 'it', 'operations']
),
(
    'get_ninjaone_device_patches',
    'Fetches the patch history for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch patch history for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_device_patches',
    ARRAY['admin', 'it', 'compliance']
),
(
    'approve_ninjaone_patch',
    'Approves a specific patch for installation on a device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device.", "required": true },
        "patchId": { "type": "string", "description": "The ID of the patch to approve.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'approve_patch',
    ARRAY['admin', 'it']
),
(
    'get_ninjaone_device_notes',
    'Fetches the notes for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch notes for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_device_notes',
    ARRAY['admin', 'it']
),
(
    'add_ninjaone_device_note',
    'Adds a note to a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to add a note to.", "required": true },
        "note": { "type": "string", "description": "The content of the note.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'add_device_note',
    ARRAY['admin', 'it']
),
(
    'get_ninjaone_activity_log',
    'Fetches the activity log for a specific device in NinjaOne.',
    '{
        "deviceId": { "type": "string", "description": "The ID of the device to fetch the activity log for.", "required": true }
    }'::jsonb,
    'ninjaone-sync',
    'get_activity_log',
    ARRAY['admin', 'it', 'compliance']
),
-- Keeper Security Tools (10 more)
(
    'share_keeper_record',
    'Shares a Keeper Security record with a user.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to share.", "required": true },
        "userId": { "type": "string", "description": "The ID of the user to share with.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'share_record',
    ARRAY['admin', 'it', 'security']
),
(
    'get_keeper_shared_records',
    'Fetches a list of records shared with the current user.',
    '{}'::jsonb,
    'keeper-security-sync',
    'get_shared_records',
    ARRAY['admin', 'it', 'security']
),
(
    'get_keeper_breachwatch_report',
    'Fetches the BreachWatch report for a specific record.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to get the BreachWatch report for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_breachwatch_report',
    ARRAY['admin', 'it', 'security', 'compliance']
),
(
    'get_keeper_compliance_report',
    'Generates a compliance report from Keeper Security.',
    '{}'::jsonb,
    'keeper-security-sync',
    'get_compliance_report',
    ARRAY['admin', 'it', 'security', 'compliance']
),
(
    'create_keeper_folder',
    'Creates a new folder in a Keeper Security vault.',
    '{
        "vaultId": { "type": "string", "description": "The ID of the vault to create the folder in.", "required": true },
        "folderName": { "type": "string", "description": "The name of the new folder.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'create_folder',
    ARRAY['admin', 'it', 'security']
),
(
    'move_keeper_record_to_folder',
    'Moves a Keeper Security record to a different folder.',
    '{
        "recordId": { "type": "string", "description": "The ID of the record to move.", "required": true },
        "folderId": { "type": "string", "description": "The ID of the destination folder.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'move_record_to_folder',
    ARRAY['admin', 'it', 'security']
),
(
    'get_keeper_user_report',
    'Generates a report on user activity in Keeper Security.',
    '{
        "userId": { "type": "string", "description": "The ID of the user to generate a report for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_user_report',
    ARRAY['admin', 'it', 'security', 'hr']
),
(
    'suspend_keeper_user',
    'Suspends a user''s access to Keeper Security.',
    '{
        "userId": { "type": "string", "description": "The ID of the user to suspend.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'suspend_user',
    ARRAY['admin', 'it', 'security']
),
(
    'unsuspend_keeper_user',
    'Unsuspends a user''s access to Keeper Security.',
    '{
        "userId": { "type": "string", "description": "The ID of the user to unsuspend.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'unsuspend_user',
    ARRAY['admin', 'it', 'security']
),
(
    'get_keeper_team_report',
    'Generates a report on team activity in Keeper Security.',
    '{
        "teamId": { "type": "string", "description": "The ID of the team to generate a report for.", "required": true }
    }'::jsonb,
    'keeper-security-sync',
    'get_team_report',
    ARRAY['admin', 'it', 'security']
);
