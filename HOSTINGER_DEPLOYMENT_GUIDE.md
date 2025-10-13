# Hostinger Deployment Guide

**Version:** 1.0  
**Last Updated:** October 2025  
**Platform:** OberaConnect v2.1

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Build Process](#build-process)
4. [Environment Configuration](#environment-configuration)
5. [File Upload](#file-upload)
6. [URL Rewriting Setup](#url-rewriting-setup)
7. [CORS Configuration](#cors-configuration)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)
11. [Alternative Deployment Options](#alternative-deployment-options)

---

## Overview

This guide covers deploying the OberaConnect React application to Hostinger web hosting. The deployment separates the **frontend** (hosted on Hostinger) from the **backend** (remaining on Lovable Cloud/Supabase).

### Architecture After Deployment

```
┌─────────────────┐         ┌──────────────────┐
│   Hostinger     │  HTTPS  │  Lovable Cloud   │
│   (Frontend)    │────────>│   (Backend)      │
│                 │         │                  │
│ - React App     │         │ - Database       │
│ - Static Assets │         │ - Authentication │
│ - index.html    │         │ - Edge Functions │
└─────────────────┘         │ - File Storage   │
                            └──────────────────┘
```

---

## Prerequisites

### Required Tools
- ✅ Node.js (v16+) and npm installed locally
- ✅ Hostinger account with active hosting plan
- ✅ FTP/SFTP client (FileZilla, Cyberduck) or Hostinger File Manager access
- ✅ Access to Hostinger control panel (hPanel)

### Required Information
- Hostinger FTP credentials (host, username, password, port)
- Custom domain (if applicable)
- Supabase credentials (already configured in `.env`)

---

## Build Process

### Step 1: Prepare Production Build

```bash
# Navigate to project directory
cd /path/to/your/project

# Install dependencies (if not already done)
npm install

# Create production build
npm run build
```

**Expected Output:**
```
✓ building for production...
✓ 1234 modules transformed.
dist/index.html                  0.45 kB
dist/assets/index-abc123.css    123.45 kB
dist/assets/index-def456.js     456.78 kB
✓ built in 12.34s
```

### Step 2: Verify Build Output

The `dist/` folder should contain:
- `index.html` (entry point)
- `assets/` folder (CSS, JS, images)
- `favicon.png`
- Other static assets

---

## Environment Configuration

### Hostinger Environment Variables

Hostinger may not support `.env` files directly. You have **two options**:

#### **Option A: Hardcode in Build (Simple)**

Before running `npm run build`, ensure `.env` has production values:

```env
VITE_SUPABASE_PROJECT_ID="olrpexessehcijdvogxo"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scnBleGVzc2VoY2lqZHZvZ3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0Njc3MjIsImV4cCI6MjA3NTA0MzcyMn0.TQ1jthqKDE7VfbJu9CCMwc6p6p8J7Z2qhPf3fz7fub8"
VITE_SUPABASE_URL="https://olrpexessehcijdvogxo.supabase.co"
```

✅ **Recommended** - Variables are bundled into the build.

#### **Option B: Server-Side Environment Variables (Advanced)**

If Hostinger supports Node.js hosting:
1. Access Hostinger control panel
2. Navigate to **Advanced → Environment Variables**
3. Add the three variables above
4. Restart the application

⚠️ Most shared hosting plans don't support this—use **Option A**.

---

## File Upload

### Method 1: FTP/SFTP Upload (Recommended)

**Step 1: Connect via FTP Client**

Use these settings (found in Hostinger hPanel → Files → FTP Accounts):
- **Host:** `ftp.yourdomain.com` or `yourdomain.com`
- **Username:** Your FTP username
- **Password:** Your FTP password
- **Port:** `21` (FTP) or `22` (SFTP)
- **Protocol:** FTP or SFTP (SFTP preferred for security)

**Step 2: Navigate to Web Root**

Typical web root directories:
- `public_html/` (most common)
- `httpdocs/`
- `www/`

**Step 3: Upload Files**

1. **Delete** existing files in web root (if any) or create a subdirectory
2. **Upload** ALL contents of `dist/` folder to web root:
   - `index.html` → `public_html/index.html`
   - `assets/` → `public_html/assets/`
   - All other files

⚠️ **Critical:** Upload contents of `dist/`, NOT the `dist/` folder itself.

### Method 2: Hostinger File Manager

1. Log in to Hostinger hPanel
2. Navigate to **Files → File Manager**
3. Open `public_html/` directory
4. Click **Upload Files**
5. Select ALL files from `dist/` folder
6. Wait for upload to complete

---

## URL Rewriting Setup

React Router requires URL rewriting to handle client-side routing.

### Create `.htaccess` File

**Step 1: Create File**

In your web root (`public_html/`), create a file named `.htaccess`

**Step 2: Add Rewrite Rules**

```apache
# Enable Rewrite Engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories that exist
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule ^(.*)$ index.html [L,QSA]
</IfModule>

# Compression for faster load times
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

**Step 3: Upload `.htaccess`**

Upload the file to `public_html/.htaccess`

⚠️ **Note:** Files starting with `.` are hidden. Enable "Show hidden files" in your FTP client.

---

## CORS Configuration

### Why CORS Matters

Lovable Cloud (Supabase) needs to allow requests from your Hostinger domain.

### Configure CORS in Supabase

1. Access your backend configuration:
   - You'll need to configure allowed origins in Supabase dashboard
   - Since you don't have direct Supabase access, contact your platform admin

2. **Add Your Hostinger Domain** to allowed origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

3. **Testing:** If you encounter CORS errors:
   ```
   Access to fetch at 'https://olrpexessehcijdvogxo.supabase.co' 
   from origin 'https://yourdomain.com' has been blocked by CORS policy
   ```
   → Your domain needs to be added to Supabase allowed origins.

---

## SSL/HTTPS Setup

### Enable HTTPS in Hostinger

**Step 1: Install SSL Certificate**

1. Log in to Hostinger hPanel
2. Navigate to **Security → SSL**
3. Select your domain
4. Click **Install SSL** (free Let's Encrypt SSL)
5. Wait 10-15 minutes for activation

**Step 2: Force HTTPS Redirect**

Add to `.htaccess` (at the top):

```apache
# Force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

**Why This Matters:**
- Supabase requires HTTPS connections
- Without SSL, authentication will fail

---

## Post-Deployment Verification

### Verification Checklist

**1. Access Your Site**
- Navigate to `https://yourdomain.com`
- Verify the homepage loads correctly

**2. Test Routing**
- Click navigation links (e.g., `/dashboard`, `/auth`)
- Verify routes load without 404 errors
- Refresh browser on a route (e.g., `/dashboard`) → should NOT 404

**3. Test Backend Connectivity**
- Open browser DevTools (F12) → Console
- Try logging in or accessing data
- Check for errors in Console or Network tabs

**4. Test Authentication**
- Navigate to login page
- Attempt to sign in
- Verify successful authentication

**5. Performance Check**
- Run Lighthouse audit (DevTools → Lighthouse)
- Target: Performance >80, Accessibility >90

### Common Post-Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on route refresh | Missing `.htaccess` rewrite | Add URL rewrite rules |
| CORS errors | Domain not allowed | Add domain to Supabase allowed origins |
| Login fails | No HTTPS | Enable SSL certificate |
| Blank page | Wrong file upload | Ensure `dist/` contents uploaded, not `dist/` folder |
| Assets not loading | Incorrect base path | Verify `index.html` references correct asset paths |

---

## Troubleshooting

### Issue: "Failed to fetch" errors

**Symptoms:** API calls fail, console shows network errors

**Solutions:**
1. Verify environment variables are correct in build
2. Check CORS configuration in Supabase
3. Ensure HTTPS is enabled (Supabase requires it)
4. Verify Supabase URL is accessible from browser

### Issue: Routes return 404 on refresh

**Symptoms:** Direct navigation to `/dashboard` shows 404

**Solution:**
- Verify `.htaccess` exists and has rewrite rules
- Check Apache `mod_rewrite` is enabled (contact Hostinger support if unsure)

### Issue: Assets not loading (CSS/JS 404s)

**Symptoms:** Page loads but appears unstyled

**Solution:**
1. Verify `assets/` folder uploaded correctly
2. Check `index.html` asset references (should be `/assets/...`)
3. Clear browser cache

### Issue: Authentication redirects fail

**Symptoms:** Login redirects to wrong URL

**Solution:**
- Update Supabase redirect URLs to use your Hostinger domain
- Verify authentication callback URLs in Supabase dashboard

### Issue: Environment variables not working

**Symptoms:** App can't connect to backend

**Solution:**
- Rebuild app with correct `.env` file
- Verify `VITE_*` prefix on all variables (required for Vite)
- Re-upload `dist/` folder

---

## Alternative Deployment Options

### Option 1: Lovable Built-in Deployment ⭐ **Recommended**

**Pros:**
- One-click deployment
- Automatic SSL, CDN, environment handling
- No manual configuration needed
- Built-in preview URLs

**How to Deploy:**
1. Click **Publish** button in Lovable editor (top right)
2. Choose deployment settings
3. Get instant live URL

**Custom Domain:**
- Navigate to Project Settings → Domains
- Follow DNS configuration steps
- Automatic SSL provisioning

### Option 2: GitHub + Vercel/Netlify

**Pros:**
- CI/CD pipeline (auto-deploy on push)
- Free tier available
- Better performance (global CDN)
- Built-in environment variable management

**Steps:**
1. Connect Lovable project to GitHub
2. Connect GitHub repo to Vercel/Netlify
3. Configure environment variables in hosting dashboard
4. Auto-deploys on every commit

### Option 3: Docker + VPS Hosting

**Pros:**
- Full control over environment
- Custom server configuration
- Can host backend too (if migrating from Lovable Cloud)

**Cons:**
- Requires DevOps knowledge
- More expensive
- Manual maintenance required

---

## Cost Comparison

| Option | Hosting Cost | Setup Time | Maintenance | Performance |
|--------|--------------|------------|-------------|-------------|
| **Hostinger** | $2-10/mo | 30-60 min | Manual updates | Good |
| **Lovable** | $20/mo+ | 1 min | Automatic | Excellent |
| **Vercel/Netlify** | Free-$20/mo | 15 min | Automatic | Excellent |
| **VPS** | $5-50/mo | 2-4 hours | High (manual) | Excellent |

---

## Security Considerations

### ✅ Production Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables not exposed in client code
- [ ] CORS properly configured (not `*` wildcard)
- [ ] Security headers configured in `.htaccess`
- [ ] Regular backups configured
- [ ] Hostinger account secured with 2FA
- [ ] DNS records properly configured
- [ ] Rate limiting considered (if high traffic expected)

### ⚠️ Critical Security Notes

1. **Never commit `.env` to Git** - Environment variables are baked into build
2. **Supabase keys in frontend are safe** - They're "publishable" keys (anon key)
3. **Service role key NEVER goes in frontend** - Only use in secure edge functions
4. **Monitor API usage** - Check Supabase dashboard for unusual activity

---

## Support & Resources

### Hostinger Support
- **Knowledge Base:** https://support.hostinger.com
- **Live Chat:** Available 24/7 in hPanel
- **Ticket System:** Submit via hPanel → Help

### Lovable/Supabase Support
- **Lovable Docs:** https://docs.lovable.dev
- **Supabase Docs:** https://supabase.com/docs
- **Community Discord:** [Lovable Discord](https://discord.com/channels/1119885301872070706)

### Useful Tools
- **DNS Checker:** https://dnschecker.org
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html
- **CORS Tester:** Browser DevTools Network tab

---

## Conclusion

Deploying to Hostinger separates your frontend from Lovable Cloud backend. While functional, **Lovable's built-in deployment** offers superior developer experience with automatic configuration, SSL, and CDN.

**Recommended Path:**
- **Prototyping/Development:** Use Hostinger for cost savings
- **Production/Scale:** Migrate to Lovable deployment or Vercel/Netlify for performance and reliability

---

**Document Version:** 1.0  
**Maintained By:** OberaConnect Platform Team  
**Last Review:** October 2025
