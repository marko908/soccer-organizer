# Soccer Organizer MVP

A pay-to-play soccer game organization web application built with Next.js, Supabase, and Stripe.

## Features

- **Event Creation**: Create soccer events with date, location, and pricing
- **Payment Integration**: Stripe checkout with BLIK support
- **Real-time Updates**: Live participant list and payment progress
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Authentication**: JWT with bcrypt

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

# Stripe Keys
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Authentication
JWT_SECRET="your-secret-key"
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
3. Get your project URL and anon key from Settings → API
4. Add the credentials to your `.env.local` file
5. Create the database schema using Supabase Dashboard or SQL Editor

### 5. Run the Application

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Creating an Event (Organizer)

1. Visit `/create`
2. Fill in event details:
   - Name (e.g., "Friday Soccer at Orlik")
   - Date & Time
   - Location
   - Total Cost (e.g., 200 PLN)
   - Max Players (e.g., 14)
3. The price per player is automatically calculated
4. Share the generated event URL with players

### Joining an Event (Player)

1. Visit the event URL `/event/[id]`
2. View event details and current participants
3. Click "Pay & Sign Up"
4. Enter your name (email optional)
5. Complete payment via Stripe (supports BLIK)
6. Your spot is secured upon successful payment

## File Structure

```
├── app/
│   ├── api/
│   │   ├── admin/           # Admin & organizer management
│   │   ├── events/          # Event CRUD operations
│   │   ├── create-checkout/ # Stripe checkout session
│   │   └── webhook/         # Stripe webhook handler
│   ├── create/              # Event creation page
│   ├── dashboard/           # Organizer dashboard
│   ├── event/[id]/          # Dynamic event display
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   ├── auth.ts              # Authentication helpers
│   └── stripe.ts            # Stripe client setup
├── components/              # React components
└── contexts/                # React contexts
```

## Database Schema

### Organizers
- `id`: Auto-increment primary key
- `email`: Organizer email (unique)
- `password`: Hashed password
- `name`: Organizer name
- `phone`: Phone number (optional)
- `role`: USER_ROLE enum (ADMIN, ORGANIZER)
- `email_verified`: Boolean
- `phone_verified`: Boolean
- `admin_approved`: Boolean
- `approved_at`: Timestamp
- `approved_by`: Admin identifier
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Events
- `id`: Auto-increment primary key
- `name`: Event name
- `date`: Date and time
- `location`: Event location
- `total_cost`: Total cost for the pitch
- `max_players`: Maximum number of players
- `price_per_player`: Cost per participant
- `organizer_id`: Foreign key to Organizers
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Participants
- `id`: Auto-increment primary key
- `name`: Participant name
- `email`: Optional email
- `payment_status`: "pending" | "succeeded" | "failed"
- `stripe_payment_intent_id`: Stripe payment reference
- `event_id`: Foreign key to Events
- `created_at`: Timestamp

### Email Verifications
- `id`: Auto-increment primary key
- `token`: Unique verification token
- `email`: Email to verify
- `organizer_id`: Foreign key to Organizers
- `expires_at`: Expiration timestamp
- `used_at`: Timestamp when used
- `created_at`: Timestamp

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

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `JWT_SECRET`
   - `ADMIN_SETUP_KEY`
   - `NEXT_PUBLIC_BASE_URL`
4. Configure production Stripe webhook endpoint
5. Deploy!

Your Supabase database is already production-ready and will be used automatically.

## License

MIT