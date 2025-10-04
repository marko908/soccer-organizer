# Soccer Organizer - Application Architecture & Functionality

## 🎯 Core Concept

**Soccer Organizer** is a platform that connects soccer event organizers with players. Organizers create events, players pay to join, and the money goes directly to the organizer to cover venue costs.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 (React) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Connect
- **Deployment**: Vercel

### Key Design Principles
1. **Direct Payments**: Money flows directly from players to organizers (via Stripe Connect)
2. **User-Centric**: Players can join without accounts, organizers need Stripe setup
3. **Real-time**: Supabase provides real-time updates for event participation
4. **Secure**: Supabase RLS policies protect data, Stripe handles payment security
5. **Scalable**: Serverless architecture on Vercel, no server maintenance

---

## 👥 User Roles

### 1. **Regular User (Player)**
- Can browse and join events
- Pay to secure a spot in games
- View their profile and update personal info
- Optional: Create account to track participation history

### 2. **Organizer**
- All User permissions, plus:
- Create and manage soccer events
- Must connect Stripe account to receive payments
- Track event participants and payment status
- Add cash participants manually

### 3. **Admin**
- All Organizer permissions, plus:
- Manage user permissions (grant/revoke event creation rights)
- View all users in the system
- Auto-granted event creation permission
- Created via special setup endpoint with secret key

---

## 🔄 Core Workflows

### Workflow 1: User Registration & Authentication

```
1. User visits /register
2. Fills in: email, password, full name, nickname, phone (optional)
3. System creates:
   - Supabase Auth user
   - User profile in 'users' table
4. Email verification sent (Supabase)
5. User can login at /login
6. Session managed via Supabase Auth cookies
```

**Key Features:**
- Unique nicknames required
- Email verification recommended but not enforced
- Password reset via /auth/reset-password
- Nickname can be changed once per 30 days

### Workflow 2: Organizer Onboarding (Stripe Connect)

```
1. Admin grants can_create_events permission to user
2. User sees "Connect Stripe Account" banner on dashboard
3. User clicks → redirected to /connect
4. Clicks "Connect Stripe Account" button
5. System creates Stripe Express account
6. User redirected to Stripe onboarding
7. Completes business info (Poland-based)
   - Individual or business
   - Bank details
   - Identification (PESEL/passport)
8. Returns to app at /connect/return
9. System updates user:
   - stripe_account_id
   - stripe_onboarding_complete = true
   - stripe_charges_enabled = true
   - stripe_payouts_enabled = true
10. User can now create events
```

**Stripe Account States:**
- **Not Connected**: Can't create events
- **Onboarding Incomplete**: Account created but verification pending
- **Fully Connected**: Can receive payments

### Workflow 3: Event Creation

```
1. Organizer must have:
   - can_create_events = true
   - Completed Stripe Connect onboarding
2. Organizer visits /create
3. Fills in event details:
   - Name (e.g., "Friday 6PM - Orlik Mokotow")
   - Date & Time (up to 90 days in advance)
   - Location (venue address)
   - Total Cost (max 1500 PLN)
   - Max Players (max 30)
4. System calculates: price_per_player = total_cost / max_players
5. Event created with organizer_id
6. Organizer can share event link: /event/{id}
```

**Business Rules:**
- Max cost: 1500 PLN (Stripe Connect limit for low-risk)
- Max players: 30
- Max advance booking: 90 days
- Events in the past are rejected
- Price per player auto-calculated

### Workflow 4: Player Joins Event (Payment Flow)

```
1. Player visits /event/{id}
2. Sees event details:
   - Name, date, location
   - Price per player
   - Available spots
   - Current participants
3. Clicks "Pay & Sign Up"
4. Enters:
   - Name (auto-filled if logged in)
   - Email (optional)
   - Chooses name display option (if logged in):
     * Full name
     * Nickname
     * Both
5. Clicks "Pay {amount}"
6. System creates Stripe Checkout session:
   - Payment goes to organizer's Stripe account
   - Platform can optionally take fee (commented out)
7. Redirected to Stripe Checkout page
8. Completes payment (card or BLIK)
9. Stripe sends webhook to /api/webhook
10. Webhook adds participant to database
11. Player redirected to /event/{id}?success=true
12. Sees "Payment successful!" message
```

