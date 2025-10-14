# SOC Dashboard Quick Start Guide

## Accessing SOC Features

All SOC features are accessible from the main SOC Dashboard at `/dashboard/soc`. You need admin privileges to access security operations features.

## Navigation Overview

```
SOC Dashboard (Main Hub)
├── Security Alerts (/security/alerts)
├── Security Incidents (/security/incidents)
├── Threat Intelligence (/security/threat-intel)
├── Response Playbooks (/security/playbooks)
└── SIEM Dashboard (/siem)
```

Every SOC page has a navigation bar at the top for quick switching between features.

## Quick Actions

### 1. View Security Alerts

**Path**: `/security/alerts`

**What you see**:
- Real-time security alerts from all detection systems
- Alert metrics: 24h volume, open alerts, critical alerts
- Alert details including severity, type, and affected systems

**Actions you can take**:
- **Acknowledge**: Mark alert as seen
- **Resolve**: Close alert with resolution notes
- **Escalate**: Convert alert to full incident
- **Mark False Positive**: Dismiss benign alerts

**Typical workflow**:
1. Click on alert to view details
2. Review indicators and confidence score
3. Acknowledge alert (assigns to you)
4. Investigate and either:
   - Resolve if benign/handled
   - Escalate to incident if requires deeper response

### 2. Manage Security Incidents

**Path**: `/security/incidents`

**What you see**:
- Active incidents across all lifecycle phases
- Incident metrics: total, critical, closed
- Incident timeline from detection to closure

**Incident Lifecycle**:
```
New → Investigating → Contained → Eradicated → Recovery → Closed
```

**Actions you can take**:
- **Create Incident**: Manually report security incident
- **Update Status**: Move incident through lifecycle phases
- **Assign**: Assign incident to team members
- **Document**: Add impact assessment, root cause, lessons learned

**Typical workflow**:
1. Incident created (manually or from escalated alert)
2. Status: **Investigating** - gather facts, assess scope
3. Status: **Contained** - stop the spread/active threat
4. Status: **Eradicated** - remove threat completely
5. Status: **Recovery** - restore normal operations
6. Status: **Closed** - document lessons learned

### 3. Monitor Threat Intelligence

**Path**: `/security/threat-intel`

**What you see**:
- Active threat intelligence feeds
- Total threat indicators (IPs, domains, URLs, file hashes)
- Feed sync status and last update times

**Available Feeds**:
- **AlienVault OTX**: Community threat intelligence
- **AbuseIPDB**: IP reputation database  
- **URLhaus**: Malicious URL database
- **ThreatFox**: IOC database from abuse.ch

**Actions you can take**:
- **Sync Feed**: Manually trigger feed update
- **View Indicators**: Browse threat indicators with details
- **Search**: Find specific IOCs (IP addresses, domains, etc.)

**Auto-sync**: Feeds automatically sync hourly (configurable)

### 4. Execute Response Playbooks

**Path**: `/security/playbooks`

**What you see**:
- Defined incident response playbooks
- Playbook execution history and success rates
- Active (running) playbook executions

**Playbook Types**:
- **Incident Response**: Standard incident handling procedures
- **Threat Hunt**: Proactive threat hunting workflows
- **Forensics**: Evidence collection and analysis
- **Containment**: Isolation and containment procedures

**Automation Levels**:
- **Manual**: Step-by-step guidance for analyst
- **Semi-Automated**: Some steps automated, others manual
- **Fully Automated**: Complete automation (runs unattended)

**Actions you can take**:
- **Create Playbook**: Define new response workflow
- **Execute Playbook**: Run playbook for an incident
- **View Executions**: Track playbook run history

### 5. Use SIEM Dashboard

**Path**: `/siem`

**What you see**:
- Unified security event stream from all sources
- Event metrics: total events, alerts, anomalies, events/hour
- Filterable event timeline

**Data Sources**:
- Security Alerts
- Behavioral Events (user/system actions)
- Audit Logs (privileged access)
- Anomaly Detections (ML-detected)

**Actions you can take**:
- **Search**: Full-text search across all events
- **Filter**: By severity, event type, time range
- **Export**: Download events as CSV for compliance
- **Drill Down**: Click event to see full details

**Use Cases**:
- Compliance auditing and reporting
- Threat hunting across multiple data sources
- Incident investigation and evidence gathering
- Security metrics and trend analysis

## Common Workflows

### Workflow 1: Alert → Investigation → Resolution

