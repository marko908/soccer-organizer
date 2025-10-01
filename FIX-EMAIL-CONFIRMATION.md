# Fix Email Confirmation Link

## Problem
Clicking the email confirmation link shows: `{"error":"requested path is invalid"}`

## Solution

### Step 1: Configure Redirect URLs in Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** (left sidebar)
3. Click **URL Configuration**
4. Configure these settings:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs** (add all of these):
```
http://localhost:3000/**
http://localhost:3000/auth/confirm
http://localhost:3000/auth/callback
https://your-production-domain.com/**
https://your-production-domain.com/auth/confirm
```

5. Click **Save**

### Step 2: Update Email Template (Optional)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Make sure the confirmation URL uses the correct redirect:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your account:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>
```

4. Click **Save**

### Step 3: Test Again

1. **Delete the current test user** (if they weren't verified):
   ```sql
   DELETE FROM auth.users WHERE email = 'your-test-email@example.com';
   DELETE FROM users WHERE email = 'your-test-email@example.com';
   ```

2. **Register again** with the same email
3. Click the confirmation link in your email
4. Should redirect to `/auth/confirm` successfully!

## Alternative: Check Current Confirmation Page

Make sure `/app/auth/confirm/page.tsx` exists and handles the token properly.

## If Still Not Working

Try accessing the confirmation link in an **incognito/private browser window** to avoid cached session issues.
