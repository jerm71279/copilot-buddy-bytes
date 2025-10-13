# Self-Hosted Supabase Migration Guide

**Version:** 1.0  
**Last Updated:** October 2025  
**Status:** Complete Migration Path

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Timeline](#migration-timeline)
4. [Pre-Migration Preparation](#pre-migration-preparation)
5. [Database Migration](#database-migration)
6. [Edge Functions Migration](#edge-functions-migration)
7. [Authentication Migration](#authentication-migration)
8. [Storage Migration](#storage-migration)
9. [Environment Configuration](#environment-configuration)
10. [Testing & Validation](#testing--validation)
11. [Go-Live Checklist](#go-live-checklist)
12. [Rollback Procedures](#rollback-procedures)
13. [Cost Comparison](#cost-comparison)

---

## Overview

This guide documents the complete migration path from **Lovable Cloud** (managed Supabase) to a **self-hosted Supabase** instance.

### What Gets Migrated

| Component | Items | Migration Method |
|-----------|-------|------------------|
| **Database** | 93 tables + schemas | `pg_dump` + restore |
| **Edge Functions** | 60+ serverless functions | Supabase CLI deployment |
| **Authentication** | User accounts + providers | User export + import |
| **RLS Policies** | Security policies | Included in schema dump |
| **Storage Buckets** | File storage (if used) | Manual migration |
| **Secrets** | Environment variables | Manual reconfiguration |

### Why Self-Host?

- **Data sovereignty** - Full control over data location
- **Cost optimization** - Potentially lower costs at scale
- **Compliance** - Meet specific regulatory requirements
- **Customization** - Deeper infrastructure control
- **Independence** - Not tied to Lovable ecosystem

---

## Prerequisites

### 1. Technical Requirements

- **Server Infrastructure**
  - Minimum: 2 vCPUs, 4GB RAM, 50GB SSD
  - Recommended: 4 vCPUs, 8GB RAM, 100GB SSD
  - Operating System: Ubuntu 20.04+ or Docker-compatible

- **Docker & Docker Compose**
  - Docker Engine 20.10+
  - Docker Compose 1.29+

- **Domain & DNS**
  - Custom domain for your Supabase instance
  - SSL certificate (Let's Encrypt recommended)

### 2. Software Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Install PostgreSQL client tools
sudo apt-get install postgresql-client

# Verify installations
supabase --version
psql --version
```

### 3. Access Requirements

- Admin access to Lovable Cloud backend
- SSH access to target hosting server
- Domain registrar access for DNS configuration

---

## Migration Timeline

**Estimated Total Time:** 1-2 days (excluding testing)

| Phase | Duration | Downtime Required |
|-------|----------|-------------------|
| Preparation | 2-4 hours | No |
| Database Export | 30-60 min | No |
| Infrastructure Setup | 2-3 hours | No |
| Database Import | 30-60 min | No |
| Edge Functions Deploy | 1-2 hours | No |
| Auth Migration | 1-2 hours | No |
| Testing | 4-8 hours | No |
| **DNS Cutover** | **15-30 min** | **YES (5-15 min)** |
| Validation | 1-2 hours | No |

---

## Pre-Migration Preparation

### Step 1: Audit Current Setup

**Document your current Lovable Cloud configuration:**

```bash
# Create migration directory
mkdir -p supabase-migration
cd supabase-migration

# Document current environment
cat > current-config.md << EOF
## Current Lovable Cloud Setup

### Project Details
- Project ID: olrpexessehcijdvogxo
- Project URL: https://olrpexessehcijdvogxo.supabase.co
- Database Size: [Check in Lovable Cloud dashboard]
- Active Users: [Check in dashboard]

### Features in Use
- [ ] Database (93 tables)
- [ ] Authentication (Email, OAuth)
- [ ] Storage Buckets
- [ ] Edge Functions (60+)
- [ ] Realtime Subscriptions

### Third-Party Integrations
- [ ] CIPP Integration
- [ ] NinjaOne Integration
- [ ] Revio Integration
- [ ] Microsoft 365 Integration

### Custom Configurations
- Enabled auth providers: [List them]
- Storage buckets: [List them]
- CORS origins: [List them]
- Custom email templates: [Yes/No]
EOF
```

### Step 2: Backup Current Data

**Critical: Create a complete backup before starting**

```bash
# Export database schema and data
supabase db dump --db-url "postgresql://..." > lovable-backup.sql

# Backup Edge Functions code (already in your repo)
cp -r supabase/functions ./supabase-migration/functions-backup

# Export user list (via Lovable Cloud dashboard)
# Navigate to: Backend > Authentication > Users > Export CSV

# Document current secrets
cat > secrets-checklist.md << EOF
## Secrets to Migrate

- [ ] OPENAI_API_KEY
- [ ] NINJAONE_API_KEY
- [ ] CIPP_API_KEY
- [ ] [List all your secrets]
EOF
```

---

## Database Migration

### Step 1: Export Database from Lovable Cloud

**Option A: Using Supabase CLI (Recommended)**

```bash
# Get database connection string from Lovable Cloud
# Format: postgresql://postgres:[PASSWORD]@db.olrpexessehcijdvogxo.supabase.co:5432/postgres

# Export full database
supabase db dump \
  --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.olrpexessehcijdvogxo.supabase.co:5432/postgres" \
  --file lovable-cloud-full-backup.sql

# Verify export
ls -lh lovable-cloud-full-backup.sql
# Should be several MB depending on data size
```

**Option B: Using pg_dump directly**

```bash
# Export schema + data
pg_dump \
  --host=db.olrpexessehcijdvogxo.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema=public \
  --schema=auth \
  --schema=storage \
  --no-owner \
  --no-acl \
  --file=lovable-backup.sql

# Export data only (for testing imports)
pg_dump \
  --host=db.olrpexessehcijdvogxo.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --data-only \
  --file=lovable-data-only.sql
```

### Step 2: Set Up Self-Hosted Supabase

**Option A: Docker Compose (Easiest)**

```bash
# Clone Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Generate secrets
cp .env.example .env

# Important: Update these in .env
# POSTGRES_PASSWORD=your-super-secret-password
# JWT_SECRET=your-jwt-secret
# ANON_KEY=your-anon-key
# SERVICE_ROLE_KEY=your-service-role-key

# Generate secure keys
openssl rand -base64 32  # Use for POSTGRES_PASSWORD
openssl rand -base64 32  # Use for JWT_SECRET

# Start Supabase
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Option B: Kubernetes/Production Setup**

See: https://supabase.com/docs/guides/self-hosting/docker#production-setup

### Step 3: Import Database to Self-Hosted Instance

```bash
# Wait for PostgreSQL to be ready
docker-compose exec db psql -U postgres -c "SELECT version();"

# Import schema and data
docker-compose exec -T db psql -U postgres < lovable-cloud-full-backup.sql

# Verify import
docker-compose exec db psql -U postgres -c "\dt"
# Should show all 93 tables

# Check row counts
docker-compose exec db psql -U postgres -c "
  SELECT schemaname, tablename, 
         (xpath('/row/cnt/text()', 
                query_to_xml('SELECT COUNT(*) AS cnt FROM \"' || schemaname || '\".\"' || tablename || '\"', false, true, '')))[1]::text::int AS row_count
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY row_count DESC;
"
```

### Step 4: Verify Database Functions & Triggers

```bash
# List all functions
docker-compose exec db psql -U postgres -c "\df"

# Test critical functions
docker-compose exec db psql -U postgres << EOF
-- Test UUID generation
SELECT gen_random_uuid();

-- Test custom functions
SELECT has_role('00000000-0000-0000-0000-000000000000'::uuid, 'admin'::app_role);

-- Verify triggers
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname NOT LIKE 'pg_%';
EOF
```

---

## Edge Functions Migration

### Step 1: Prepare Functions for Self-Hosted Deployment

Your Edge Functions are already in `supabase/functions/`. No code changes needed!

```bash
# Verify all functions are present
ls -la supabase/functions/

# Expected output: 60+ function directories
# ai-mcp-generator/
# analytics-processor/
# auto-remediation/
# ... etc
```

### Step 2: Configure Supabase CLI for Self-Hosted

```bash
# Link to your self-hosted instance
supabase link --project-ref YOUR_PROJECT_ID

# Update .env for self-hosted
cat > supabase/.env << EOF
SUPABASE_URL=https://your-domain.com
SUPABASE_ANON_KEY=your-self-hosted-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-self-hosted-service-role-key
EOF
```

### Step 3: Deploy All Edge Functions

```bash
# Deploy all functions at once
supabase functions deploy --project-ref YOUR_PROJECT_ID

# Or deploy individually
for func in supabase/functions/*/; do
  func_name=$(basename "$func")
  echo "Deploying $func_name..."
  supabase functions deploy "$func_name" --project-ref YOUR_PROJECT_ID
done

# Verify deployments
supabase functions list
```

### Step 4: Set Environment Variables for Functions

```bash
# Set secrets for Edge Functions
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set NINJAONE_API_KEY=your-key
supabase secrets set CIPP_API_KEY=your-key
# ... set all other secrets

# Verify secrets
supabase secrets list
```

### Step 5: Test Edge Functions

```bash
# Test a function locally
supabase functions serve ai-mcp-generator

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/ai-mcp-generator' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'

# Check function logs
supabase functions logs ai-mcp-generator
```

---

## Authentication Migration

### Step 1: Export Users from Lovable Cloud

**Via Lovable Cloud Dashboard:**

1. Open Lovable Cloud dashboard
2. Navigate to Authentication → Users
3. Click "Export" → Download CSV
4. Save as `users-export.csv`

**CSV Structure:**
```csv
id,email,created_at,email_confirmed_at,last_sign_in_at,raw_user_meta_data
uuid,user@example.com,2025-01-01,2025-01-01,2025-10-13,{"full_name":"John Doe"}
```

### Step 2: Import Users to Self-Hosted Supabase

**Option A: Using SQL (Recommended)**

```sql
-- Create temporary table for import
CREATE TEMP TABLE user_import (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
);

-- Import CSV
\copy user_import FROM 'users-export.csv' WITH (FORMAT csv, HEADER true);

-- Insert into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data,
  is_super_admin,
  role
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000000', -- Default instance_id
  email,
  '', -- Users will need to reset passwords
  email_confirmed_at,
  created_at,
  NOW(),
  last_sign_in_at,
  raw_user_meta_data,
  false,
  'authenticated'
FROM user_import;

-- Verify import
SELECT COUNT(*) FROM auth.users;
```

**Option B: Programmatic Migration Script**

```javascript
// migrate-users.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

const OLD_SUPABASE_URL = 'https://olrpexessehcijdvogxo.supabase.co';
const OLD_SERVICE_KEY = 'your-old-service-role-key';

const NEW_SUPABASE_URL = 'https://your-new-instance.com';
const NEW_SERVICE_KEY = 'your-new-service-role-key';

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SERVICE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_KEY);

async function migrateUsers() {
  const users = [];
  
  fs.createReadStream('users-export.csv')
    .pipe(csv())
    .on('data', (row) => users.push(row))
    .on('end', async () => {
      for (const user of users) {
        const { error } = await newSupabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: JSON.parse(user.raw_user_meta_data || '{}'),
        });
        
        if (error) {
          console.error(`Failed to migrate ${user.email}:`, error);
        } else {
          console.log(`✓ Migrated ${user.email}`);
        }
      }
    });
}

migrateUsers();
```

### Step 3: Configure OAuth Providers

**Google OAuth:**

```bash
# In self-hosted Supabase dashboard
# Settings → Authentication → Providers → Google

# Enter:
# - Client ID: [from Google Cloud Console]
# - Client Secret: [from Google Cloud Console]
# - Redirect URL: https://your-domain.com/auth/v1/callback
```

**Update Google Cloud Console:**

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add new Authorized redirect URI:
   - `https://your-domain.com/auth/v1/callback`

### Step 4: Email Templates & SMTP

```bash
# Configure SMTP in self-hosted .env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_ADMIN_EMAIL=admin@yourcompany.com
SMTP_SENDER_NAME=Your Company

# Restart services
docker-compose restart auth
```

---

## Storage Migration

### Step 1: List Storage Buckets

```bash
# Via Supabase client
SELECT * FROM storage.buckets;
```

### Step 2: Download Files from Lovable Cloud

```javascript
// download-storage.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://olrpexessehcijdvogxo.supabase.co',
  'your-service-role-key'
);

async function downloadBucket(bucketName) {
  const { data: files } = await supabase.storage
    .from(bucketName)
    .list();
  
  for (const file of files) {
    const { data } = await supabase.storage
      .from(bucketName)
      .download(file.name);
    
    const buffer = await data.arrayBuffer();
    fs.writeFileSync(
      path.join('./storage-backup', bucketName, file.name),
      Buffer.from(buffer)
    );
    
    console.log(`✓ Downloaded ${bucketName}/${file.name}`);
  }
}

// Run for each bucket
downloadBucket('avatars');
downloadBucket('documents');
```

### Step 3: Upload to Self-Hosted Storage

```javascript
// upload-storage.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  'https://your-new-instance.com',
  'your-new-service-role-key'
);

async function uploadBucket(bucketName) {
  // Create bucket first
  await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 52428800 // 50MB
  });
  
  const files = fs.readdirSync(path.join('./storage-backup', bucketName));
  
  for (const fileName of files) {
    const fileBuffer = fs.readFileSync(
      path.join('./storage-backup', bucketName, fileName)
    );
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer);
    
    if (error) {
      console.error(`✗ Failed to upload ${fileName}:`, error);
    } else {
      console.log(`✓ Uploaded ${bucketName}/${fileName}`);
    }
  }
}

uploadBucket('avatars');
uploadBucket('documents');
```

---

## Environment Configuration

### Step 1: Update Frontend Environment Variables

**Create new `.env` for self-hosted:**

```bash
# .env.production
VITE_SUPABASE_URL=https://your-domain.com
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key
VITE_SUPABASE_PROJECT_ID=your-new-project-id
```

### Step 2: Update CORS Settings

```sql
-- In your self-hosted Supabase database
-- Update CORS origins for your app
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('your-bucket', 'Your Bucket', true, 
        ARRAY['image/*', 'application/pdf'], 
        52428800);

-- Set CORS in Kong (API Gateway)
-- Edit docker/volumes/api/kong.yml
```

### Step 3: Configure Realtime

```bash
# In docker/.env
REALTIME_MAX_CONNECTIONS=100
REALTIME_SLOT_NAME=supabase_realtime

# Restart realtime service
docker-compose restart realtime
```

---

## Testing & Validation

### Phase 1: Smoke Tests (30 minutes)

```bash
# 1. Database connectivity
psql -h your-domain.com -U postgres -d postgres -c "SELECT version();"

# 2. Table count
psql -h your-domain.com -U postgres -d postgres -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"
# Expected: 93

# 3. Row counts match
# Compare with original backup

# 4. Auth service
curl https://your-domain.com/auth/v1/health

# 5. Storage service
curl https://your-domain.com/storage/v1/health

# 6. Edge Functions
curl https://your-domain.com/functions/v1/
```

### Phase 2: Functional Tests (2 hours)

**Create test script:**

```javascript
// test-migration.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-domain.com',
  'your-anon-key'
);

async function runTests() {
  console.log('Starting migration validation tests...\n');
  
  // Test 1: Database query
  console.log('Test 1: Database Read');
  const { data: customers, error: dbError } = await supabase
    .from('customers')
    .select('*')
    .limit(5);
  console.log(dbError ? '✗ FAILED' : '✓ PASSED', customers?.length || 0, 'records');
  
  // Test 2: Authentication
  console.log('\nTest 2: User Authentication');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test-password'
  });
  console.log(authError ? '✗ FAILED' : '✓ PASSED');
  
  // Test 3: Edge Function
  console.log('\nTest 3: Edge Function Invocation');
  const { data: funcData, error: funcError } = await supabase.functions.invoke('global-search', {
    body: { query: 'test' }
  });
  console.log(funcError ? '✗ FAILED' : '✓ PASSED');
  
  // Test 4: Storage
  console.log('\nTest 4: Storage Access');
  const { data: storageData, error: storageError } = await supabase.storage
    .from('avatars')
    .list();
  console.log(storageError ? '✗ FAILED' : '✓ PASSED', storageData?.length || 0, 'files');
  
  // Test 5: RLS Policies
  console.log('\nTest 5: Row Level Security');
  const { data: rlsData, error: rlsError } = await supabase
    .from('user_profiles')
    .select('*');
  console.log(rlsError?.code === 'PGRST301' ? '✓ PASSED (RLS enforced)' : '✗ FAILED (RLS not working)');
  
  console.log('\n✅ All tests complete');
}

runTests();
```

### Phase 3: Load Testing (Optional)

```bash
# Install k6 load testing tool
brew install k6  # macOS
# or
sudo apt-get install k6  # Ubuntu

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let response = http.get('https://your-domain.com/rest/v1/customers?select=*');
  check(response, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

---

## Go-Live Checklist

### Pre-Cutover (Day Before)

- [ ] **Final database backup** from Lovable Cloud
- [ ] **Final data sync** (incremental changes)
- [ ] **DNS TTL reduced** to 300 seconds (5 minutes)
- [ ] **Team notification** sent
- [ ] **Rollback plan** reviewed
- [ ] **Maintenance page** prepared
- [ ] **Monitoring tools** configured

### Cutover Window (15-30 minutes)

```bash
# Step 1: Enable maintenance mode
# Point domain to maintenance page

# Step 2: Stop writes to old database
# Disable Lovable Cloud app (if possible)

# Step 3: Final incremental sync
pg_dump --data-only --host=old-db > final-sync.sql
psql -h your-domain.com -U postgres -f final-sync.sql

# Step 4: Update DNS
# Point A record to new self-hosted IP

# Step 5: Update frontend .env
cp .env.production .env

# Step 6: Deploy frontend with new config
npm run build
# Deploy to hosting

# Step 7: Verify new setup
curl https://your-domain.com/rest/v1/customers

# Step 8: Disable maintenance mode
```

### Post-Cutover Validation

- [ ] Users can log in
- [ ] Data displays correctly
- [ ] Edge Functions work
- [ ] Storage files accessible
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Monitoring active

---

## Rollback Procedures

### If Issues Occur Within 1 Hour

**Quick DNS rollback:**

```bash
# 1. Revert DNS to Lovable Cloud
# Point A record back to: olrpexessehcijdvogxo.supabase.co

# 2. Revert frontend .env
cp .env.lovable-backup .env

# 3. Redeploy frontend
npm run build
# Deploy

# 4. Notify users
# "We've temporarily reverted to the previous system"

# Estimated rollback time: 10-15 minutes
```

### If Issues Occur After 24 Hours

**Data sync required:**

```bash
# 1. Export changes from self-hosted
pg_dump --data-only --host=your-domain.com \
  --table=customers --table=user_profiles > changes.sql

# 2. Import to Lovable Cloud
psql -h db.olrpexessehcijdvogxo.supabase.co -U postgres -f changes.sql

# 3. Revert DNS & frontend

# Estimated rollback time: 1-2 hours
```

---

## Cost Comparison

### Lovable Cloud (Managed)

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0/mo | Limited usage |
| Pro | $25/mo | Production usage |
| Team | $599/mo | Team features |

### Self-Hosted Supabase

| Component | Cost | Notes |
|-----------|------|-------|
| **Server (DigitalOcean)** | $48-96/mo | 4GB-8GB RAM droplet |
| **Backup Storage** | $5/mo | 100GB spaces |
| **Domain & SSL** | $12/year | Let's Encrypt is free |
| **Monitoring (Optional)** | $10/mo | Datadog/New Relic |
| **Email (SendGrid)** | $15/mo | 40k emails/mo |
| **Total** | **$78-126/mo** | vs $25-599/mo managed |

**Break-even Analysis:**
- Self-hosting makes sense when:
  - You're on Team tier ($599/mo)
  - You need data sovereignty
  - You have DevOps expertise

---

## Support & Resources

### Official Documentation
- Supabase Self-Hosting: https://supabase.com/docs/guides/self-hosting
- Docker Setup: https://github.com/supabase/supabase/tree/master/docker

### Community
- Supabase Discord: https://discord.supabase.com
- GitHub Discussions: https://github.com/supabase/supabase/discussions

### Emergency Contacts
- Document your team's emergency contact list here

---

## Appendix

### A. Complete Environment Variables Reference

```bash
# Self-Hosted Supabase .env Template
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-jwt-secret-at-least-32-characters-long
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

SITE_URL=https://your-domain.com
API_EXTERNAL_URL=https://your-domain.com

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key
SMTP_ADMIN_EMAIL=admin@yourcompany.com

ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_PHONE_SIGNUP=false

GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_SECRET=your-google-secret
```

### B. Database Schema Export Script

```bash
#!/bin/bash
# export-schema-only.sh

pg_dump \
  --host=db.olrpexessehcijdvogxo.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --no-owner \
  --no-acl \
  --file=schema-only-$(date +%Y%m%d).sql

echo "Schema exported to schema-only-$(date +%Y%m%d).sql"
```

### C. Monitoring Setup

```bash
# Install Prometheus exporter for PostgreSQL
docker run -d \
  --name postgres-exporter \
  -p 9187:9187 \
  -e DATA_SOURCE_NAME="postgresql://postgres:password@your-db:5432/postgres?sslmode=disable" \
  prometheuscommunity/postgres-exporter

# Add to prometheus.yml
cat >> prometheus.yml << EOF
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
EOF
```

---

**Document Version:** 1.0  
**Last Review:** October 2025  
**Next Review:** When planning migration  
**Owner:** [Your Name/Team]

**Status:** ✅ Complete migration path documented
