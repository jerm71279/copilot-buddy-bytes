# Microsoft 365 SSO Authentication Setup Guide

## Overview

This guide explains how to configure Microsoft 365 Single Sign-On (SSO) for OberaConnect platform authentication. Users will authenticate to the OberaConnect platform using their Microsoft 365 credentials via Azure AD OAuth.

**Important:** This is different from the Microsoft 365 integration features (Graph API). This guide focuses on using Microsoft 365 for user authentication/login.

---

## Architecture Flow

```
┌─────────────────────┐
│   User visits       │
│   OberaConnect      │
│   /auth page        │
└──────────┬──────────┘
           │
           │ 1. Clicks "Sign in with Microsoft 365"
           ▼
┌─────────────────────┐
│  Lovable Cloud      │
│  Backend (Supabase) │
│  Initiates OAuth    │
└──────────┬──────────┘
           │
           │ 2. Redirects to Microsoft
           ▼
┌─────────────────────┐
│  Azure AD           │
│  Login Screen       │
│  (login.microsoft-  │
│   online.com)       │
└──────────┬──────────┘
           │
           │ 3. User enters Microsoft credentials
           │ 4. Consents to permissions
           ▼
┌─────────────────────┐
│  Azure AD           │
│  Returns auth code  │
└──────────┬──────────┘
           │
           │ 5. Redirects to callback URL
           ▼
┌─────────────────────┐
│  Lovable Cloud      │
│  Exchanges code for │
│  access token       │
└──────────┬──────────┘
           │
           │ 6. Creates user session
           │ 7. Stores provider token
           ▼
┌─────────────────────┐
│  User redirected to │
│  OberaConnect /portal│
│  (authenticated)    │
└─────────────────────┘
```

---

## Prerequisites

Before you begin, you need:

1. **Azure AD Tenant** - Your organization's Microsoft 365 tenant
2. **Global Administrator Access** - To create app registrations
3. **OberaConnect Project** - With Lovable Cloud backend enabled
4. **Basic OAuth Understanding** - Helpful but not required

---

## Part 1: Azure AD App Registration

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**

### Step 2: Configure App Registration

Fill in the following details:

**Name:**
```
OberaConnect Production
```
or
```
OberaConnect Development
```

**Supported account types:**
- **Single tenant** (Recommended for production): Only your organization
- **Multi-tenant**: Any Azure AD directory (for MSP scenarios)
- **Personal Microsoft accounts**: Not recommended for business use

