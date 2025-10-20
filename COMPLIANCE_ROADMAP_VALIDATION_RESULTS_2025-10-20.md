# Compliance Roadmap Validation Results (2025-10-20)

Summary
- Issue: RPC initialize_compliance_roadmap returned 500 with message "null character not permitted".
- Scope affected: Creating roadmap stages for a selected framework and customer.

Observed Evidence
- Network request failed: POST /rest/v1/rpc/initialize_compliance_roadmap with valid UUIDs.
- Postgres logs contained: "null character not permitted".

Root Cause (Likely)
- Control characters (including null bytes) present in one or more text fields during stage inserts.
- Needed server-side sanitization to guarantee clean text regardless of client input.

Remediation Applied
1) Database hardening
- Added function public.strip_control_chars(text) to remove control characters.
- Added trigger public.sanitize_compliance_roadmap_stage() on compliance_roadmap_stages (BEFORE INSERT/UPDATE) to strip control chars and cap lengths (name: 200, description: 2000).
- Cleaned existing rows in compliance_roadmap_stages via UPDATE using the new function.

2) Frontend modularity
- Refactored useComplianceRoadmap hook to use centralized getUserCustomerId helper, reducing duplication.

Validation
- Target endpoint observed failing in logs and network traces; sanitization now ensures new inserts cannot contain null bytes in stage_name/stage_description.
- Next manual step: Click "Initialize Roadmap" after selecting a framework to confirm end-to-end success.

Next Steps (if needed)
- If any residual errors persist, extend the sanitization trigger pattern to milestones and frameworks tables.
- Add defensive client-side sanitization using src/lib/sanitization.ts for any free-text user inputs before writes.

Changelog
- 2025-10-20: Added DB sanitization trigger for roadmap stages; refactored hook to use shared helper; documented results here.
