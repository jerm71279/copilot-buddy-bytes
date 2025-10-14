# SOAR + SIEM Implementation Guide

## Overview

OberaConnect now includes a complete **Security Orchestration, Automation, and Response (SOAR)** platform integrated with a **Security Information and Event Management (SIEM)** system. This provides enterprise-grade security operations capabilities with AI-powered threat detection and automated incident response.

## Architecture

### Core Components

1. **SOC Dashboard** (`/dashboard/soc`)
   - Central security operations hub
   - Real-time security metrics and KPIs
   - Quick access to all security features

2. **Security Alerts** (`/security/alerts`)
   - Real-time alert monitoring and triage
   - AI-powered alert enrichment via `alert-processor` edge function
   - Automatic IOC (Indicator of Compromise) matching
   - Alert escalation to incidents

3. **Security Incidents** (`/security/incidents`)
   - Full incident lifecycle management (Detection → Containment → Eradication → Recovery → Closure)
   - Incident tracking with NIST phases
   - Assignment and collaboration features
   - Related alerts tracking

4. **Threat Intelligence** (`/security/threat-intel`)
   - Threat feed management (AlienVault, AbuseIPDB, URLhaus, ThreatFox)
   - Automated feed synchronization via `threat-intel-sync` edge function
   - IOC indicator database
   - Confidence scoring and severity classification

5. **Response Playbooks** (`/security/playbooks`)
   - Automated response workflow definitions
   - Manual, semi-automated, and fully automated execution
   - Step-by-step incident response procedures
   - Execution tracking and metrics

6. **SIEM Dashboard** (`/siem`)
   - Unified security event monitoring
   - Multi-source log aggregation
   - Advanced filtering and search
   - Compliance reporting and export
   - Event correlation capabilities

## Database Schema

### Security Tables

#### `security_alerts`
```sql
- id (uuid, primary key)
- customer_id (uuid)
- alert_id (text, unique identifier)
- alert_name (text)
- alert_type (text): unauthorized_access, malware, data_exfiltration, etc.
- severity (text): critical, high, medium, low, info
- status (text): new, acknowledged, investigating, resolved, false_positive, escalated
- source_system (text)
- detection_method (text)
- affected_entities (jsonb)
- indicators (jsonb[]): IOCs found in alert
- confidence_score (numeric): 0-100
- raw_log (jsonb)
- alert_details (jsonb)
- assigned_to (uuid)
- acknowledged_at (timestamp)
- resolved_at (timestamp)
- resolution_notes (text)
- incident_id (uuid): linked incident if escalated
- created_at (timestamp)
```

#### `security_incidents`
```sql
- id (uuid, primary key)
- customer_id (uuid)
- incident_number (text, auto-generated INC-YYYYMMDD-XXXX)
- incident_name (text)
- incident_type (text)
- severity (text): critical, high, medium, low
- status (text): new, investigating, contained, eradicated, recovery, closed
- priority (text): urgent, high, normal, low
- description (text)
- initial_detection_time (timestamp)
- containment_time (timestamp)
- eradication_time (timestamp)
- recovery_time (timestamp)
- closure_time (timestamp)
- reported_by (uuid)
- assigned_to (uuid)
- response_team (uuid[])
- related_alerts (uuid[])
- affected_systems (text[])
- impact_assessment (text)
- root_cause (text)
- lessons_learned (text)
- remediation_actions (jsonb)
- estimated_cost (numeric)
- created_at (timestamp)
```

#### `threat_intel_feeds`
```sql
- id (uuid, primary key)
- customer_id (uuid)
- feed_name (text)
- feed_type (text): ip_reputation, domain_reputation, file_hash, url, etc.
- feed_source (text): alienvault, abuseipdb, urlhaus, threatfox, custom
- feed_url (text)
- api_key_required (boolean)
- update_frequency (text): hourly, daily, weekly
- last_updated (timestamp)
- next_update (timestamp)
- sync_status (text): active, paused, error
- indicator_count (integer)
- is_active (boolean)
- config (jsonb)
- created_at (timestamp)
```

