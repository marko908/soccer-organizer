# Supabase Password Reset Email Setup

## Problem
Password reset emails not being sent or reset link not working.

## Solution

### Step 1: Configure Redirect URLs

Go to **Supabase Dashboard → Authentication → URL Configuration**

Make sure these URLs are in the **Redirect URLs** list:
```
https://soccer-organizer.vercel.app/**
https://soccer-organizer.vercel.app/auth/reset-password
http://localhost:3000/**
http://localhost:3000/auth/reset-password
```

### Step 2: Update Password Reset Email Template

Go to **Supabase Dashboard → Authentication → Email Templates → Change Email**

Replace the template with:

```html
<h2>Reset Your Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

**IMPORTANT:** Use `{{ .ConfirmationURL }}` - this generates the proper reset link with session token.

### Step 3: Verify Email Provider Settings

Go to **Supabase Dashboard → Project Settings → Auth**

Check that:
1. **Email confirmation** is enabled
2. **SMTP settings** are configured (or using Supabase's default email service)

### Step 4: Test the Flow

1. Go to your profile page
2. Click "Change Password"
3. Check your email inbox (and spam folder)
4. Click the reset link
5. Enter new password
6. Should redirect to dashboard

## Troubleshooting

### Email not arriving?
- Check spam/junk folder
- Verify email provider settings in Supabase
- Check Supabase logs: Dashboard → Logs → Auth Logs

### Reset link shows error?
- Make sure redirect URL is in the allowed list
- Check browser console for error messages
- Verify `/auth/reset-password` page exists

### "Invalid or expired reset link"?
- Reset links expire after 1 hour
- Request a new reset email
- Make sure you're using the latest link

## Current Setup

**Production URL:** `https://soccer-organizer.vercel.app`
**Local Dev URL:** `http://localhost:3000`
**Reset Page:** `/auth/reset-password`
