# Deployment Guide

## Deploy to Vercel (Recommended)

### 1. Prerequisites

- GitHub account with your code pushed
- Supabase account with database set up
- Stripe account with API keys

### 2. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your `foothub` repository
5. Vercel will auto-detect Next.js settings

### 4. Configure Environment Variables

Add these in Vercel Project Settings → Environment Variables:

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Stripe:**
```
STRIPE_PUBLISHABLE_KEY=pk_live_your_key (or pk_test_ for testing)
STRIPE_SECRET_KEY=sk_live_your_key (or sk_test_ for testing)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Authentication:**
```
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_SETUP_KEY=your-admin-setup-key
```

**Application:**
```
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 5. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/webhook`
4. Listen to events: `checkout.session.completed`
5. Copy the webhook signing secret and add it to Vercel environment variables

### 6. Deploy

Click "Deploy" in Vercel - your app will be live in minutes!

## Database Management

Your Supabase database is production-ready:
- Automatic backups
- Connection pooling
- Built-in authentication (optional)
- Real-time subscriptions (if needed)

Manage your database through:
- Supabase Dashboard → Table Editor
- SQL Editor for custom queries
- API auto-generated from your schema

## Post-Deployment

### Create First Admin User

1. Visit `https://your-app.vercel.app/setup-admin`
2. Use your `ADMIN_SETUP_KEY` to create the first admin
3. This admin can then approve new organizers

### Monitor

- **Vercel Dashboard:** Deployment logs, analytics
- **Supabase Dashboard:** Database queries, API usage
- **Stripe Dashboard:** Payments, webhooks

## Troubleshooting

### Build Fails
- Check all environment variables are set in Vercel
- Verify Supabase credentials are correct
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Review Supabase logs for errors

### Stripe Webhooks Not Working
- Verify webhook endpoint URL matches your deployment
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Test webhooks using Stripe CLI or dashboard test mode

## Alternative: Railway

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add the same environment variables as Vercel
4. Auto-deploys on push

## Notes

- Supabase free tier is sufficient for MVP
- Use Stripe test mode during development
- Switch to production Stripe keys when ready to accept real payments
- Consider setting up monitoring (Sentry, LogRocket, etc.)