#### `threat_intel_indicators`
```sql
- id (uuid, primary key)
- customer_id (uuid)
- feed_id (uuid)
- indicator_type (text): ip, domain, url, file_hash, email
- indicator_value (text, indexed)
- description (text)
- severity (text)
- confidence_score (numeric)
- first_seen (timestamp)
- last_seen (timestamp)
- matched_count (integer): how many times matched in alerts
- is_active (boolean)
- tags (text[])
- raw_data (jsonb)
- created_at (timestamp)
```

#### `response_playbooks`
```sql
- id (uuid, primary key)
- customer_id (uuid)
- playbook_name (text)
- playbook_type (text): incident_response, threat_hunt, forensics, containment
- description (text)
- automation_level (text): manual, semi_automated, fully_automated
- trigger_conditions (jsonb)
- steps (jsonb): array of step definitions
- estimated_duration_minutes (integer)
- success_rate (numeric)
- execution_count (integer)
- last_executed (timestamp)
- is_active (boolean)
- created_by (uuid)
- created_at (timestamp)
```

#### `playbook_executions`
```sql
- id (uuid, primary key)
- customer_id (uuid)
- playbook_id (uuid)
- incident_id (uuid)
- execution_status (text): pending, running, completed, failed, cancelled
- started_at (timestamp)
- completed_at (timestamp)
- triggered_by (uuid)
- current_step (integer)
- total_steps (integer)
- step_results (jsonb)
- error_message (text)
- was_successful (boolean)
- created_at (timestamp)
```

#### `soc_metrics_dashboard` (view)
Aggregated view providing:
- alerts_24h, alerts_7d
- open_alerts, critical_open
- avg_acknowledgment_time_minutes
- avg_resolution_time_minutes
- active_incidents, critical_incidents
- active_threat_indicators
- feeds_synced_24h
- running_playbooks

## Edge Functions

### 1. `alert-processor`
**Purpose**: Enriches security alerts with threat intelligence and automated analysis

**Flow**:
```
Incoming Alert → Extract IOCs → Match Against Threat Intel → 
Calculate Confidence Score → Auto-escalate if critical → Return enriched alert
```

**Input**:
```json
{
  "alert_id": "ALT-20251014-0001",
  "alert_name": "Suspicious Login Attempt",
  "alert_type": "unauthorized_access",
  "severity": "high",
  "source_system": "authentication_logs",
  "raw_log": { /* raw event data */ }
}
```

**Processing**:
- Extracts IP addresses, domains, file hashes, URLs from raw logs
- Queries `threat_intel_indicators` table for matches
- Calculates confidence score based on:
  - Number of IOC matches
  - Severity of matched indicators
  - Historical match success rate
- Auto-escalates to incident if confidence > 85% and severity is critical

**Output**:
```json
{
  "alert_id": "ALT-20251014-0001",
  "enriched": true,
  "indicators": [
    {
      "type": "ip",
      "value": "192.168.1.100",
      "matched": true,
      "threat_feed": "abuseipdb",
      "severity": "high"
    }
  ],
  "confidence_score": 92,
  "auto_escalated": true,
  "incident_id": "a1b2c3d4-..."
}
```

**Invocation**:
```typescript
const { data, error } = await supabase.functions.invoke('alert-processor', {
  body: alertData
});
```

### 2. `threat-intel-sync`
**Purpose**: Synchronizes threat intelligence feeds from external sources

**Supported Sources**:
- **AlienVault OTX**: Community threat intelligence
- **AbuseIPDB**: IP reputation database
- **URLhaus**: Malicious URL database
- **ThreatFox**: IOC database from abuse.ch

