
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES (
    'poll_network_device',
    'Polls a network device for metrics via SNMP and generates alerts based on thresholds.',
    '{
        "device_id": { "type": "string", "description": "The UUID of the device to poll.", "required": true },
        "metrics": { "type": "array", "items": { "type": "string" }, "description": "Specific metrics to poll (e.g., ['cpu', 'memory', 'interfaces']).", "required": false }
    }'::jsonb,
    'device-poller',
    'poll_device',
    ARRAY['admin', 'it']
);
