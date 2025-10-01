# Supabase Email Configuration Guide

## Problem
Users are not receiving confirmation emails after registration.

## Solution

### 1. Configure Email Settings in Supabase Dashboard

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set the **Site URL** to: `http://localhost:3000` (for local dev) or your production URL
5. Add **Redirect URLs**:
   - `http://localhost:3000/auth/confirm` (local)
   - `https://yourdomain.com/auth/confirm` (production)

### 2. Enable Email Confirmation

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure **Enable email confirmations** is checked
3. (Optional) Customize email templates in **Authentication** → **Email Templates**

### 3. For Development: Use Supabase Inbucket

If you're developing locally and don't want to set up SMTP:

1. Go to **Project Settings** → **API**
2. Find the **Inbucket URL** (looks like: `https://[project-ref].supabase.co/project/[project-id]/inbucket/v1`)
3. When you register locally, check this URL to see confirmation emails
4. Click the confirmation link in the email

### 4. For Production: Configure SMTP (Optional)

If you want to use your own email service (Gmail, SendGrid, etc.):

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Enable Custom SMTP**
3. Fill in your SMTP details:
   - **Host**: `smtp.gmail.com` (for Gmail)
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your email
   - **Password**: Your app password (NOT your regular password!)
   - **Sender email**: The "from" address
   - **Sender name**: Display name

### 5. Test Email Confirmation

1. Register a new account
2. You should see the "Check your email" screen
3. For local development:
   - Check the Supabase Inbucket (see step 3 above)
   - Click the confirmation link
4. For production:
   - Check your actual email inbox
   - Click the confirmation link
5. You should be redirected to `/auth/confirm` with a success message
6. You can now log in with your verified account

## Current Implementation

✅ Registration now shows email confirmation screen
✅ Email redirect URL configured: `/auth/confirm`
✅ User profile created with `email_verified: false`
✅ Confirmation page exists at `/app/auth/confirm/page.tsx`

## Troubleshooting

### No emails in Supabase Inbucket?
- Make sure you're using the correct project in Supabase
- Check that email confirmations are enabled
- Try registering with a different email

### Emails going to spam?
- Use a custom SMTP provider with proper SPF/DKIM records
- Or use a transactional email service (SendGrid, Mailgun, etc.)

### "Email link is invalid or has expired"?
- Email confirmation links expire after 24 hours by default
- Register again to get a new link
- Or configure expiry time in **Authentication** → **Email Templates**

### User can't log in after clicking confirmation link?
- Check that `email_verified` was set to `true` in the database
- Run this query in SQL Editor:
  ```sql
  SELECT id, email, email_verified FROM auth.users WHERE email = 'user@example.com';
  ```
- If `email_verified` is still `false`, manually update:
  ```sql
  UPDATE auth.users SET email_verified = true WHERE email = 'user@example.com';
  ```

## Important Notes

- **Local Development**: Use Supabase Inbucket (no SMTP needed)
- **Production**: Configure custom SMTP or use Supabase's default email service
- **Email Templates**: Can be customized in Supabase Dashboard
- **Rate Limits**: Be aware of Supabase's email sending limits on free tier

## Related Files

- `contexts/AuthContext.tsx` - Registration with email confirmation
- `app/register/page.tsx` - Shows email confirmation screen
- `app/auth/confirm/page.tsx` - Handles email confirmation callback
- `app/login/page.tsx` - Login only works after email verification
