# Changelog

All notable changes to the Soccer Organizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2025-10-01] - Rebrand to Foothub

### Changed
- **Application Name:** Renamed from "Soccer Organizer" to "Foothub"
  - Updated `package.json` name field
  - Updated README.md title
  - Updated DEPLOYMENT.md references
  - Repository slug remains: `soccer-organizer` (GitHub repository name unchanged)

---

## [2025-10-01] - Documentation Cleanup

### Changed
- Created CHANGELOG.md to track all project updates and changes

---

## [2025-10-01] - Complete Prisma to Supabase Migration

### Fixed
- **Vercel Deployment Failure** - Build was failing with "prisma: command not found" error
  - Root cause: Incomplete database migration from Prisma to Supabase
  - Previous commit (d5eb4db) switched to Supabase client but left Prisma references in code

### Changed
- **package.json**
  - Removed `"postinstall": "prisma generate"` script (was auto-running on every npm install)
  - Changed `"build"` from `"prisma generate && next build"` to `"next build"`
  - Removed all database management scripts: `db:push`, `db:migrate`, `db:generate`, `db:studio`
  - Removed `better-sqlite3` dependency (Prisma SQLite specific)

### Removed
- **lib/prisma.ts** - Deleted Prisma client initialization file
- **prisma/schema.prisma** - Deleted Prisma schema (migrated to Supabase)

### Migrated Files (16 total)
Converted from Prisma ORM to Supabase client with proper error handling:

**Admin API Routes:**
1. `app/api/admin/create-admin/route.ts`
   - Changed `prisma.organizer.findFirst()` → `supabase.from('organizers').select().eq().single()`
   - Changed `prisma.organizer.create()` → `supabase.from('organizers').insert().select().single()`
   - Updated field names: `emailVerified` → `email_verified`, `adminApproved` → `admin_approved`

2. `app/api/admin/approve-organizer/route.ts`
   - Changed `prisma.organizer.updateMany()` → `supabase.from('organizers').update().eq()`
   - Changed `prisma.organizer.deleteMany()` → `supabase.from('organizers').delete().eq()`

3. `app/api/admin/pending-organizers/route.ts`
   - Changed `prisma.organizer.findMany()` → `supabase.from('organizers').select().eq().order()`
   - Added camelCase conversion for frontend compatibility

**Email Verification API Routes:**
4. `app/api/send-verification/route.ts`
   - Migrated organizer lookup and email verification token creation
   - Updated table name: `emailVerification` → `email_verifications`

5. `app/api/verify-email/route.ts`
   - Converted Prisma transaction to separate Supabase update calls
   - Updated field names: `usedAt` → `used_at`, `expiresAt` → `expires_at`

**Event Management API Routes:**
6. `app/api/events/route.ts`
   - Converted event creation and listing with participant counts
   - Updated field names: `totalCost` → `total_cost`, `maxPlayers` → `max_players`, `pricePerPlayer` → `price_per_player`

7. `app/api/events/[id]/route.ts`
   - Replaced Prisma's `include` with separate Supabase queries for event and participants

8. `app/api/events/[id]/participants/route.ts`
   - Migrated participant creation with event validation

9. `app/api/events/[id]/participants/[participantId]/route.ts`
   - Migrated participant deletion with organizer authentication

**Payment & Webhook Routes:**
10. `app/api/create-checkout/route.ts`
    - Updated Stripe checkout session creation with Supabase event lookup

11. `app/api/webhook/route.ts`
    - Migrated Stripe webhook handler for payment processing
    - Updated field names: `paymentStatus` → `payment_status`, `stripePaymentIntentId` → `stripe_payment_intent_id`

**Debug & Test Routes:**
12. `app/api/test-register/route.ts`
    - Updated organizer registration for testing

13. `app/api/setup-db/route.ts`
    - Removed Prisma raw SQL execution
    - Added note that tables should be created through Supabase Dashboard

14. `app/api/debug/route.ts`
    - Updated debug endpoint to use Supabase queries

