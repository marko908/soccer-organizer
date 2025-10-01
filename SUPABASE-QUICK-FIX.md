# Quick Fix for Registration Issues

## Problems:
1. ❌ Registration gets stuck at "Creating account..."
2. ❌ User created in `auth.users` but NOT in `users` table
3. ❌ Confirmation link shows: "No API key found in request"

## Solutions:

### 1. Fix RLS Policies (Allow Profile Creation)

**Run this in Supabase SQL Editor:**
```sql
-- File: supabase-fix-registration-rls.sql
-- Copy and paste the entire file content
```

This adds the missing `INSERT` policy that allows users to create their own profile during registration.

### 2. Fix Email Confirmation URL

**In Supabase Dashboard:**

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (or your actual port)
3. Add **Redirect URLs** (add both):
   - `http://localhost:3000/**`
   - `http://localhost:3004/**`
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3004/auth/confirm`

### 3. Update Email Template (Optional but Recommended)

**In Supabase Dashboard:**

1. Go to **Authentication** → **Email Templates** → **Confirm signup**
2. Replace the template with:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your account:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
```

This ensures the link includes all required parameters.

### 4. Test Registration Again

1. **Delete the test user** from Supabase (if exists):
   - Go to **Authentication** → **Users**
   - Find your test user and delete it
   - Or run in SQL Editor:
     ```sql
     DELETE FROM auth.users WHERE email = 'your-test@email.com';
     ```

2. **Register again** with the same email
3. You should now see:
   - ✅ User created in `auth.users`
   - ✅ User profile created in `users` table
   - ✅ "Check your email" screen appears
   - ✅ Confirmation link works properly

## Verify It's Working:

### Check in Supabase Dashboard:

**Step 1: Auth Users**
- Go to **Authentication** → **Users**
- You should see your user with status "Waiting for verification"

**Step 2: Users Table**
- Go to **Table Editor** → **users**
- You should see a row with:
  - Same UUID as auth user
  - full_name, nickname populated
  - email_verified = false
  - role = 'USER'
  - can_create_events = false

**Step 3: After Clicking Email Link**
- Auth user status changes to "Verified"
- You can now log in successfully

## Still Having Issues?

### Check Browser Console for Errors:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try registering again
4. Look for errors like:
   - "new row violates row-level security policy"
   - "permission denied for table users"
   - "duplicate key value violates unique constraint"

### Manual Fix (If Needed):

If a user exists in `auth.users` but not in `users` table, manually create the profile:

```sql
-- Replace with actual values
INSERT INTO users (
  id,
  email,
  full_name,
  nickname,
  role,
  email_verified,
  can_create_events,
  avatar_url
)
SELECT
  id,
  email,
  'Your Name',  -- Change this
  'yournick',   -- Change this
  'USER',
  email_confirmed_at IS NOT NULL,
  false,
  '/default-avatar.svg'
FROM auth.users
WHERE email = 'your@email.com'  -- Change this
AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = auth.users.id);
```

## Common Errors and Solutions:

### "new row violates row-level security policy"
→ Run `supabase-fix-registration-rls.sql`

### "duplicate key value violates unique constraint"
→ Email or nickname already exists, try different values

### "No API key found in request"
→ Fix redirect URLs in Supabase Dashboard (step 2 above)

### Registration completes but can't log in
→ Email not verified yet, check your inbox and click confirmation link
