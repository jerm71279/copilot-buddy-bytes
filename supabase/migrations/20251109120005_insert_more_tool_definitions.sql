
INSERT INTO public.mcp_tools (name, description, parameters, edge_function, edge_function_action, required_permissions)
VALUES 
(
    'poll_customer_devices',
    'Polls all network devices for a specific customer for metrics via SNMP.',
    '{
        "customerId": { "type": "string", "description": "The UUID of the customer to poll devices for.", "required": true },
        "metrics": { "type": "array", "items": { "type": "string" }, "description": "Specific metrics to poll.", "required": false }
    }'::jsonb,
    'device-poller',
    'poll_customer',
    ARRAY['admin', 'it']
),
(
    'get_all_revio_data',
    'Fetches all customer billing and revenue data from Revio.',
    '{}'::jsonb,
    'revio-data',
    'all',
    ARRAY['admin', 'finance', 'sales']
),
(
    'get_revio_customers_by_ticket',
    'Fetches Revio customers grouped by ticket status.',
    '{}'::jsonb,
    'revio-data',
    'customers_by_ticket',
    ARRAY['admin', 'sales', 'operations']
),
(
    'get_revio_customers_by_sla',
    'Fetches Revio customers grouped by SLA tier.',
    '{}'::jsonb,
    'revio-data',
    'customers_by_sla',
    ARRAY['admin', 'sales', 'compliance']
),
(
    'get_revio_customers_by_revenue',
    'Fetches Revio customers grouped by revenue tier.',
    '{}'::jsonb,
    'revio-data',
    'customers_by_revenue',
    ARRAY['admin', 'finance', 'sales', 'executive']
),
(
    'get_revio_subscriptions',
    'Fetches subscription statistics from Revio.',
    '{}'::jsonb,
    'revio-data',
    'subscriptions',
    ARRAY['admin', 'finance', 'sales']
),
(
    'get_revio_recent_interactions',
    'Fetches recent customer interactions from Revio.',
    '{}'::jsonb,
    'revio-data',
    'recent_interactions',
    ARRAY['admin', 'sales']
);
