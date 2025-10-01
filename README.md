# Foothub

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
- **Authentication**: Supabase Auth (SSR with cookie-based sessions)
- **Payments**: Stripe with BLIK support
- **Security**: Row Level Security (RLS) policies

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
5. Run the SQL migration in Supabase SQL Editor:
   - Open `supabase-rls-policies.sql`
   - Copy and paste the contents
   - Click "Run" to enable Row Level Security

For detailed setup instructions, see [RLS-SETUP.md](./RLS-SETUP.md)

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
│   │   ├── admin/              # Admin & organizer management
│   │   ├── simple-events/      # Event CRUD operations
│   │   ├── simple-event/[id]/  # Event details endpoint
│   │   ├── create-checkout/    # Stripe checkout session
│   │   └── webhook/            # Stripe webhook handler
│   ├── auth/confirm/           # Email confirmation page
│   ├── create/                 # Event creation page
│   ├── dashboard/              # Organizer dashboard
│   ├── event/[id]/             # Dynamic event display
│   └── page.tsx                # Homepage
├── lib/
│   ├── supabase.ts             # Client-side Supabase client
│   ├── supabase-server.ts      # Server-side Supabase client (SSR)
│   ├── supabase-admin.ts       # Admin client with service_role key
│   └── stripe.ts               # Stripe client setup
├── components/                 # React components
├── contexts/                   # React contexts (Auth, etc.)
├── middleware.ts               # Supabase SSR session sync
├── supabase-rls-policies.sql   # Database security policies
└── RLS-SETUP.md                # RLS setup guide
```

## Database Schema

### Authentication
Users are managed by **Supabase Auth** (`auth.users` table) with custom profile data in `organizers` table.

### Organizers
- `id`: UUID (references `auth.users.id`)
- `email`: Organizer email (unique)
- `name`: Organizer name
- `phone`: Phone number (optional)
- `role`: TEXT ('ADMIN' | 'ORGANIZER')
- `email_verified`: Boolean
- `phone_verified`: Boolean
- `admin_approved`: Boolean (must be true to create events)
- `approved_at`: Timestamp
- `approved_by`: Admin identifier
- `created_at`: Timestamp
- `updated_at`: Timestamp

**RLS Policies:**
- Users can view/update their own profile
- Admins can view/update all organizers
- Role and approval status protected from self-modification

### Events
- `id`: Auto-increment primary key
- `name`: Event name
- `date`: Date and time
- `location`: Event location
- `total_cost`: Total cost for the pitch (DECIMAL)
- `max_players`: Maximum number of players (INTEGER)
- `price_per_player`: Cost per participant (DECIMAL)
- `organizer_id`: UUID (Foreign key to Organizers)
- `created_at`: Timestamp
- `updated_at`: Timestamp

**RLS Policies:**
- Anyone can view events (public)
- Only approved organizers can create events
- Organizers can update/delete their own events

### Participants
- `id`: Auto-increment primary key
- `name`: Participant name
- `email`: Optional email
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

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret!)
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `ADMIN_SETUP_KEY`
   - `NEXT_PUBLIC_BASE_URL`
4. Configure production Stripe webhook endpoint
5. Deploy!

### Security Checklist
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Service role key added to environment variables (never exposed to client)
- ✅ Supabase Auth manages passwords and sessions
- ✅ Email verification required for organizers
- ✅ Admin approval required before creating events

Your Supabase database is already production-ready and will be used automatically.

## License

MIT