# Fix Supabase Email Confirmation Template

## Problem
Email confirmation links have no parameters (`token_hash: null, type: null`)

## Solution

### Step 1: Check Email Template Settings

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** → **Email Templates**
3. Select **Confirm signup** template

### Step 2: Update the Template

Replace the entire template with this:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
```

**IMPORTANT:** Use `{{ .ConfirmationURL }}` - this automatically generates the correct URL with the `code` parameter for PKCE flow.

### Step 3: Alternative (if above doesn't work)

If the above doesn't work, try this format:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email address</a></p>
```

### Step 4: Save and Test

1. Click **Save**
2. Delete the test user from Authentication → Users
3. Register a new account
4. Check the new confirmation email
5. The link should now have the `code` parameter:
   ```
   https://soccer-organizer.vercel.app/auth/confirm?code=xxxxx
   ```

## Current Configuration

**Site URL:** `https://soccer-organizer.vercel.app`

**Redirect URLs:**
- `https://soccer-organizer.vercel.app/**`
- `https://soccer-organizer.vercel.app/auth/confirm`
- `http://localhost:3000/**`
- `http://localhost:3000/auth/confirm`
