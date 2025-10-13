# Consolidated Compliance & Audit Documentation

This file consolidates all compliance, security audit, and assessment documentation.

## 🆕 Compliance Hierarchical Model

**Model Type:** MSP-to-Client Cascade (Similar to NinjaOne Policy Cascade)

The OberaConnect platform implements a **hierarchical compliance model** where Obera acts as the MSP and compliance frameworks automatically cascade to all client organizations. Each client can then activate or deactivate specific frameworks based on their industry needs.

### Key Features:
- **Automatic Framework Cascade** - MSP-level frameworks propagate to all clients
- **Per-Framework Control** - Clients can deactivate frameworks they don't need (e.g., construction company disables HIPAA)
- **Inheritance Tracking** - System tracks inherited vs. custom frameworks
- **Centralized Updates** - Framework changes at MSP level cascade automatically

### Example Use Cases:
1. **Construction Company** - Keeps ISO 27001/SOC 2 active, deactivates HIPAA/PCI DSS
2. **Healthcare Provider** - Activates all frameworks including HIPAA
3. **Financial Services** - Activates PCI DSS and ISO 27001
4. **General Business** - Activates only SOC 2 for basic compliance

See **COMPLIANCE_HIERARCHICAL_MODEL.md** for complete architecture documentation.

---

## Included Documents:
- COMPLIANCE_HIERARCHICAL_MODEL.md (NEW - Hierarchical MSP Model)
- CISSP_SECURITY_ASSESSMENT.md
- SECURITY_AUDIT_REPORT.md
- SECURITY_REPORT.md
- SECURITY_ROLLOUT_OPERATIONS_PLAN.md

---

## Reference Documents
See individual files for detailed compliance and audit documentation:
- **Hierarchical Model:** See COMPLIANCE_HIERARCHICAL_MODEL.md
- CISSP Assessment: See CISSP_SECURITY_ASSESSMENT.md
- Security Audits: See SECURITY_AUDIT_REPORT.md, SECURITY_REPORT.md
- Security Rollout: See SECURITY_ROLLOUT_OPERATIONS_PLAN.md
