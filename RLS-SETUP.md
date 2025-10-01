# Row Level Security (RLS) Setup Guide

This guide explains how to set up Row Level Security for your Foothub application.

## Prerequisites

- Supabase project created
- Tables created (`organizers`, `events`, `participants`)

## Step 1: Get Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (⚠️ **Keep this secret!**)
4. Copy the key

## Step 2: Add Service Role Key to Environment Variables

### Local Development (.env.local)
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Production (Vercel)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your service role key from Supabase
   - **Environment:** Production, Preview, Development

## Step 3: Apply RLS Policies

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-rls-policies.sql` in your project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

## Step 4: Verify RLS is Enabled

Run this query in SQL Editor to check RLS status:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

## Step 5: View Active Policies

Run this query to see all active RLS policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## What RLS Policies Were Applied?

### Organizers Table
- ✅ Users can view their own profile
- ✅ Users can update their own profile (except role/approval status)
- ✅ Admins can view all organizers
- ✅ Admins can update any organizer

### Events Table
- ✅ Anyone can view events (public listing)
- ✅ Only approved organizers can create events
- ✅ Organizers can update/delete their own events

### Participants Table
- ✅ Anyone can view participants
- ✅ Anyone can join events (payment handled by Stripe)
- ✅ Event organizers can remove participants from their events
- ✅ Payment status updates allowed (for Stripe webhooks)

## Security Benefits

1. **Data Isolation**: Users can only access their own data
2. **Admin Control**: Admins have elevated privileges for management
3. **Public Safety**: Events are public but modifications are restricted
4. **Payment Security**: Stripe webhooks can update payment status securely
5. **Approval Workflow**: Only verified and approved organizers can create events

## Important Notes

### Service Role Key vs Anon Key

- **Anon Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY):
  - Used by clients (browsers)
  - Subject to RLS policies
  - Safe to expose publicly

- **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY):
  - Used by server-side code only
  - Bypasses ALL RLS policies
  - ⚠️ **NEVER expose to clients**
  - Only used in:
    - `lib/supabase-admin.ts`
    - Stripe webhooks (`app/api/webhook/route.ts`)
    - Admin operations (`app/api/admin/*`)

### When to Use Service Role Key

Use `supabaseAdmin` (service_role) for:
- ✅ Stripe webhooks updating payment status
- ✅ Admin operations that need to bypass RLS
- ✅ System operations (migrations, maintenance)

Use `supabase` or `createServerSupabaseClient()` (anon key) for:
- ✅ Regular user operations
- ✅ Frontend queries
- ✅ User authentication

## Troubleshooting

### "new row violates row-level security policy"
- This means RLS is blocking an operation
- Check if the user is authenticated
- Check if the user has the required permissions (e.g., admin_approved = true)

### Webhook failing to update payment status
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables
- Verify `app/api/webhook/route.ts` uses `supabaseAdmin` not `supabase`

### Users can't create events
- Check if user's `email_verified = true` and `admin_approved = true` in organizers table
- RLS policy requires both conditions to be met

## Testing RLS

You can test RLS policies by:

1. **Create test users** with different roles:
   ```sql
   -- View user's role
   SELECT id, email, role, email_verified, admin_approved
   FROM organizers
   WHERE email = 'test@example.com';
   ```

2. **Try operations** that should fail:
   - Non-admin user trying to view all organizers
   - Non-approved organizer trying to create event
   - User trying to update another user's event

3. **Verify service role works**:
   - Test Stripe webhook locally
   - Test admin approval endpoint

## Further Reading

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