**Payment Methods Supported:**
- Credit/Debit Cards (Visa, Mastercard, etc.)
- BLIK (Polish mobile payment)

**Stripe Connect Transfer:**
- Money transferred directly to organizer
- Optional platform fee: 5% (currently disabled)
- Transfer happens instantly after payment

### Workflow 5: Event Management (Organizer)

```
1. Organizer visits /event/{id}/manage
2. Sees dashboard:
   - Participant count
   - Money collected vs. target
   - Progress bar
   - List of all participants
3. Can add cash participants:
   - Enter name + email
   - Marked as "Cash" payment
   - Counts toward event capacity
4. Can remove participants:
   - Stripe payments: Organizer must refund manually
   - Cash participants: Just removed from list
5. Can share public event link
```

**Participant Types:**
- **Stripe**: Paid online, has payment_intent_id
- **Cash**: Added manually by organizer

---

## 🗄️ Database Schema

### Core Tables

#### `users`
```sql
id                          UUID PRIMARY KEY (from auth.users)
email                       TEXT UNIQUE NOT NULL
full_name                   TEXT NOT NULL
nickname                    TEXT UNIQUE NOT NULL
phone                       TEXT
role                        TEXT DEFAULT 'USER' (USER | ADMIN)
can_create_events           BOOLEAN DEFAULT FALSE
email_verified              BOOLEAN DEFAULT FALSE
phone_verified              BOOLEAN DEFAULT FALSE
avatar_url                  TEXT DEFAULT '/default-avatar.svg'
bio                         TEXT
age                         INTEGER
weight                      NUMERIC
height                      NUMERIC
nickname_last_changed       TIMESTAMP
stripe_account_id           TEXT (Stripe Connect account)
stripe_onboarding_complete  BOOLEAN DEFAULT FALSE
stripe_charges_enabled      BOOLEAN DEFAULT FALSE
stripe_payouts_enabled      BOOLEAN DEFAULT FALSE
created_at                  TIMESTAMP DEFAULT NOW()
updated_at                  TIMESTAMP DEFAULT NOW()
```

**Key Constraints:**
- `email` is unique (managed by Supabase Auth)
- `nickname` is unique (app-enforced)
- `id` references `auth.users(id)` (Supabase Auth)
- `stripe_account_id` is Stripe Express account ID

#### `events`
```sql
id                  SERIAL PRIMARY KEY
name                TEXT NOT NULL
date                TIMESTAMP NOT NULL
location            TEXT NOT NULL
total_cost          NUMERIC(10,2) NOT NULL
max_players         INTEGER NOT NULL
price_per_player    NUMERIC(10,2) NOT NULL
organizer_id        UUID REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

**Business Logic:**
- `price_per_player` auto-calculated on creation
- `organizer_id` must have completed Stripe Connect
- `date` must be in future and within 90 days

#### `participants`
```sql
id                          SERIAL PRIMARY KEY
event_id                    INTEGER REFERENCES events(id)
user_id                     UUID REFERENCES users(id) (nullable)
name                        TEXT NOT NULL
email                       TEXT
avatar_url                  TEXT DEFAULT '/default-avatar.svg'
payment_status              TEXT DEFAULT 'pending' (pending | succeeded | failed)
payment_method              TEXT (stripe | cash)
stripe_payment_intent_id    TEXT (for Stripe payments)
created_at                  TIMESTAMP DEFAULT NOW()
```

**Participant States:**
- **Stripe Payment**: Has `stripe_payment_intent_id`, status = 'succeeded'
- **Cash Payment**: No payment_intent, status = 'succeeded', added by organizer
- **Guest**: `user_id` is NULL (player joined without account)
- **Registered**: `user_id` is set (logged-in player)

### Row Level Security (RLS)

All tables have RLS enabled:

**Users Table:**
- SELECT: Public (anyone can read user profiles)
- INSERT: Only during signup (service_role for registration)
- UPDATE: Only own profile
- DELETE: Never (soft delete via admin)

**Events Table:**
- SELECT: Public (anyone can view events)
- INSERT: Only users with `can_create_events = true`
- UPDATE: Only event organizer
- DELETE: Only event organizer

**Participants Table:**
- SELECT: Public (anyone can see who's playing)
- INSERT: Via webhook (service_role) or organizer (cash)
- UPDATE: Never
- DELETE: Only event organizer

---

## 🔐 Authentication & Authorization

### Authentication Flow (Supabase Auth)

1. **Session Management**
   - Uses HTTP-only cookies (secure)
   - Middleware refreshes tokens automatically
   - Supabase client handles cookie updates

2. **Auth Context (Client-Side)**
   ```typescript
   - Provides: user, loading, login(), register(), logout()
   - Auto-fetches user profile from database
   - Listens to auth state changes
   - Updates UI reactively
   ```

3. **Server-Side Auth**
   ```typescript
   - getSupabaseUser(): Gets user from server
   - createServerSupabaseClient(): Server Supabase client
   - Used in API routes and server components
   ```

### Permission Hierarchy

```
PUBLIC (no auth)
  ↓