**Flow**:
```
Trigger → Fetch Feed Config → Call Source API → 
Parse Indicators → Deduplicate → Upsert to DB → Update Metadata
```

**Input**:
```json
{
  "feedId": "uuid-of-threat-feed"
}
```

**Processing per Source**:

**AlienVault OTX**:
```typescript
GET https://otx.alienvault.com/api/v1/pulses/subscribed
Headers: X-OTX-API-KEY: {api_key}
```
Extracts: IPv4, IPv6, domain, URL, file hashes

**AbuseIPDB**:
```typescript
GET https://api.abuseipdb.com/api/v2/blacklist
Headers: Key: {api_key}
Query: confidenceMinimum=90&limit=10000
```
Extracts: IP addresses with confidence scores

**URLhaus**:
```typescript
GET https://urlhaus.abuse.ch/downloads/csv_recent/
```
Parses CSV format for malicious URLs and associated malware

**ThreatFox**:
```typescript
POST https://threatfox-api.abuse.ch/api/v1/
Body: {"query": "get_iocs", "days": 1}
```
Extracts: IPs, domains, URLs with IOC tags

**Output**:
```json
{
  "feed_name": "AlienVault OTX",
  "indicators_synced": 1247,
  "indicators_updated": 89,
  "indicators_new": 1158,
  "sync_duration_ms": 3421,
  "last_updated": "2025-10-14T12:00:00Z"
}
```

**Scheduling**:
Set up automated syncs using Supabase cron:
```sql
SELECT cron.schedule(
  'sync-threat-feeds-hourly',
  '0 * * * *', -- every hour
  $$ SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/threat-intel-sync',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb,
    body := '{"feedId": "[feed-uuid]"}'::jsonb
  ) $$
);
```

### 3. `soc-threat-analysis` (existing)
**Purpose**: AI-powered threat analysis using Lovable AI

**Flow**:
```
Security Event → Extract Context → Generate AI Prompt → 
Call Lovable AI (gemini-2.5-flash) → Parse Response → Return Analysis
```

**Input**:
```json
{
  "event_type": "anomaly_detection",
  "event_data": {
    "user_id": "uuid",
    "anomaly_type": "unusual_login_time",
    "risk_score": 87,
    "context": { /* event details */ }
  }
}
```

**AI Analysis**:
- Assesses threat severity
- Identifies potential attack vectors
- Suggests remediation steps
- Provides confidence scoring

**Output**:
```json
{
  "threat_level": "high",
  "attack_classification": "credential_compromise",
  "confidence": 0.89,
  "recommended_actions": [
    "Force password reset for affected user",
    "Review recent access logs",
    "Enable MFA if not already active"
  ],
  "potential_indicators": [
    "Login from new geographic location",
    "Access during off-hours",
    "Multiple failed login attempts preceding success"
  ]
}
```

## SIEM Data Aggregation

The SIEM Dashboard aggregates security events from multiple sources:

### Data Sources

1. **`security_alerts`** → Security alerts from detection systems
2. **`behavioral_events`** → User and system behavioral telemetry
3. **`audit_logs`** → Privileged access and system changes
4. **`anomaly_detections`** → ML-detected anomalies

### Query Strategy

```typescript
const [alerts, behavioral, audit, anomalies] = await Promise.all([
  supabase.from('security_alerts').select('*').gte('created_at', since),
  supabase.from('behavioral_events').select('*').gte('created_at', since),
  supabase.from('audit_logs').select('*').gte('created_at', since),
  supabase.from('anomaly_detections').select('*').gte('created_at', since),
]);
```

### Event Normalization

All events normalized to common schema:
```typescript
interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: 'security_alert' | 'behavioral' | 'audit' | 'anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string; // originating system
  user_id?: string;
  ip_address?: string;
  description: string;
  raw_data: any; // original event data
}
```

### Filtering & Search