```
1. Alert appears in /security/alerts
2. Click alert to view details and IOC matches
3. Acknowledge alert (assigns to you)
4. Review enrichment data and confidence score
5. Investigate in SIEM (/siem) for related events
6. Decision:
   - If benign: Mark as "Resolved" or "False Positive"
   - If serious: Escalate to Incident
```

### Workflow 2: Incident Response

```
1. Incident created (from alert or manual)
2. Status: NEW - Initial triage
3. Assign to response team
4. Status: INVESTIGATING
   - Use SIEM to gather evidence
   - Check threat intel for IOC matches
   - Document findings
5. Status: CONTAINED
   - Execute containment playbook
   - Isolate affected systems
6. Status: ERADICATED
   - Remove threat completely
   - Verify with scans
7. Status: RECOVERY
   - Restore normal operations
   - Monitor for re-infection
8. Status: CLOSED
   - Complete post-incident review
   - Document lessons learned
```

### Workflow 3: Threat Hunting

```
1. Go to /security/threat-intel
2. Review recent high-severity indicators
3. Note suspicious IOCs (e.g., newly seen malicious IPs)
4. Go to /siem
5. Search for IOC in event stream
6. If matches found:
   - Create alert manually
   - Document findings
   - Consider executing threat hunt playbook
```

### Workflow 4: Compliance Reporting

```
1. Go to /siem
2. Set time range (e.g., Last 30 Days)
3. Filter by compliance tags if needed
4. Click "Export Events" button
5. CSV downloaded with all events
6. Use for compliance reports (SOC 2, ISO 27001, etc.)
```

## Metrics to Monitor

### Critical Security Metrics (SOC Dashboard)

- **Total Incidents**: Volume of security incidents
- **Critical Alerts**: High-severity alerts requiring immediate attention
- **Active Threats**: Ongoing security threats
- **Compliance Score**: Overall security posture percentage
- **Average Response Time**: Time to contain incidents

### Alert Metrics (Security Alerts page)

- **Alerts (24h)**: Recent alert volume
- **Open Alerts**: Unresolved alerts
- **Critical Open**: High-priority open alerts
- **Avg Resolution Time**: Efficiency metric

### Incident Metrics (Security Incidents page)

- **Active**: Currently open incidents
- **Critical**: High-severity incidents
- **Closed**: Successfully resolved incidents

### Threat Intel Metrics (Threat Intelligence page)

- **Total Indicators**: Size of threat database
- **Active Feeds**: Number of syncing feeds
- **High Confidence IOCs**: Quality indicators (80%+ confidence)

## Tips & Best Practices

### For Security Analysts

1. **Check SOC Dashboard Daily**: Monitor metrics and critical alerts
2. **Triage Alerts Promptly**: Acknowledge and investigate within SLA
3. **Document Everything**: Add notes to alerts and incidents
4. **Use Threat Intel**: Check IOCs against threat feeds before investigating
5. **Follow Playbooks**: Use defined procedures for consistency

### For Incident Responders

1. **Update Incident Status Regularly**: Keep stakeholders informed
2. **Track Time**: Document detection, containment, eradication times
3. **Preserve Evidence**: Use SIEM exports for forensics
4. **Post-Incident Review**: Always complete lessons learned
5. **Share Findings**: Update threat intel with new IOCs discovered

### For SOC Managers

1. **Review Metrics Weekly**: Track trends in alert volume, response times
2. **Tune Alert Rules**: Reduce false positives over time
3. **Update Playbooks**: Refine based on lessons learned
4. **Threat Feed Hygiene**: Ensure feeds stay current and relevant
5. **Team Training**: Regular exercises using playbooks

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Open global search
- Click navigation badges: Quick jump between SOC features

## Getting Help

- **Technical Issues**: Contact platform administrators
- **Questions**: Check comprehensive guide in `SOAR_SIEM_IMPLEMENTATION.md`
- **Feature Requests**: Submit via internal portal
- **Security Emergency**: Follow escalation procedures

## Next Steps

1. **Familiarize yourself** with each SOC feature by clicking through the navigation
2. **Review threat feeds** at `/security/threat-intel` and trigger a sync
3. **Explore SIEM** at `/siem` to see aggregated security events
4. **Check playbooks** at `/security/playbooks` to understand response procedures
5. **Monitor alerts** at `/security/alerts` for any active security issues

---

**Quick Reference Links**:
- SOC Dashboard: `/dashboard/soc`
- Alerts: `/security/alerts`
- Incidents: `/security/incidents`
- Threat Intel: `/security/threat-intel`
- Playbooks: `/security/playbooks`
- SIEM: `/siem`

**Last Updated**: October 14, 2025