USER (authenticated)
  - View events
  - Join events
  - Edit own profile
  ↓
ORGANIZER (can_create_events = true)
  - All USER permissions
  - Create events
  - Manage own events
  - Add cash participants
  ↓
ADMIN (role = 'ADMIN')
  - All ORGANIZER permissions
  - Grant/revoke permissions
  - View all users
  - Access /admin panel
```

---

## 💳 Payment Architecture (Stripe Connect)

### Payment Flow

```
Player → Stripe Checkout → Organizer's Stripe Account
                ↓
           Webhook Event
                ↓
        Add to Database
```

### Stripe Integration Components

#### 1. **Checkout Session Creation** (`/api/simple-checkout`)
```typescript
- Fetches event + organizer Stripe account
- Validates organizer has completed onboarding
- Creates Stripe Checkout Session with:
  * payment_method_types: ['card', 'blik']
  * transfer_data.destination: organizer's stripe_account_id
  * metadata: eventId, participantName, email, userId
- Returns checkout URL
```

#### 2. **Webhook Handler** (`/api/webhook`)
```typescript
- Listens for: checkout.session.completed
- Verifies signature (STRIPE_WEBHOOK_SECRET)
- Extracts metadata from session
- Inserts participant into database
- Returns 200 OK to Stripe
```

#### 3. **Connect Onboarding** (`/api/connect/onboarding`)
```typescript
- Creates Stripe Express Account (Poland)
- Enables: card_payments, blik_payments, transfers
- Creates AccountLink for onboarding
- Stores stripe_account_id in database
```

#### 4. **Connect Status** (`/api/connect/status`)
```typescript
- Fetches account from Stripe API
- Updates database with:
  * charges_enabled
  * payouts_enabled
  * onboarding_complete
- Returns status to frontend
```

### Money Flow

**For a 100 PLN event with 10 players (10 PLN each):**

```
Player pays 10 PLN
    ↓
Stripe processes payment
    ↓
Stripe fee deducted (~2.9% + 1 PLN = ~1.29 PLN)
    ↓
Net amount transferred to organizer (~8.71 PLN)
    ↓
Organizer receives in their Stripe balance
    ↓
Organizer transfers to bank account
```

**Platform Fee (Optional, Currently Disabled):**
```typescript
application_fee_amount: Math.round(pricePerPlayer * 100 * 0.05) // 5%
```
- Would give platform 5% of each payment
- Commented out in code (line 90, simple-checkout/route.ts)

---

## 🎨 Frontend Architecture

### Page Structure

```
/ (Home)
  - Landing page
  - Login/Register buttons
  - Public event list (future feature)

