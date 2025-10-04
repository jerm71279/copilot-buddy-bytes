# 🚨 URGENT NEXT STEPS - OberaConnect Microsoft 365 Integration

**Last Updated:** 2025-10-04  
**Status:** CRITICAL - Integration currently non-functional

---

## 🔴 IMMEDIATE BLOCKERS (Do These First)

### 1. Enable Azure Provider in Lovable Cloud - **CRITICAL**
**Status:** ❌ Blocking all Microsoft 365 authentication  
**Owner:** System Administrator  
**Time Estimate:** 10 minutes

#### Error Message:
```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

#### Actions Required:
1. Open Lovable Cloud Backend (see button below)
2. Navigate to **Users → Auth Settings → Azure**
3. **Enable the Azure Provider** (toggle switch)
4. Enter your Azure AD credentials:
   - **Client ID** from Azure AD app registration
   - **Client Secret** from Azure AD app registration
   - **Azure AD Tenant** (optional, for single-tenant apps)
5. Save configuration

#### If You Don't Have Azure AD App Yet:
1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **New registration**
3. Name: "OberaConnect"
4. Supported account types: "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
5. Add Redirect URI from Lovable Cloud backend (shown after enabling Azure provider)
6. Under **Certificates & secrets**, create a new client secret
7. Copy Client ID and Secret to Lovable Cloud

#### Validation:
- Azure provider shows as "Enabled" in backend
- "Sign in with Microsoft 365" button no longer shows error
- Clicking button redirects to login.microsoftonline.com

---

### 2. Azure AD App Configuration - **CRITICAL**
**Status:** ❌ Blocking all Microsoft 365 features  
**Owner:** Azure Admin  
**Time Estimate:** 15 minutes

#### Actions Required:
1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Select your OberaConnect app
3. Navigate to **API permissions**
4. Add these **Delegated Permissions** for Microsoft Graph:
   - ✅ `User.Read` (already configured)
   - ❌ `Calendars.Read` - **ADD THIS**
   - ❌ `Mail.Read` - **ADD THIS**
   - ❌ `Files.Read.All` - **ADD THIS**
   - ❌ `Chat.Read` - **ADD THIS** (for Teams)
5. Click **"Grant admin consent for [Your Organization]"** - THIS IS CRITICAL
6. Verify all permissions show green checkmarks

#### Validation:
- All permissions should show "Granted for [Organization]" in green
- No yellow warning icons should be visible

---

### 3. Fix User Profile Database Issue - **HIGH PRIORITY** ✅ FIXED
**Status:** ❌ Causing 406 errors on Portal
**Owner:** Backend Developer  
**Time Estimate:** 30 minutes

#### Current Issue:
```
GET /rest/v1/user_profiles?select=*%2Ccustomers%28*%29&user_id=eq.7aea5ddd...
Status: 406 (Not Acceptable)
Error: "Cannot coerce the result to a single JSON object"
```

#### Root Cause:
- Users signing in with Microsoft 365 don't have profiles created
- The `auto_assign_admin_role` trigger only fires for email signups
- Foreign key relationship between user_profiles and customers is missing

#### Fix Required:
- Run database migration to create profiles for OAuth users
- Add trigger for Microsoft 365 sign-ins
- Fix data model relationships

---

### 4. Fix Microsoft Access Token Persistence - **HIGH PRIORITY**
**Status:** ❌ Tokens not being stored correctly  
**Owner:** Backend Developer  
**Time Estimate:** 1 hour

#### Current Issue:
```
POST /functions/v1/graph-api
Status: 401
Error: "No Microsoft access token found. Please sign in with Microsoft 365."
```

#### Root Cause:
- `user.user_metadata.provider_token` is not being populated
- Supabase OAuth flow not configured to store provider tokens
- No token refresh mechanism implemented

#### Fix Required:
- Update Supabase auth configuration
- Implement token storage in edge function
- Add automatic token refresh logic

---

## 🟡 HIGH PRIORITY (Week 1)

### 5. Enhance Error Handling & UX ✅ PARTIALLY COMPLETE
**Time Estimate:** 4 hours

- [ ] Add retry logic for failed Graph API calls
- [x] Implement skeleton loading states
- [x] Show clear error messages for permission issues
- [x] Add "Connect Microsoft 365" button for email users
- [x] Add "Reconnect Microsoft 365" button when token expires
- [ ] Cache Microsoft 365 data for offline viewing

### 6. Expand Microsoft 365 Features
**Time Estimate:** 8 hours

- [ ] **OneDrive/SharePoint**: File browser and search
- [ ] **Teams Channels**: Show channel messages (not just chats)
- [ ] **Contacts**: Microsoft 365 directory
- [ ] **Tasks**: Microsoft To-Do integration
- [ ] **Presence**: User availability status

### 7. Security Hardening
**Time Estimate:** 6 hours

- [ ] Encrypt tokens at rest in database
- [ ] Implement rate limiting for Graph API calls
- [ ] Add audit logging for all Microsoft 365 data access
- [ ] Review and minimize permission scopes (least privilege)
- [ ] Add CSRF protection for OAuth flow

---

## 🟢 MEDIUM PRIORITY (Week 2)

### 8. Two-Way Sync Capabilities
**Time Estimate:** 12 hours

- [ ] Create calendar events from OberaConnect
- [ ] Send emails from platform
- [ ] Upload files to OneDrive/SharePoint
- [ ] Post messages to Teams channels
- [ ] Update user presence/status

### 9. Testing & Validation
**Time Estimate:** 8 hours

- [ ] Test with multiple user accounts
- [ ] Validate all permissions work correctly
- [ ] Test token refresh flows
- [ ] Load testing for Graph API rate limits
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

### 10. Monitoring & Observability
**Time Estimate:** 4 hours

- [ ] Set up error tracking (Sentry/similar)
- [ ] Configure Graph API error alerts
- [ ] Add performance monitoring
- [ ] Create dashboard for API usage metrics
- [ ] Set up automated health checks

---

## 🔵 FUTURE ENHANCEMENTS (Week 3+)

### 11. Advanced Integrations
- [ ] **Power Automate**: Trigger flows from OberaConnect
- [ ] **Power BI**: Embed reports and dashboards
- [ ] **Azure AD Groups**: Group management, user provisioning
- [ ] **Microsoft Forms**: Embed and collect responses
- [ ] **SharePoint Lists**: CRUD operations on lists

### 12. Production Deployment
- [ ] Move from dev Azure app to production app
- [ ] Configure production redirect URIs
- [ ] Set up CI/CD pipeline
- [ ] Create deployment runbook
- [ ] Document customer onboarding process

### 13. Documentation & Training
- [ ] Create user guide for Microsoft 365 features
- [ ] Document setup process for new customers
- [ ] Create video tutorials
- [ ] Write API integration guide for developers

---

## 📊 Success Metrics

- [ ] All Microsoft 365 features working without errors
- [ ] Token refresh success rate > 99%
- [ ] Page load time < 2 seconds
- [ ] Zero 401/403 permission errors
- [ ] User satisfaction score > 4.5/5

---

## 🚀 Quick Start Checklist

Before developers can work on features 5-13, these MUST be completed:

- [ ] **Azure provider enabled in Lovable Cloud (Item #1) - CRITICAL**
- [ ] Azure AD permissions granted (Item #2)
- [x] User profiles database fixed (Item #3)  
- [ ] Token persistence working (Item #4)
- [ ] At least one successful Microsoft 365 sign-in tested
- [ ] All Graph API endpoints returning 200 status

**Next Immediate Action:** Enable Azure provider in Lovable Cloud backend

---

## 📞 Need Help?

- **Azure Issues**: Contact your Azure AD administrator
- **Database Issues**: Check `supabase/migrations/` for latest changes
- **Token Issues**: Review `supabase/functions/graph-api/index.ts`
- **Frontend Issues**: Check `src/components/Microsoft365Integration.tsx`

**Documentation**: See `MICROSOFT365_INTEGRATION.md` for detailed technical specs