- **Time-based**: 24h, 7d, 30d windows
- **Severity**: critical, high, medium, low, info
- **Event Type**: security_alert, behavioral, audit, anomaly
- **Full-text search**: across descriptions and metadata

### Export Capabilities

CSV export with compliance-friendly format:
```csv
Timestamp,Type,Severity,Source,Description
2025-10-14T12:00:00Z,security_alert,critical,IDS,"Potential SQL injection detected"
```

## Security & Access Control

### Row-Level Security (RLS)

All SOC tables implement RLS:
```sql
-- Example for security_alerts
CREATE POLICY "Users can view alerts in their organization"
ON security_alerts FOR SELECT
USING (customer_id IN (
  SELECT customer_id FROM user_profiles 
  WHERE user_id = auth.uid()
));
```

### Role-Based Access

SOC features require admin role:
```typescript
<Route path="/dashboard/soc" element={
  <ProtectedRoute requireAdmin>
    <SOCDashboard />
  </ProtectedRoute>
} />
```

### Audit Logging

All privileged SOC actions logged to `audit_logs`:
- Alert acknowledgment/resolution
- Incident creation/updates
- Playbook executions
- Threat feed modifications

## Integration Patterns

### Alert → Incident Escalation

```typescript
// In SecurityAlerts component
const escalateToIncident = async (alertId: string) => {
  const alert = alerts.find(a => a.id === alertId);
  
  const { data: incident } = await supabase
    .from('security_incidents')
    .insert({
      incident_name: `Alert ${alert.alert_id} escalated`,
      incident_type: alert.alert_type,
      severity: alert.severity,
      description: alert.alert_details,
      initial_detection_time: alert.created_at,
      related_alerts: [alertId],
      reported_by: currentUser.id
    })
    .select()
    .single();
  
  await supabase
    .from('security_alerts')
    .update({ 
      status: 'escalated',
      incident_id: incident.id 
    })
    .eq('id', alertId);
};
```

### Incident → Playbook Execution

```typescript
// In SecurityIncidents component
const executePlaybook = async (incidentId: string, playbookId: string) => {
  const { data: execution } = await supabase
    .from('playbook_executions')
    .insert({
      playbook_id: playbookId,
      incident_id: incidentId,
      execution_status: 'running',
      triggered_by: currentUser.id,
      started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  // Execute playbook steps...
  // Update execution status as steps complete
};
```

### Threat Intel → Alert Enrichment

Automatic via `alert-processor` edge function when alerts are created.

## Compliance Mapping

### SOC 2 Type II
- **CC6.1**: Alert monitoring and incident response
- **CC6.6**: Threat intelligence integration
- **CC6.7**: Incident lifecycle management
- **CC7.2**: Security event logging (SIEM)

### ISO 27001
- **A.12.6.1**: Management of technical vulnerabilities (threat intel)
- **A.16.1.4**: Incident response procedures (playbooks)
- **A.16.1.5**: Incident response evidence (SIEM logs)
- **A.16.1.7**: Collection of evidence

### NIST CSF
- **DE.AE**: Anomalies and Events (SIEM aggregation)
- **DE.CM**: Security Continuous Monitoring (alerts)
- **RS.AN**: Analysis (incident investigation)
- **RS.MI**: Mitigation (playbooks)

## Performance Considerations

### Database Indexing

```sql
-- Critical indexes for performance
CREATE INDEX idx_security_alerts_customer_created 
  ON security_alerts(customer_id, created_at DESC);

CREATE INDEX idx_threat_indicators_value 
  ON threat_intel_indicators(indicator_value) 
  WHERE is_active = true;

CREATE INDEX idx_incidents_status 
  ON security_incidents(customer_id, status, created_at DESC);
```

### Query Optimization

- Use materialized view `soc_metrics_dashboard` for dashboard metrics
- Implement time-based partitioning for high-volume tables (alerts, events)
- Cache threat intel indicators in application memory (TTL: 5 minutes)

### Scalability