/login
  - Email + password login
  - Link to /register
  - Redirects to /dashboard on success

/register
  - Email, password, full name, nickname
  - Creates Supabase Auth user + profile
  - Email verification prompt

/dashboard (Protected)
  - User's events (if organizer)
  - Stripe Connect banner (if not connected)
  - Create event button (if can_create_events)

/connect (Protected)
  - Stripe Connect onboarding
  - Account status display
  - Link to Stripe Express

/create (Protected, Organizer only)
  - Event creation form
  - Validation (90 days, 1500 PLN, 30 players)
  - Auto-calculates price per player

/event/[id] (Public)
  - Event details
  - Participant list
  - Join/Pay button
  - Payment form (name, email)
  - Display name options (if logged in)

/event/[id]/manage (Protected, Organizer only)
  - Event stats (collected/target)
  - Participant management
  - Add cash participants
  - Remove participants

/profile (Protected)
  - Edit profile (bio, age, weight, height)
  - Change nickname (30-day limit)
  - Password reset
  - Avatar (future feature)

/admin (Protected, Admin only)
  - User list with search
  - Toggle can_create_events permission
  - User stats

/u/[username] (Public, future feature)
  - Public user profile
  - User's events
  - Stats

/setup-admin (One-time use)
  - Creates first admin user
  - Requires ADMIN_SETUP_KEY from env
  - Disabled after first admin created
```

### State Management

**Client-Side (React Context):**
- `AuthContext`: User state, login/logout functions
- `LanguageContext`: Multi-language support (EN/PL)

**Server-Side:**
- API routes fetch fresh data from Supabase
- Server Components use `createServerSupabaseClient()`
- No global server state (stateless)

### Styling Approach

**Tailwind CSS with custom components:**
```css
.btn-primary - Primary action button (blue)
.btn-secondary - Secondary action (gray)
.card - Container with shadow and padding
.input - Form input styling
.stat-card - Dashboard stats card
.progress-bar - Event funding progress
.participant-card - Participant list item
```

**Responsive Design:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Stack on mobile, grid on desktop

---

## 🔄 API Routes

### Authentication APIs

**POST `/api/simple-login`**
- Body: `{ email, password }`
- Returns: `{ user, session }`
- Sets Supabase Auth cookie

**POST `/api/simple-register`**
- Body: `{ email, password, name, phone? }`
- Creates Supabase Auth user
- Creates user profile
- Returns: `{ user, session }`

**POST `/api/simple-logout`**
- Clears Supabase session
- Returns: `{ success: true }`

**GET `/api/simple-me`**
- Returns current user profile
- Returns 401 if not authenticated

### Event APIs

**GET `/api/simple-events`**
- Returns organizer's events
- Includes participant count
- Requires authentication

**POST `/api/simple-events`**
- Body: `{ name, date, location, totalCost, maxPlayers }`
- Validates organizer has Stripe Connect
- Returns created event

**GET `/api/simple-event/[id]`**
- Returns event details
- Includes participants
- Calculates available spots

### Participant APIs

**POST `/api/simple-participants/[eventId]`**
- Body: `{ name, email?, paymentMethod: 'cash' }`
- Organizer only
- Adds cash participant

**DELETE `/api/simple-participants/[eventId]/[participantId]`**
- Organizer only
- Removes participant

### Payment APIs

**POST `/api/simple-checkout`**
- Body: `{ eventId, participantName, participantEmail?, userId?, avatarUrl? }`
- Creates Stripe Checkout session
- Returns: `{ url }` (Stripe checkout URL)

**POST `/api/webhook`**
- Stripe webhook endpoint
- Verifies signature
- Handles `checkout.session.completed`
- Adds participant to database

### Connect APIs

**POST `/api/connect/onboarding`**
- Creates/retrieves Stripe Express account
- Returns AccountLink URL
- Requires authentication

**GET `/api/connect/status`**
- Returns Stripe account status
- Updates database with latest info
- Requires authentication

### Admin APIs

**GET `/api/admin/users`**
- Query: `?search={query}`
- Returns filtered user list
- Admin only

**POST `/api/admin/toggle-permission`**
- Body: `{ userId, canCreateEvents }`
- Toggles event creation permission
- Admin only

**POST `/api/admin/create-admin`**
- Body: `{ email, password, name, setupKey }`
- Creates admin user
- Requires ADMIN_SETUP_KEY
- One-time use (checks for existing admin)

### Profile API

**GET `/api/profile`**
- Returns user profile
- Requires authentication

**PATCH `/api/profile`**
- Body: `{ nickname?, bio?, age?, weight?, height? }`
- Updates user profile
- Validates nickname uniqueness
- Enforces 30-day nickname change limit

---

## 🌍 Internationalization (i18n)

### Language Support
- English (EN)
- Polish (PL)

### Implementation
```typescript
LanguageContext provides:
  - t(key): Translation function
  - language: Current language
  - setLanguage(lang): Change language
