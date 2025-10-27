# CVE Daily Polling System

## Overview
Automated system that polls the National Vulnerability Database (NVD) daily to fetch and store the latest CVE (Common Vulnerabilities and Exposures) entries.

## Architecture

### Database Schema

**cve_entries**
- `id`: Unique identifier (UUID)
- `cve_id`: CVE identifier (e.g., CVE-2024-1234)
- `description`: Vulnerability description
- `severity`: Severity level (CRITICAL, HIGH, MEDIUM, LOW)
- `cvss_score`: CVSS score (0-10)
- `published_date`: When the CVE was published
- `last_modified_date`: When the CVE was last modified
- `affected_products`: Array of affected product CPE strings
- `reference_urls`: JSON array of reference URLs
- `cwe_ids`: Array of CWE (Common Weakness Enumeration) identifiers
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

**cve_sync_logs**
- `id`: Unique identifier (UUID)
- `sync_started_at`: When the sync started
- `sync_completed_at`: When the sync completed
- `status`: Sync status (running, completed, failed)
- `cves_fetched`: Total CVEs fetched from NVD
- `cves_new`: Number of new CVEs inserted
- `cves_updated`: Number of existing CVEs updated
- `error_message`: Error message if sync failed

### Edge Function: cve-sync

**Location**: `supabase/functions/cve-sync/index.ts`

**Functionality**:
1. Fetches CVEs published in the last 24 hours from NVD API
2. Extracts and normalizes CVE data:
   - Description (English preferred)
   - CVSS v3.1 or v2 scores and severity
   - CWE weaknesses
   - Affected products (CPE strings)
   - Reference URLs
3. Updates existing CVEs if modified
4. Inserts new CVEs into database
5. Logs all sync operations

**API Endpoint**: `https://olrpexessehcijdvogxo.supabase.co/functions/v1/cve-sync`

**NVD API**: Uses NVD REST API v2.0
- Endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- Rate limit: No API key required for public access (5 requests per 30 seconds)
- Date range: Last 24 hours from current date

### Scheduled Job

**Schedule**: Daily at 2:00 AM UTC
**Implementation**: PostgreSQL pg_cron extension
**Job Name**: `daily-cve-sync`

## Security

### RLS Policies
- Authenticated users can **view** all CVE entries and sync logs
- Service role can **manage** all CVE data (for sync operations)

### Data Validation
- Description limited to 5000 characters
- Affected products limited to 100 entries
- CWE IDs limited to 20 entries
- All data sanitized before insertion

## Usage

### Manual Trigger
You can manually trigger the CVE sync via the Supabase dashboard or API:

```typescript
const { data, error } = await supabase.functions.invoke('cve-sync');
```

### Query CVEs
```typescript
// Get latest CVEs
const { data: cves } = await supabase
  .from('cve_entries')
  .select('*')
  .order('published_date', { ascending: false })
  .limit(20);

// Get critical CVEs
const { data: critical } = await supabase
  .from('cve_entries')
  .select('*')
  .eq('severity', 'CRITICAL')
  .order('published_date', { ascending: false });

// Get CVEs by CVSS score
const { data: highScore } = await supabase
  .from('cve_entries')
  .select('*')
  .gte('cvss_score', 7.0)
  .order('cvss_score', { ascending: false });
```

### Monitor Sync Status
```typescript
// Get recent sync logs
const { data: logs } = await supabase
  .from('cve_sync_logs')
  .select('*')
  .order('sync_started_at', { ascending: false })
  .limit(10);
```

## Monitoring

### Check Cron Jobs
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-cve-sync';
```

### View Cron Run History
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-cve-sync')
ORDER BY start_time DESC 
LIMIT 20;
```

## Maintenance

### Disable Scheduled Sync
```sql
SELECT cron.unschedule('daily-cve-sync');
```

### Re-enable Scheduled Sync
```sql
SELECT cron.schedule(
  'daily-cve-sync',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://olrpexessehcijdvogxo.supabase.co/functions/v1/cve-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scnBleGVzc2VoY2lqZHZvZ3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Njc3MjIsImV4cCI6MjA3NTA0MzcyMn0.TQ1jthqKDE7VfbJu9CCMwc6p6p8J7Z2qhPf3fz7fub8"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
```

### Change Schedule Time
```sql
-- Unschedule existing job
SELECT cron.unschedule('daily-cve-sync');

-- Create new schedule (example: 6 AM UTC)
SELECT cron.schedule(
  'daily-cve-sync',
  '0 6 * * *',
  -- same HTTP POST query as above
);
```

## Error Handling

The system includes comprehensive error handling:
- Failed API requests are logged with error messages
- Sync failures are recorded in `cve_sync_logs` table
- Individual CVE processing errors don't stop the entire sync
- All errors are logged to edge function logs for debugging

## Limitations

1. **NVD API Rate Limits**: Without an API key, limited to 5 requests per 30 seconds
2. **Data Window**: Currently fetches only the last 24 hours of CVEs
3. **Results Per Page**: Limited to 100 CVEs per request (NVD API limit)

## Future Enhancements

- [ ] Add NVD API key support for higher rate limits
- [ ] Implement pagination for large result sets
- [ ] Add webhook notifications for critical CVEs
- [ ] Create dashboard for CVE visualization
- [ ] Add filtering by product/vendor
- [ ] Implement historical CVE backfill
- [ ] Add integration with threat intelligence systems
