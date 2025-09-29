# Deployment Guide

## Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Soccer organizer app ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Next.js settings

3. **Environment Variables:**
   Add these in Vercel dashboard:
   ```
   DATABASE_URL=file:./dev.db
   JWT_SECRET=your-super-secret-jwt-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   ```

4. **Database Setup:**
   For production, consider upgrading to:
   - PostgreSQL (free tier: Railway, Supabase)
   - Update DATABASE_URL accordingly

## Alternative: Railway

1. **Connect GitHub:**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository
   - Auto-deploys on push

2. **Add Environment Variables:**
   Same as Vercel list above

## Notes:
- SQLite works for testing but PostgreSQL recommended for production
- Stripe test keys work for development
- Enable Prisma generate in build process