```

### Translation Keys
```typescript
common.back
common.loading
auth.login.title
auth.email
auth.password
event.create
event.join
dashboard.welcome
// etc...
```

**Language Selector Component:**
- Dropdown in navigation
- Persists choice in localStorage
- Automatically updates all text

---

## 🔔 Real-time Features (Future)

Supabase Realtime can be enabled for:

1. **Live Participant Updates**
   - See players join in real-time
   - No refresh needed

2. **Event Changes**
   - Organizer updates reflected immediately
   - Price changes, date changes

3. **Payment Status**
   - Real-time payment confirmation
   - Webhook triggers UI update

**Not yet implemented** - requires Supabase Realtime subscription setup.

---

## 🚀 Deployment

### Environment Variables

**Required for All Environments:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# Admin
ADMIN_SETUP_KEY=your-secret-key
```

**Local Development Only:**
```env
STRIPE_PUBLISHABLE_KEY=pk_test_... (for client-side)
```

### Vercel Deployment

1. **Connect GitHub Repo**
   - Vercel auto-deploys on push to `main`

2. **Configure Environment Variables**
   - Add all env vars in Vercel dashboard
   - Set for Production, Preview, Development

3. **Setup Custom Domain (Optional)**
   - Add domain in Vercel
   - Update NEXT_PUBLIC_BASE_URL

4. **Stripe Webhook Configuration**
   - Point to: `https://your-domain.vercel.app/api/webhook`
   - Use production webhook secret

### Database Migrations

Run in Supabase SQL Editor:

1. **Initial Schema** (done)
2. **Stripe Connect Fields** (done)
3. **Future Migrations**: Add to `/supabase-migrations/`

### Monitoring

**Vercel Analytics:**
- Page views
- Performance metrics
- Error tracking

**Stripe Dashboard:**
- Payment volume
- Failed payments
- Connected accounts

**Supabase Dashboard:**
- Database usage
- Auth metrics
- API calls

---

## 🧪 Testing

### Manual Testing Checklist

**User Flows:**
- [ ] Register new user
- [ ] Login/logout
- [ ] Password reset
- [ ] Profile update
- [ ] Nickname change (30-day limit)

**Organizer Flows:**
- [ ] Stripe Connect onboarding
- [ ] Create event (validation)
- [ ] View event management page
- [ ] Add cash participant
- [ ] Remove participant

**Payment Flows:**
- [ ] Join event (guest)
- [ ] Join event (logged in)
- [ ] Stripe checkout (card)
- [ ] Stripe checkout (BLIK)
- [ ] Webhook receives event
- [ ] Participant added correctly

**Admin Flows:**
- [ ] View user list
- [ ] Grant event creation permission
- [ ] Search users

### Test Data

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

**Test User:**
```
Email: test@example.com
Password: Test123!
Full Name: Test User
Nickname: testuser
```

**Test Event:**
```
Name: Test Soccer Game
Date: Tomorrow 6PM
Location: Test Stadium
Total Cost: 200 PLN
Max Players: 10
Price per Player: 20 PLN (auto-calculated)
```

---

## 🔒 Security Considerations

