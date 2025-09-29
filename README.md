# Soccer Organizer MVP

A pay-to-play soccer game organization web application built with Next.js, Prisma, and Stripe.

## Features

- **Event Creation**: Create soccer events with date, location, and pricing
- **Payment Integration**: Stripe checkout with BLIK support
- **Real-time Updates**: Live participant list and payment progress
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with SQLite
- **Payments**: Stripe

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
# Database
DATABASE_URL="file:./dev.db"

# Stripe Keys
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

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

```bash
# Generate Prisma client
npm run db:generate

# Create and migrate database
npm run db:push
```

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
│   │   ├── events/          # Event CRUD operations
│   │   ├── create-checkout/ # Stripe checkout session
│   │   └── webhook/         # Stripe webhook handler
│   ├── create/              # Event creation page
│   ├── event/[id]/          # Dynamic event display
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── lib/
│   ├── prisma.ts           # Prisma client setup
│   └── stripe.ts           # Stripe client setup
├── prisma/
│   └── schema.prisma       # Database schema
└── README.md
```

## Database Schema

### Event
- `id`: Auto-increment primary key
- `name`: Event name
- `date`: Date and time
- `location`: Event location
- `totalCost`: Total cost for the pitch
- `maxPlayers`: Maximum number of players
- `pricePerPlayer`: Cost per participant

### Participant
- `id`: Auto-increment primary key
- `name`: Participant name
- `email`: Optional email
- `paymentStatus`: "pending" | "succeeded" | "failed"
- `stripePaymentIntentId`: Stripe payment reference
- `eventId`: Foreign key to Event

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
```

## Webhook Testing

For local development, use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

This will give you a webhook secret starting with `whsec_` to use in your `.env.local`.

## Production Deployment

1. Set up your production database (PostgreSQL recommended)
2. Update `DATABASE_URL` in production environment
3. Configure production Stripe webhook endpoint
4. Deploy to your preferred platform (Vercel, Railway, etc.)

## License

MIT