**Authentication Library:**
15. `lib/auth.ts`
    - Migrated `createOrganizer()` function to use Supabase
    - Migrated `authenticateOrganizer()` function to use Supabase

### Database Schema Changes
All field names converted from camelCase to snake_case (PostgreSQL convention):
- `emailVerified` → `email_verified`
- `phoneVerified` → `phone_verified`
- `adminApproved` → `admin_approved`
- `approvedAt` → `approved_at`
- `approvedBy` → `approved_by`
- `totalCost` → `total_cost`
- `maxPlayers` → `max_players`
- `pricePerPlayer` → `price_per_player`
- `paymentStatus` → `payment_status`
- `stripePaymentIntentId` → `stripe_payment_intent_id`
- `organizerId` → `organizer_id`
- `eventId` → `event_id`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

Table names converted to snake_case and plural:
- `organizer` → `organizers`
- `event` → `events`
- `participant` → `participants`
- `emailVerification` → `email_verifications`

### Added - Vercel Configuration
Environment variables added to Vercel:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public API key

### Testing
- ✅ Local build test passed successfully
- ✅ All Prisma imports removed
- ✅ TypeScript compilation successful
- ✅ Vercel deployment configured with environment variables

### Commit Details
- **Commit:** 89ed97b
- **Message:** "Complete Prisma to Supabase migration for Vercel deployment"
- **Files Changed:** 19 files (16 modified, 2 deleted, 1 config update)
- **Lines Changed:** +305 insertions, -391 deletions

---

## [2025-09-30] - Switch from Prisma to Supabase Client

### Changed
- **Commit:** d5eb4db
- Initial migration to Supabase client
- Note: This was an incomplete migration that left Prisma references, fixed in 2025-10-01

---

## [2025-09-29] - Role-Based Access Control (RBAC)

### Added
- **Commit:** b4b37e4
- Implemented comprehensive role-based access control system
- Added ADMIN and ORGANIZER roles
- Created admin approval workflow for organizers

---

## [2025-09-29] - Vercel Deployment PostgreSQL Migration

### Fixed
- **Commit:** 5edf32e
- Fixed Vercel deployment issues
- Migrated from SQLite to PostgreSQL
- Added Suspense boundary fixes

---

## [2025-09-29] - Organizer Verification System

### Added
- **Commit:** 1759270
- Implemented organizer verification system MVP
- Email verification flow
- Admin approval process

---

## [2025-09-29] - Privacy Improvements

### Changed
- **Commit:** c04c168
- Hide financial progress bar for non-organizers
- Improved privacy and data visibility controls

---

## Earlier History

### Features
- Event creation and management system
- Stripe payment integration with BLIK support
- Real-time participant tracking
- Responsive UI with Tailwind CSS
- Next.js 14 with TypeScript
- Authentication system for organizers

---

## Notes for Future Reference

### Database Migration Pattern (Prisma → Supabase)

**Finding records:**
```typescript
// Prisma
await prisma.tableName.findUnique({ where: { id } })

// Supabase
const { data, error } = await supabase.from('table_name').select('*').eq('id', id).single()
```

**Creating records:**
```typescript
// Prisma
await prisma.tableName.create({ data: { field: value } })

// Supabase
const { data, error } = await supabase.from('table_name').insert({ field: value }).select().single()
```

**Updating records:**
```typescript
// Prisma
await prisma.tableName.update({ where: { id }, data: { field: value } })

// Supabase
const { data, error } = await supabase.from('table_name').update({ field: value }).eq('id', id).select()
```

**Deleting records:**
```typescript
// Prisma
await prisma.tableName.delete({ where: { id } })

// Supabase
const { data, error } = await supabase.from('table_name').delete().eq('id', id)
```

### Environment Variables Required

**Local Development (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`
- `ADMIN_SETUP_KEY`
- `NEXT_PUBLIC_BASE_URL`

**Production (Vercel):**
- Same as local development
- All environment variables must be set in Vercel dashboard

### Tech Stack
- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe with BLIK support
- **Authentication:** JWT with bcrypt
- **Deployment:** Vercel

---

*This changelog is maintained manually. Please update it with every significant change to the project.*