### Implemented Security

1. **Authentication**
   - Supabase Auth with secure sessions
   - HTTP-only cookies
   - CSRF protection via Supabase

2. **Authorization**
   - Row Level Security on all tables
   - API route protection
   - Role-based access control

3. **Payment Security**
   - Stripe handles all card data (PCI compliant)
   - Webhook signature verification
   - No card details stored

4. **Data Validation**
   - Server-side validation on all inputs
   - SQL injection prevention (Supabase client)
   - XSS prevention (React auto-escaping)

### Security Best Practices

**Environment Variables:**
- Never commit `.env.local`
- Use different keys for dev/prod
- Rotate secrets regularly

**Stripe:**
- Use test mode for development
- Verify webhook signatures
- Don't expose secret keys

**Database:**
- Enable RLS on all tables
- Use service_role sparingly
- Audit RLS policies regularly

**User Data:**
- Hash passwords (Supabase Auth)
- No sensitive data in logs
- GDPR compliance (EU users)

---

## 📈 Future Enhancements

### Planned Features

1. **Event Discovery**
   - Public event feed
   - Search by location/date
   - Categories (5v5, 7v7, 11v11)

2. **Recurring Events**
   - Weekly/monthly games
   - Subscription model
   - Auto-invitations

3. **Team Formation**
   - Auto-balance teams
   - Skill ratings
   - Position preferences

4. **Communication**
   - Event chat
   - Email notifications
   - SMS reminders (via Supabase Edge Functions)

5. **Advanced Analytics**
   - Organizer dashboard (revenue, trends)
   - Player stats (games played, average cost)
   - Popular venues

6. **Social Features**
   - Friend system
   - Event invitations
   - Reviews/ratings

7. **Payment Features**
   - Refunds (organizer-initiated)
   - Split payments (bring a friend)
   - Deposits (partial payment)

### Technical Improvements

1. **Performance**
   - Image optimization (Next.js Image)
   - Code splitting
   - Caching strategy

2. **Testing**
   - Unit tests (Jest)
   - E2E tests (Playwright)
   - API tests (Postman/Newman)

3. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (Vercel Analytics)
   - User analytics (PostHog/Mixpanel)

4. **DevOps**
   - CI/CD pipeline
   - Automated migrations
   - Staging environment

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Platform Fee**
   - Code exists but commented out
   - Requires Stripe application fee approval

2. **Refunds**
   - Must be done manually in Stripe
   - No automated refund flow

3. **Event Capacity**
   - No waiting list
   - No overbook protection

4. **Payment Methods**
   - Cards and BLIK only
   - No bank transfers
   - No PayPal

5. **Localization**
   - Only English and Polish
   - Date/time formats fixed to PL

6. **Mobile App**
   - Web-only (responsive)
   - No native iOS/Android

### Known Bugs

1. **Build Warnings**
   - `pg` module warnings (legacy code)
   - `document is not defined` during SSR (non-critical)

2. **Edge Cases**
   - Simultaneous payments for last spot (race condition)
   - Webhook retry handling (duplicates possible)

---

## 📚 Code Organization

```
/app                          # Next.js App Router
  /api                        # API routes
    /admin                    # Admin endpoints
    /connect                  # Stripe Connect
    /simple-*                 # Main API routes
    /webhook                  # Stripe webhook
  /[page]                     # Page components
  layout.tsx                  # Root layout
  page.tsx                    # Home page

/components                   # Shared React components
  LanguageSelector.tsx
  Navigation.tsx

/contexts                     # React Context providers
  AuthContext.tsx
  LanguageContext.tsx

/lib                          # Utility functions
  stripe.ts                   # Stripe client
  supabase.ts                 # Browser Supabase client
  supabase-server.ts          # Server Supabase client
  supabase-admin.ts           # Admin Supabase client
  utils.ts                    # Helper functions

/public                       # Static assets
  default-avatar.svg

/supabase-migrations          # Database migrations
  *.sql

.env.local                    # Environment variables (gitignored)
package.json                  # Dependencies
next.config.js                # Next.js config
tailwind.config.js            # Tailwind config
tsconfig.json                 # TypeScript config
```

