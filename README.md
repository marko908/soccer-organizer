# Foothub ⚽

> A modern, full-stack soccer event management platform with integrated payment processing and real-time features.

**Live Demo:** [https://soccer-organizer.vercel.app](https://soccer-organizer.vercel.app)

## 📋 Overview

Foothub is a pay-to-play soccer game organization web application that simplifies the process of creating, managing, and joining soccer events. Built with modern web technologies, it handles everything from user authentication to payment processing, making it easy for organizers to collect payments and for players to secure their spots.

## ✨ Key Features

- **🔐 User Authentication**: Secure authentication with Supabase Auth (SSR)
- **👤 User Profiles**: Complete profile system with avatars, bio, and stats
- **🌐 Public Profiles**: Shareable profiles at `/u/[username]`
- **⚽ Event Management**: Create and manage soccer events with customizable details
- **💳 Payment Processing**: Integrated Stripe checkout with BLIK support for Polish users
- **⚡ Real-time Updates**: Live participant lists and event chat powered by Supabase Realtime
- **🔒 Permission System**: Admin-controlled event creation permissions
- **🎨 Modern UI**: Responsive design with Tailwind CSS
- **🌍 Multi-language**: Support for Polish and English

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router, React Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth with SSR (cookie-based sessions)
- **Real-time**: Supabase Realtime (WebSocket)
- **Payment Processing**: Stripe API with webhook integration

### Security & DevOps
- **Database Security**: Row Level Security (RLS) policies
- **Deployment**: Vercel (CI/CD)
- **Environment Management**: Environment variables with validation

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe Keys
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Admin Setup
ADMIN_SETUP_KEY="your-admin-setup-key"

# Next.js URL (for webhooks)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Enable BLIK in your Stripe settings (Payment Methods)
4. Set up a webhook endpoint pointing to `http://localhost:3000/api/webhook` (or your domain)
5. Configure the webhook to listen for `checkout.session.completed` events

### 4. Database Setup

1. Create a [Supabase account](https://supabase.com)
2. Create a new project
3. Get your credentials from Settings → API:
   - Project URL
   - `anon` / `public` key
   - `service_role` key (⚠️ keep secret!)
4. Add the credentials to your `.env.local` file
5. Configure Supabase email templates:
   - Authentication → Email Templates
   - Update confirmation and password reset templates
6. Add redirect URLs:
   - Authentication → URL Configuration
   - Add your domain (e.g., `https://your-app.vercel.app/**`)

### 5. Seed Sample Users (Optional)

```bash
node scripts/seed-users.js
```

This creates 15 test users. See `scripts/README.md` for details.

### 6. Run the Application

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Registration

1. Visit `/register`
2. Fill in: Full Name, Nickname, Email, Phone (optional), Password
3. Confirm email via Supabase email
4. Login and complete your profile at `/profile`

### Creating an Event

1. Get `can_create_events` permission from admin
2. Visit `/create`
3. Fill in event details:
   - Name (e.g., "Friday Soccer at Orlik")
   - Date & Time
   - Location
   - Total Cost (e.g., 200 PLN)
   - Max Players (e.g., 14)
4. Price per player is automatically calculated
5. Share the generated event URL with players

### Joining an Event

1. Visit the event URL `/event/[id]`
2. View event details and current participants
3. Click "Pay & Sign Up"
4. Enter your details (auto-filled if logged in)
5. Complete payment via Stripe (supports BLIK)
6. Your spot is secured upon successful payment

### Public Profiles

View any user's profile at `/u/[username]`:
- `/u/johnny_goals`
- `/u/admin_mike`

## File Structure

```
├── app/
│   ├── api/
│   │   ├── admin/              # Admin & user management
│   │   ├── simple-*            # Event & participant CRUD
│   │   ├── create-checkout/    # Stripe checkout session
│   │   ├── webhook/            # Stripe webhook handler
│   │   └── profile/            # User profile management
│   ├── auth/
│   │   ├── confirm/            # Email confirmation page
│   │   └── reset-password/     # Password reset page
│   ├── u/[username]/           # Public user profiles
│   ├── create/                 # Event creation page
│   ├── dashboard/              # User dashboard
│   ├── event/[id]/             # Dynamic event display
│   ├── profile/                # User profile page
│   ├── admin/                  # Admin panel
│   └── page.tsx                # Homepage
├── lib/
│   ├── supabase.ts             # Client-side Supabase client
│   ├── supabase-server.ts      # Server-side Supabase client (SSR)
│   ├── supabase-admin.ts       # Admin client with service_role key
│   └── stripe.ts               # Stripe client setup
├── components/                 # React components
├── contexts/                   # React contexts (Auth, Language)
├── scripts/                    # Utility scripts (seed users)
├── middleware.ts               # Supabase SSR session sync
└── public/                     # Static assets
```

## Database Schema

### Users (formerly `organizers`)
- `id`: UUID (references `auth.users.id`)
- `email`: User email (unique)
- `full_name`: User's full name
- `nickname`: Username (unique, case-insensitive)
- `phone`: Phone number (optional)
- `avatar_url`: Profile picture URL
- `bio`: User biography
- `age`, `weight`, `height`: Profile stats
- `role`: TEXT ('ADMIN' | 'USER')
- `can_create_events`: Boolean (admin-controlled)
- `email_verified`: Boolean
- `phone_verified`: Boolean
- `created_at`, `updated_at`: Timestamps

**RLS Policies:**
- Public profiles viewable by everyone
- Users can view/update their own profile
- Admins can view/update all users
- Role and permissions protected from self-modification

### Events
- `id`: Auto-increment primary key
- `name`: Event name
- `date`: Date and time
- `location`: Event location
- `total_cost`: Total cost for the pitch (DECIMAL)
- `max_players`: Maximum number of players (INTEGER)
- `price_per_player`: Cost per participant (DECIMAL)
- `organizer_id`: UUID (Foreign key to Users)
- `created_at`, `updated_at`: Timestamps

**RLS Policies:**
- Anyone can view events (public)
- Only users with `can_create_events = true` can create events
- Users can update/delete their own events

### Participants
- `id`: Auto-increment primary key
- `name`: Participant name
- `email`: Optional email
- `user_id`: UUID (optional link to users)
- `avatar_url`: Profile picture
- `payment_status`: TEXT ('pending' | 'succeeded' | 'failed')
- `stripe_payment_intent_id`: Stripe payment reference
- `event_id`: Foreign key to Events
- `created_at`: Timestamp

**RLS Policies:**
- Anyone can view participants
- Anyone can join events (payment required via Stripe)
- Event organizers can remove participants
- Payment status updates via service_role key (Stripe webhooks)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Webhook Testing

For local development, use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

This will give you a webhook secret starting with `whsec_` to use in your `.env.local`.

## 🚀 Production Deployment

This application is deployed on Vercel with automatic CI/CD from the main branch.

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed setup instructions including:
- Environment variable configuration
- Database setup and migrations
- Stripe webhook configuration
- Production security checklist

### 🔒 Security Features
- ✅ Row Level Security (RLS) policies on all database tables
- ✅ Secure server-side authentication with SSR
- ✅ Protected API routes with authentication middleware
- ✅ Stripe webhook signature verification
- ✅ Environment variables never exposed to client
- ✅ Email verification for user registration
- ✅ Admin-controlled permissions system

## 📸 Screenshots

*(Consider adding screenshots of key features here for your portfolio)*

## 🎯 Project Highlights

This project demonstrates:
- **Full-stack development** with Next.js 14 and TypeScript
- **Payment integration** with Stripe API and webhook handling
- **Real-time features** using WebSocket connections
- **Database design** with PostgreSQL and RLS policies
- **Authentication** with secure SSR implementation
- **Modern React** patterns (Server Components, Context API)
- **Production deployment** on Vercel with CI/CD

## 📝 License

MIT

## 👨‍💻 Author

Built as a portfolio project to demonstrate modern full-stack web development skills.
