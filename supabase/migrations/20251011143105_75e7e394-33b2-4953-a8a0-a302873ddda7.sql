-- Fix Security Definer Views
-- Convert all public views to use SECURITY INVOKER to respect RLS policies

-- This ensures views execute with the privileges of the querying user,
-- not the view creator, preventing unintentional privilege escalation

ALTER VIEW public.change_request_dashboard SET (security_invoker = on);
ALTER VIEW public.ci_overview SET (security_invoker = on);
ALTER VIEW public.inventory_reorder_alerts SET (security_invoker = on);
ALTER VIEW public.soc_engineer_alert_rules SET (security_invoker = on);
ALTER VIEW public.soc_engineer_device_metrics SET (security_invoker = on);
ALTER VIEW public.soc_engineer_network_alerts SET (security_invoker = on);
ALTER VIEW public.soc_engineer_network_devices SET (security_invoker = on);
ALTER VIEW public.soc_engineer_network_monitoring SET (security_invoker = on);