**Redirect URI:**
- Leave blank for now (you'll get this from Lovable Cloud)

Click **Register**

### Step 3: Note Your App Credentials

After registration, you'll see the **Overview** page. Copy these values:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Save these** - you'll need them in the next section.

### Step 4: Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `OberaConnect Production Secret`
4. Select expiration: **24 months** (recommended)
5. Click **Add**

**CRITICAL:** Copy the **Value** immediately - it won't be shown again!

```
Client Secret Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Part 2: Lovable Cloud Backend Configuration

### Step 1: Access Backend Settings

1. Open your OberaConnect project in Lovable
2. Click the backend icon or navigate to **Users** → **Auth Settings**
3. Find **Azure** provider section

### Step 2: Enable Azure Provider

1. Toggle **Enable Azure Provider** to ON
2. The interface will expand to show configuration fields

### Step 3: Configure Azure Provider

Enter the credentials from Part 1:

**Azure Client ID:**
```
Paste your Application (client) ID
```

**Azure Client Secret:**
```
Paste your Client Secret Value
```

**Azure Tenant (Optional):**
```
Paste your Directory (tenant) ID (recommended for single-tenant apps)
```

**Important Notes:**
- Leaving tenant blank makes it multi-tenant
- For single organization use, always specify tenant ID
- This improves security and performance

### Step 4: Copy Redirect URI

After saving, Lovable Cloud will display your **Redirect URI**. It looks like:

```
https://olrpexessehcijdvogxo.supabase.co/auth/v1/callback
```

**Copy this URL** - you need it for the next step.

---

## Part 3: Configure Azure AD Redirect URI

### Step 1: Return to Azure Portal

1. Go back to your app registration in Azure Portal
2. Click **Authentication** in the left menu

### Step 2: Add Redirect URI

1. Click **Add a platform**
2. Select **Web**
3. Enter the redirect URI from Lovable Cloud:

```
https://olrpexessehcijdvogxo.supabase.co/auth/v1/callback
```

4. **DO NOT** check any boxes under **Implicit grant**
5. Click **Configure**

### Step 3: Configure Additional Settings

**Front-channel logout URL:** (optional)
```
https://yourdomain.com/auth
```

**ID tokens:** Check this box
- This enables OpenID Connect flow

Click **Save**

---

## Part 4: Configure API Permissions

### Step 1: Add Permissions

1. In your app registration, click **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**

### Step 2: Required Permissions

Add these permissions:

**Basic Profile:**
- `openid` - Sign users in
- `email` - View users' email address
- `profile` - View users' basic profile

**Optional (for Microsoft 365 Integration):**
- `User.Read` - Read user profile
- `Calendars.Read` - Read user calendars
- `Mail.Read` - Read user email
- `Chat.Read` - Read Teams chats
- `Files.Read.All` - Read user files

Click **Add permissions**

### Step 3: Grant Admin Consent

**CRITICAL FOR PRODUCTION:**

1. Click **Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm

**Why this matters:**
- Without admin consent, each user sees a consent screen
- This can confuse or block users
- Required for Graph API scopes

---

## Part 5: Update OberaConnect Code

### Step 1: Verify Auth Page Implementation

The authentication code is already in `src/pages/Auth.tsx`:

```typescript
const handleMicrosoftSignIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'openid email profile User.Read Calendars.Read Mail.Read Files.Read.All Chat.Read',
      redirectTo: `${window.location.origin}/portal`,
    }
  });

  if (error) {
    console.error('Microsoft sign-in error:', error);
    toast({
      title: "Sign-in failed",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

**No code changes needed** - this is already implemented!

### Step 2: Verify Scopes Match Permissions

Ensure the `scopes` in the code match what you granted in Azure AD:

```typescript
scopes: 'openid email profile User.Read Calendars.Read Mail.Read Files.Read.All Chat.Read'
```

If you didn't add Graph API permissions, use minimal scopes:

```typescript
scopes: 'openid email profile'
```

### Step 3: Verify Redirect URL

Check that `redirectTo` matches your application:

**Development:**
```typescript
redirectTo: `${window.location.origin}/portal`
```

**Production (if using custom domain):**
```typescript
redirectTo: 'https://yourdomain.com/portal'
```

---

## Part 6: Test the Authentication Flow

### Step 1: Test Sign-In

1. Navigate to `/auth` page
2. Click **"Sign in with Microsoft 365"** button
3. You should be redirected to Microsoft login

### Step 2: Verify Microsoft Login

1. Enter your Microsoft 365 credentials
2. If prompted, accept permissions (first-time only)
3. You should be redirected back to OberaConnect `/portal`

### Step 3: Verify User Session

Open browser console and check:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// Verify provider
console.log('Provider:', user?.app_metadata?.provider) // Should be 'azure'

// Check if profile was created
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()
console.log('Profile:', profile)
```

---

## Part 7: Production Deployment

### Step 1: Add Production Redirect URI

When deploying to production domain:

1. Return to Azure AD app registration
2. Go to **Authentication**
3. Add production redirect URI:

```
https://yourdomain.com/auth/v1/callback
```

### Step 2: Update Site URL in Lovable Cloud

1. Open Lovable Cloud backend
2. Navigate to **Users** → **Auth Settings** → **General**
3. Set **Site URL** to:

```
https://yourdomain.com
```

### Step 3: Add Production Domain to Redirect URLs

Add production callback URL:

```
https://yourdomain.com/portal
```

---

## Troubleshooting

### Error: "Unsupported provider: provider is not enabled"

**Cause:** Azure provider not enabled in Lovable Cloud

**Fix:**
1. Open Lovable Cloud backend
2. Navigate to Users → Auth Settings → Azure
3. Toggle **Enable Azure Provider** to ON
4. Enter Client ID and Secret
5. Save changes

---

### Error: "Invalid redirect URI"

**Cause:** Mismatch between Azure AD and Lovable Cloud redirect URI

**Fix:**
1. Copy the exact redirect URI from Lovable Cloud
2. Go to Azure AD app registration → Authentication
3. Ensure the URI matches **exactly** (including https://)
4. Save in Azure AD

---

### Error: "AADSTS50011: Redirect URI mismatch"

**Cause:** Code specifies different redirectTo than configured

**Fix:**
1. Check `src/pages/Auth.tsx` → `handleMicrosoftSignIn`
2. Ensure `redirectTo` matches your domain
3. Add this exact URL to Azure AD → Authentication → Redirect URIs

---

### Error: "Admin approval required"

**Cause:** Admin consent not granted for API permissions

**Fix:**
1. Go to Azure AD app registration → API permissions
2. Click **Grant admin consent for [Organization]**
3. Confirm by clicking Yes

---

### Users Stuck on Consent Screen

**Cause:** Admin consent not granted, or user lacks permissions

**Fix:**
1. Grant admin consent (see above)
2. Verify user has required licenses (M365, Teams, etc.)
3. Check user is in correct tenant

---

### No User Profile Created

**Cause:** User profile trigger not working for OAuth users

**Fix:**
Check if `handle_new_user_profile()` function exists and handles OAuth:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name text;
BEGIN
  -- Extract user information from metadata (works for both email and OAuth)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_full_name,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
```

---

## Security Best Practices

### 1. Client Secret Management

**DO:**
- Store secrets in Lovable Cloud backend (never in code)
- Rotate secrets every 12-24 months
- Use separate secrets for dev/staging/prod

**DON'T:**
- Commit secrets to Git
- Share secrets in emails or chat
- Use same secret across environments

### 2. Redirect URI Validation

**DO:**
- Use exact, specific redirect URIs
- Use HTTPS in production
- Validate redirect_uri parameter server-side

**DON'T:**
- Use wildcards in redirect URIs
- Allow HTTP in production
- Skip redirect URI validation

### 3. Token Management

**DO:**
- Store tokens server-side (Supabase handles this)
- Implement token refresh
- Set appropriate token expiration

**DON'T:**
- Expose tokens in client-side code
- Store tokens in localStorage (Supabase manages this)
- Use tokens beyond their expiration

### 4. Permission Scopes

**DO:**
- Request only necessary scopes
- Grant admin consent for business apps
- Review permissions periodically

**DON'T:**
- Request excessive permissions
- Leave consent to individual users
- Add permissions without review

---

## Multi-Tenant Configuration

For MSPs managing multiple client tenants:

### Option 1: Single Multi-Tenant App

**Pros:**
- One app registration to manage
- Works across all customer tenants
- Simpler configuration

**Cons:**
- Requires admin consent in each tenant
- Less control per tenant

**Setup:**
1. Create app registration
2. Select **Accounts in any organizational directory**
3. Each customer tenant admin grants consent
4. Users from any tenant can sign in

### Option 2: Per-Tenant Apps

**Pros:**
- Full control per customer
- Separate credentials per tenant
- Better isolation

**Cons:**
- More complex to manage
- Separate app registrations needed

**Setup:**
1. Create app registration in each customer tenant
2. Use tenant-specific Client ID/Secret
3. Implement tenant selection logic

---

## Monitoring and Analytics

### Key Metrics to Track

1. **Authentication Success Rate**
   - Monitor failed vs successful logins
   - Track error types (invalid_grant, etc.)

2. **Token Refresh Success**
   - Monitor refresh token failures
   - Track token expiration rates

3. **User Adoption**
   - % users using Microsoft SSO vs email/password
   - Active Microsoft SSO users

### Logging

Enable audit logging for:
- Successful authentications
- Failed authentication attempts
- Token refreshes
- Permission grants

---

## Advanced Configuration

### Custom Claims

Add custom claims to tokens:

**In Azure AD:**
1. Go to **Token configuration**
2. Click **Add optional claim**
3. Select claim type and claims
4. Save

**Access in OberaConnect:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user.user_metadata)
```

### Conditional Access

Implement Azure AD Conditional Access:

1. Go to Azure AD → **Security** → **Conditional Access**
2. Create new policy
3. Configure conditions:
   - User/Group
   - Location
   - Device platform
4. Set access controls:
   - Require MFA
   - Require compliant device

---

## Next Steps

After SSO is working:

1. **Test with Multiple Users**
   - Verify different user types work
   - Test first-time vs returning users
   - Check profile creation

2. **Implement Microsoft 365 Integration**
   - Enable Graph API features
   - Add calendar, email, Teams integration
   - See `MICROSOFT365_INTEGRATION.md`

3. **Configure RBAC**
   - Map Azure AD groups to OberaConnect roles
   - Implement role-based access
   - See role management documentation

4. **Production Hardening**
   - Enable Conditional Access
   - Implement MFA requirements
   - Configure token lifetimes

---

## Support Resources

### Documentation
- [Microsoft identity platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure AD app registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Supabase Auth with Azure](https://supabase.com/docs/guides/auth/social-login/auth-azure)

### Testing Tools
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
- [JWT.io](https://jwt.io) - Decode tokens
- [Azure AD token validator](https://jwt.ms)

### Common Issues
- Check `MICROSOFT365_INTEGRATION.md` troubleshooting section
- Review Lovable Cloud backend logs
- Check Azure AD sign-in logs

---

## Summary Checklist

- [ ] Create Azure AD app registration
- [ ] Copy Client ID and Secret
- [ ] Enable Azure provider in Lovable Cloud
- [ ] Add credentials to Lovable Cloud
- [ ] Copy redirect URI from Lovable Cloud
- [ ] Add redirect URI to Azure AD
- [ ] Configure API permissions
- [ ] Grant admin consent
- [ ] Test authentication flow
- [ ] Verify user profile creation
- [ ] Add production redirect URIs
- [ ] Document credentials securely
- [ ] Train users on SSO flow

**Authentication is now configured! Users can sign in with Microsoft 365.**