### Coding Conventions

**Naming:**
- Components: PascalCase (UserProfile.tsx)
- Functions: camelCase (fetchUserData)
- Constants: UPPER_SNAKE_CASE (MAX_PLAYERS)
- Files: kebab-case for utils, PascalCase for components

**TypeScript:**
- Interfaces for data structures
- Types for unions/utilities
- Strict mode enabled
- No `any` types (use `unknown`)

**React:**
- Functional components only
- Custom hooks for reusable logic
- Context for global state
- Server Components where possible

---

## 🤝 Contributing Guidelines

### Development Workflow

1. **Setup Local Environment**
   ```bash
   git clone [repo]
   npm install
   cp .env.local.example .env.local
   # Add your API keys
   npm run dev
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code
   - Test manually
   - Update documentation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

```
type(scope): subject

Examples:
feat(payments): add refund functionality
fix(auth): resolve login redirect issue
docs(readme): update setup instructions
chore(deps): upgrade Next.js to 14.2.33
```

**Types:**
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructure
- test: Add tests
- chore: Maintenance

---

## 📞 Support & Resources

### Documentation Links

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Stripe Connect**: https://stripe.com/docs/connect
- **Tailwind CSS**: https://tailwindcss.com/docs

### Troubleshooting

**Common Issues:**

1. **"STRIPE_SECRET_KEY not set"**
   - Add to Vercel environment variables
   - Redeploy app

2. **"Organizer has not completed payment setup"**
   - Complete Stripe Connect onboarding at /connect

3. **"Event is full"**
   - Check max_players limit
   - Remove participants or create new event

4. **Webhook not receiving events**
   - Verify webhook URL in Stripe Dashboard
   - Check STRIPE_WEBHOOK_SECRET is correct
   - Use Stripe CLI for local testing

5. **User can't create events**
   - Check can_create_events = true in database
   - Admin must grant permission

### Getting Help

- GitHub Issues: Report bugs
- Email: [your-email]
- Slack/Discord: [if applicable]

---

## 📄 License & Legal

### Terms of Service (Summary)

- Platform connects organizers and players
- Payments processed by Stripe
- Platform not responsible for event disputes
- Users must be 18+ to create events
- Organizers responsible for venue booking

### Privacy Policy (Summary)

- Minimal data collection (email, name, nickname)
- Payment data handled by Stripe (PCI compliant)
- No selling of user data
- GDPR compliant (EU users can request data deletion)

### Stripe Connect Agreement

- Organizers agree to Stripe Connected Account Agreement
- Platform acts as payment facilitator
- Organizers responsible for taxes
- Disputes handled through Stripe

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)

**Growth:**
- Monthly Active Users (MAU)
- New Event Creations
- Total Payment Volume

**Engagement:**
- Events per Organizer
- Average Participants per Event
- Repeat Participation Rate

**Revenue (if platform fee enabled):**
- Gross Transaction Volume (GTV)
- Platform Revenue
- Average Transaction Value

**Quality:**
- Event Completion Rate
- Payment Success Rate
- User Satisfaction Score

---

## 🏁 Conclusion

Soccer Organizer is a **marketplace platform** that solves the problem of organizing and paying for recreational soccer games. By leveraging **Stripe Connect**, money flows directly from players to organizers, eliminating manual collection and providing transparency.

The application is built on modern, scalable technologies (**Next.js**, **Supabase**, **Stripe**) and follows best practices for **security**, **performance**, and **user experience**.

Key differentiators:
- ✅ Direct organizer-to-player payments (no escrow)
- ✅ BLIK support for Polish market
- ✅ No middleman in payment flow
- ✅ Instant event creation and payment
- ✅ Mobile-responsive design

The platform is ready for **production deployment** and can scale to thousands of events and users with minimal infrastructure changes.

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
**Deployment:** https://soccer-organizer.vercel.app/