- Edge functions auto-scale with traffic
- Database read replicas for SIEM queries
- Threat intel sync runs asynchronously
- Batch operations for bulk indicator imports (500 records/batch)

## Monitoring & Alerting

### Key Metrics to Track

1. **Alert Processing Time**: Time from detection to acknowledgment
2. **Incident Response Time**: Time from detection to containment
3. **False Positive Rate**: Alerts marked as false positives / total alerts
4. **Threat Intel Coverage**: % of alerts with IOC matches
5. **Playbook Success Rate**: Successful executions / total executions
6. **SIEM Event Volume**: Events processed per minute

### Health Checks

```typescript
// Check edge function health
const healthCheck = async () => {
  const checks = await Promise.all([
    supabase.functions.invoke('alert-processor', { 
      body: { health_check: true } 
    }),
    supabase.functions.invoke('threat-intel-sync', { 
      body: { health_check: true } 
    }),
  ]);
  
  return checks.every(c => !c.error);
};
```

## Troubleshooting

### Common Issues

**1. Threat feed sync failures**
- Check API keys in feed configuration
- Verify external API rate limits not exceeded
- Review edge function logs: `supabase functions logs threat-intel-sync`

**2. Alert enrichment slow**
- Check threat intel indicator count (optimize if > 100k)
- Review database indexes
- Consider indicator caching

**3. SIEM event aggregation timeouts**
- Reduce time window (30d → 7d)
- Add pagination for large result sets
- Use materialized views for common queries

**4. Playbook execution failures**
- Check playbook step definitions for errors
- Verify required permissions for automated actions
- Review execution logs in `playbook_executions` table

## Future Enhancements

### Planned Features

1. **Machine Learning Detection**
   - Behavioral anomaly detection using historical patterns
   - Predictive incident forecasting
   - Automated threat hunting

2. **Advanced SOAR Capabilities**
   - Webhook integrations for external SIEM/SOAR tools
   - Custom playbook scripting (Python/JavaScript)
   - Workflow orchestration with approvals

3. **Enhanced Threat Intelligence**
   - Custom threat feed support
   - Internal IOC sharing between customers (opt-in)
   - Threat actor profiling

4. **SIEM Analytics**
   - Real-time event correlation rules
   - Attack chain detection (MITRE ATT&CK mapping)
   - Visualization dashboards (heatmaps, timelines)

5. **Integration Expansion**
   - Splunk/ELK integration
   - Palo Alto Cortex XSOAR
   - Microsoft Sentinel
   - CrowdStrike Falcon

## Getting Started

### Initial Setup

1. **Enable SOC Features** (already active)
2. **Configure Threat Feeds**:
   ```sql
   -- Add initial feeds
   INSERT INTO threat_intel_feeds (customer_id, feed_name, feed_source, is_active)
   VALUES 
     ('{customer_id}', 'AlienVault OTX', 'alienvault', true),
     ('{customer_id}', 'AbuseIPDB', 'abuseipdb', true);
   ```

3. **Create Response Playbooks**:
   - Navigate to `/security/playbooks`
   - Click "Create Playbook"
   - Define incident response procedures

4. **Set Up Alert Rules**:
   - Configure alert forwarding from existing systems
   - Use `alert-processor` edge function for enrichment

5. **Access SOC Dashboard**: Navigate to `/dashboard/soc`

### Training & Documentation

- **User Guide**: Available at `/knowledge-base` (search "SOC")
- **Video Tutorials**: Coming soon
- **API Reference**: See `API_REFERENCE.md`

## Support & Resources

- **Technical Issues**: Contact platform admins
- **Feature Requests**: Submit via internal portal
- **Security Incidents**: Follow escalation procedures in playbooks
- **Documentation Updates**: Submit PR to this file

---

**Last Updated**: October 14, 2025  
**Version**: 1.0.0  
**Maintained By**: OberaConnect Platform Team
