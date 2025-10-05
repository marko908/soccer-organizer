# Changelog

All notable changes to the Soccer Organizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2025-10-05] - Fix Tab-Switch Logout & Flash of Logged-Out UI

### Fixed
- **Tab-Switch Logout Bug** 🔄
  - Fixed users being logged out when switching browser tabs
  - Issue: `SIGNED_IN` event on tab switch triggered profile refetch with aggressive 3s timeout
  - Solution 1: Skip profile refetch if user already loaded with same ID (`contexts/AuthContext.tsx:57-62`)
  - Solution 2: Increased timeout from 3s to 10s for cold starts and network delays (`contexts/AuthContext.tsx:93-101`)
  - Solution 3: Don't logout on timeout - keep existing user data (`contexts/AuthContext.tsx:122-125`)
  - Impact: Users remain logged in when switching tabs or experiencing network delays

- **Flash of Logged-Out UI (FOUC)** ⚡
  - Fixed brief flash of logged-out interface on page refresh (development mode)
  - Root cause: React StrictMode runs `checkAuth` twice - second call returned null while first was fetching
  - Solution: Prevent duplicate `checkAuth` calls with `checkAuthRunning` ref flag (`contexts/AuthContext.tsx:37-45`)
  - Added 50ms delay + retry for slow Supabase cookie reads (`contexts/AuthContext.tsx:185-196`)
  - Full-page loading skeleton prevents any UI flash (`app/page.tsx:12-36`)
  - Impact: Eliminates flash in dev mode; production unaffected (StrictMode disabled)
  - **Status**: ✅ Fixed and verified working

### Fixed Earlier Today
- **Critical App Crash Bug** 🚨
  - Fixed infinite loop in authentication flow causing browser crashes
  - Issue: Multiple `setLoading(false)` calls in different code paths created race conditions
  - Solution: Consolidated all loading state updates into single `finally` block at `contexts/AuthContext.tsx:196-199`
  - Impact: Eliminates state update loops that caused app to freeze and crash

---

## [2025-10-04] - Auth Cookie Handling & Performance Fixes

### Fixed
- **Session Persistence Issues** 🔐
  - Removed custom cookie handlers from browser Supabase client
  - Updated to use Supabase's automatic cookie management (2025 best practices)
  - Migrated server client to modern `getAll()/setAll()` cookie API
  - Migrated middleware to use modern cookie handlers
  - Fixes: Login issues requiring manual cookie clearing after Supabase data changes

- **Profile Save Session Corruption** 🔄
  - Removed dangerous `window.location.reload()` after profile save
  - Added `refreshUser()` function to AuthContext for safe profile refresh
  - Fixes: Session loss when clicking navigation during profile update
  - Fixes: Race condition causing auth state corruption

- **Auth Loading Performance** ⚡
  - Reduced profile load time from 9+ seconds to <1 second (typically 150-300ms)
  - Skip early `SIGNED_IN` and `INITIAL_SESSION` events that fire before client ready
  - Added concurrent fetch prevention to avoid duplicate profile queries
  - Added 3-second timeout with automatic retry (max 3 attempts)
  - Fixes: Query hanging/timeout issues when modifying Supabase data
  - Fixes: Multiple concurrent profile fetches causing timeouts

- **Flash of Unauthenticated Content (FOUC)** ✨
  - Added loading skeletons in navigation (pulsing avatar circle)
  - Added loading skeletons on homepage (pulsing button shapes)
  - Smooth transition from skeleton to actual content
  - Fixes: Login/register buttons flashing before auth completes

### Changed
- **Cookie Handling Architecture**
  - Browser client (`lib/supabase.ts`): No cookie handlers needed - automatic
  - Server client (`lib/supabase-server.ts`): Uses `getAll()` and `setAll()`
  - Middleware (`middleware.ts`): Uses `getAll()` and `setAll()`
  - Follows 2025 Supabase SSR best practices

- **Auth Flow Optimization**
  - `checkAuth()` handles initial page load exclusively
  - Early auth events skipped during initialization
  - `initialLoadComplete` flag tracks first auth completion
  - All auth events (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT) work normally after init

### Added
- **Concurrent Fetch Protection**
  - `fetchingRef` and `currentUserIdRef` prevent duplicate profile fetches
  - Logs "⏭️ Skipping duplicate fetch" when blocking redundant requests
  - Automatic lock release after fetch completion (success or error)

- **Enhanced Error Logging**
  - Query timing logs: `⏱️ Query took XXXms`
  - Slow query detection: `🐌 Slow query detected!` (>1 second)
  - Retry attempt tracking: `🔍 Fetching profile (attempt X/3)`
  - Detailed error information for timeout/failure scenarios

### Technical Details
- **Files Modified**:
  - `lib/supabase.ts` - Removed custom cookie handlers (26 lines deleted)
  - `lib/supabase-server.ts` - Modern `getAll()/setAll()` API
  - `middleware.ts` - Modern cookie handling
  - `contexts/AuthContext.tsx` - Retry logic, concurrent fetch prevention, early event skip
  - `components/Navigation.tsx` - Loading skeleton
  - `app/page.tsx` - Loading skeleton

- **Files Deleted**:
  - `app/api/simple-login/route.ts` - Unused (AuthContext uses direct Supabase client)
  - `app/api/simple-register/route.ts` - Unused (AuthContext uses direct Supabase client)
  - `app/api/simple-logout/route.ts` - Unused (AuthContext uses direct Supabase client)

### Performance
- **Before**: 9+ seconds to load profile (3 timeouts × 3 seconds each)
- **After**: <1 second typical (150-300ms in Stockholm region)
- **Improvement**: ~90% faster initial page load

### Security
- ✅ No security impact - all changes are client-side UX improvements
- ✅ Supabase RLS policies still enforced
- ✅ Server-side session validation unchanged
- ✅ `auth.uid()` checks in API routes still active
- ✅ Middleware still refreshes sessions properly

### UX Improvements
- Smooth loading experience with professional skeletons
- No jarring flash of login buttons
- Fast auth validation on page load
- Graceful handling of network issues (automatic retry)
- Clear console logs for debugging auth issues

---

## [2025-10-02 Part 5] - Event Creation Validations & Date Formatting

### Added
- **Event Creation Limits** 🎯
  - Total cost cannot exceed 1500 PLN (with UI hint)
  - Maximum players limited to 30 (previously 50)
  - Events can only be created up to 90 days in advance
  - Date must be in the future
  - Calendar maximum year set to 2050
  - Client-side validation with user-friendly error messages

### Changed
- **Date/Time Format** 📅
  - Changed to dd/mm/yyyy format (e.g., 25/12/2024)
  - 24-hour time format (e.g., 23:59, not 11:59 PM)
  - `formatDateTimeShort()` now returns: dd/mm/yyyy HH:mm
  - Added `hour12: false` to all time formatters
  - Calendar limited to year 2050

### Technical Details
- **Form Validation** (`app/create/page.tsx`):
  - Validates total cost ≤ 1500 PLN
  - Validates max players ≤ 30
  - Validates event date < now + 90 days
  - `max="2050-12-31T23:59"` on datetime input
  - Shows helpful hints under each input field
- **Utility Functions** (`lib/utils.ts`):
  - `formatDateTimeShort()`: Manual formatting for dd/mm/yyyy HH:mm
  - `formatDateTime()`: Added `hour12: false`
  - `formatTime()`: Added `hour12: false`

---

## [2025-10-02 Part 4] - Code Cleanup & Audit

### Removed
- **Old Email Verification System** 🗑️
  - Deleted `app/api/verify-email/route.ts` - Custom token-based verification
  - Deleted `app/api/send-verification/route.ts` - Custom verification email sender
  - Deleted `app/verify-email/page.tsx` - Custom verification page
  - Dropped `email_verifications` table from database
  - Reason: Replaced by Supabase Auth built-in email confirmation

- **Unused API Routes**
  - Deleted `app/api/auth/confirm/route.ts` - Created during troubleshooting but never used

- **Obsolete SQL Files** (8 files)
  - `supabase-debug-policies.sql` - Debug script
  - `supabase-simple-fix.sql` - Troubleshooting fix
  - `supabase-fix-name-column.sql` - One-time migration
  - `supabase-check-users-policies.sql` - Debug check
  - `supabase-add-public-profiles-policy.sql` - Already applied
  - `supabase-cleanup-duplicate-policies.sql` - Troubleshooting
  - `supabase-fix-registration-rls.sql` - Historical fix
  - `supabase-rls-fix.sql` - Old RLS fix

- **Obsolete SQL Migration Files** (4 files)
  - `supabase-migration-user-profiles.sql` - Already applied
  - `supabase-rename-organizers-to-users.sql` - Already applied
  - `supabase-rls-policies.sql` - Outdated policies
  - `supabase-rls-policies-updated.sql` - Outdated policies

- **Obsolete Documentation** (8 files)
  - `RLS-SETUP.md` - Outdated setup guide
  - `IMPLEMENTATION-STATUS.md` - Outdated status
  - `NEXT-STEPS.md` - Completed tasks
  - `SUPABASE-EMAIL-SETUP.md` - Outdated email setup
  - `SUPABASE-PASSWORD-RESET-SETUP.md` - Outdated reset setup
  - `FIX-EMAIL-CONFIRMATION.md` - Resolved issue
  - `SUPABASE-QUICK-FIX.md` - Temporary fix
  - `SUPABASE-EMAIL-TEMPLATE-FIX.md` - Fixed template issue

### Fixed
- **Updated Table References** 📝
  - Fixed `organizers` → `users` in `app/api/verify-email/route.ts` (before deletion)
  - Fixed `organizers` → `users` in `app/api/send-verification/route.ts` (before deletion)
  - Fixed `organizers` → `users` in `app/api/admin/pending-organizers/route.ts`
  - Fixed comments in `app/api/simple-me/route.ts` and `app/api/simple-login/route.ts`
  - Changed "Get user profile from organizers table" → "Get user profile from users table"

### Changed
- **Documentation Updates**
  - Updated `README.md` with current features and architecture
  - Removed references to old `organizers` table, now `users`
  - Added public profiles section
  - Added seed users instructions
  - Updated file structure
  - Simplified setup instructions (removed obsolete SQL references)

### Summary
- **25 files deleted** (3 TypeScript + 12 SQL + 8 Markdown + 1 directory + 1 database table)
- **4 TypeScript files updated** (fixed table references and comments)
- **1 README updated** (current state of application)
- **Codebase cleaned** - No obsolete code or documentation remaining

---

## [2025-10-02 Part 3] - Public User Profiles & Session Persistence

### Added
- **Public User Profiles** 🎭
  - New route: `/u/[username]` for viewing user profiles
  - Profile header: Avatar, name, nickname, role badges (Admin, Organizer)
  - Two tabs: About (bio, stats) and Events (organized events)
  - Stats display: Age, weight, height in styled cards
  - "Edit Profile" button for own profile
  - 404 page for non-existent users
  - Examples: `/u/johnny_goals`, `/u/admin_mike`

- **Seed Users Script** 🌱
  - Node.js script using Supabase Admin API (`scripts/seed-users.js`)
  - Creates 15 real users with auth credentials
  - All can login with password: `Password123!`
  - Diverse profiles: complete, partial, minimal data
  - Includes 1 admin and 6 organizers
  - Auto-verified emails
  - Script documentation in `scripts/README.md`

### Fixed
- **Session Persistence** 🔐
  - Proper cookie handling in `createBrowserClient`
  - Custom get/set/remove cookie methods with encoding
  - Automatic token refresh every 50 minutes (tokens expire at 60min)
  - Enhanced auth state change logging (SIGNED_OUT, SIGNED_IN, TOKEN_REFRESHED)
  - Fixes: Session cookies disappearing, requiring frequent re-login

- **RLS Policy for Public Profiles**
  - Added "Public profiles are viewable by everyone" policy
  - Allows anonymous and authenticated users to view all profiles
  - Required for `/u/[username]` pages to work

- **Login Simplification**
  - Removed nickname login (now email only)
  - Simplified `login(email, password)` function
  - Removed database lookup for nickname → email conversion
  - Updated login form to require email format

- **Password Reset Flow**
  - Created `/auth/reset-password` page
  - Email template configuration guide
  - Form validation and password confirmation
  - Auto-redirect to dashboard after success

### Technical Details
- **Cookie Configuration**: Explicit cookie handlers with maxAge, path, domain, sameSite, secure options
- **Token Refresh**: `setInterval` every 50min calling `supabase.auth.refreshSession()`
- **Public Access**: RLS policy `USING (true)` for SELECT on users table
- **Files Added**:
  - `app/u/[username]/page.tsx` - Public profile page
  - `scripts/seed-users.js` - User seeding script
  - `scripts/README.md` - Seeding instructions
  - `app/auth/reset-password/page.tsx` - Password reset form

---

## [2025-10-02 Part 2] - Email Confirmation & Auth State Management Fixes

### Fixed
- **Email Confirmation Flow** ✅
  - Issue: Email confirmation page stuck on infinite loading
  - Root cause: `exchangeCodeForSession` not working client-side with `createBrowserClient`
  - Solution: Simplified to check if session exists (Supabase auto-creates session on redirect)
  - Confirmation now works: User clicks email link → auto-logged in → redirected to dashboard
  - Template: `{{ .ConfirmationURL }}` in Supabase email template

- **Auth State Management** ✅
  - Issue: Login/logout buttons disappearing after logout or page refresh
  - Root cause: `fetchUserProfile` not setting `user = null` on error
  - Added proper `setUser(null)` in all error cases
  - Added comprehensive logging with emoji markers (🔐, ✅, ❌) for debugging
  - `loading` state now properly managed throughout auth lifecycle

- **Server-side Email Confirmation Route**
  - Created `/api/auth/confirm` route for server-side code exchange (backup solution)
  - Handles PKCE flow with proper cookie setting
  - Not currently used but available as fallback

### Added
- **Debugging Documentation**
  - Updated `SUPABASE-EMAIL-TEMPLATE-FIX.md` with both client and server-side approaches
  - Detailed logging in AuthContext for troubleshooting auth issues

### Technical Details
- **Email Confirmation**: Supabase's `{{ .ConfirmationURL }}` automatically handles PKCE flow and creates session
- **Auth Flow**: Registration → Email → Click link → Session created → Redirect to `/auth/confirm` → Check session → Redirect to `/dashboard`
- **Files Modified**:
  - `app/auth/confirm/page.tsx` - Simplified to session check only
  - `contexts/AuthContext.tsx` - Enhanced error handling and logging
  - `app/api/auth/confirm/route.ts` - Server-side fallback (created but unused)

---

## [2025-10-02 Part 1] - Registration & Email Confirmation Fixes

### Fixed
- **Registration RLS Policy Issues**
  - Issue: Users could not create their own profile during registration (RLS blocked INSERT)
  - Added permissive INSERT policy: `WITH CHECK (true)` to allow user registration
  - Created `supabase-simple-fix.sql` with working RLS policies
  - Created `supabase-cleanup-duplicate-policies.sql` to remove conflicting policies

- **Database Schema Issues**
  - Removed old `name` column that had NOT NULL constraint
  - Migration from `name` → `full_name` was incomplete
  - Error: "null value in column 'name' violates not-null constraint"
  - Solution: `ALTER TABLE users DROP COLUMN IF EXISTS name`

- **Enhanced Error Logging**
  - Added detailed console error messages with emojis for easy debugging
  - Shows specific error codes, user ID, email, and nickname
  - Detects RLS policy errors and provides solution instructions
  - Detects duplicate email/nickname conflicts with clear messages
  - Error code detection: 23502 (NOT NULL), 23505 (unique violation), 42501 (RLS)

- **Email Confirmation Flow**
  - Registration now shows "Check your email" success screen
  - Added `emailRedirectTo` configuration in AuthContext
  - Better error messages for duplicate email/nickname
  - Profile creation error handling improved
  - User stays on registration page instead of auto-redirecting

### Added
- **Troubleshooting Documentation**
  - `SUPABASE-QUICK-FIX.md` - Comprehensive registration debugging guide
  - `SUPABASE-EMAIL-SETUP.md` - Email configuration instructions
  - `FIX-EMAIL-CONFIRMATION.md` - Email confirmation URL setup
  - `supabase-fix-name-column.sql` - Fix for old name column
  - `supabase-debug-policies.sql` - RLS policy debugging queries

### Issues Resolved
1. ✅ Registration gets stuck at "Creating account..."
2. ✅ User created in `auth.users` but NOT in `users` table
3. ✅ RLS policy blocking INSERT operations (error 42501)
4. ✅ Old `name` column causing NOT NULL constraint errors (error 23502)
5. ✅ No confirmation email being sent
6. ✅ Confirmation link shows "requested path is invalid"

### Database Changes
```sql
-- RLS Policies Updated
DROP old/duplicate policies
CREATE POLICY "Allow user registration" WITH CHECK (true)
CREATE POLICY "Users can view own profile" USING (auth.uid() = id OR role = 'ADMIN')
CREATE POLICY "Users can update own profile" USING (auth.uid() = id OR role = 'ADMIN')

-- Schema Cleanup
ALTER TABLE users DROP COLUMN IF EXISTS name;
```

### Configuration Required (Supabase Dashboard)
1. **Authentication** → **URL Configuration**
   - Site URL: `https://soccer-organizer.vercel.app`
   - Redirect URLs:
     - `https://soccer-organizer.vercel.app/**`
     - `https://soccer-organizer.vercel.app/auth/confirm`
     - `http://localhost:3000/**` (for local dev)
     - `http://localhost:3000/auth/confirm` (for local dev)

2. **Run SQL Scripts** (in order):
   - `supabase-simple-fix.sql` - Fix RLS policies
   - `ALTER TABLE users DROP COLUMN IF EXISTS name;` - Remove old column
   - `DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM users);` - Clean orphaned users

### Testing
- ✅ Registration creates user in both `auth.users` AND `users` table
- ✅ Success screen displays with email address
- ✅ Confirmation email sent successfully
- ⚠️ Email confirmation link needs Redirect URL configuration in Supabase
- ✅ Detailed error logging helps diagnose issues

### Files Created/Modified
- `contexts/AuthContext.tsx` - Enhanced error handling and logging
- `app/register/page.tsx` - Success screen for email confirmation
- `supabase-simple-fix.sql` - Working RLS policies
- `supabase-fix-name-column.sql` - Remove old name column
- `supabase-cleanup-duplicate-policies.sql` - Clean up duplicate policies
- `SUPABASE-QUICK-FIX.md` - Troubleshooting guide
- `FIX-EMAIL-CONFIRMATION.md` - Email confirmation setup

---

## [2025-10-02] - Rename Organizers Table to Users

### Changed
- **Database Schema** (`supabase-rename-organizers-to-users.sql`)
  - Renamed `organizers` table to `users` for clarity
  - Updated all foreign key constraints
  - Updated all RLS policies to reference `users` table
  - Renamed indexes: `organizers_pkey` → `users_pkey`, `organizers_email_key` → `users_email_key`, `organizers_nickname_unique` → `users_nickname_unique`
  - Updated helper functions: `is_admin()`, `is_approved_organizer()` to use `users` table

- **API Routes & Code**
  - Updated all Supabase queries from `.from('organizers')` to `.from('users')`
  - Updated 17 TypeScript files across the codebase
  - AuthContext, all API routes, and utility functions now reference `users` table

- **Documentation**
  - Updated README.md, CHANGELOG.md, and other docs to use "users table" terminology
  - Migration guide provided in `supabase-rename-organizers-to-users.sql`

### Migration Notes
To apply this change:
1. Run `supabase-rename-organizers-to-users.sql` in Supabase SQL Editor
2. All data is preserved - this is a table rename only
3. No code changes required on the frontend (already updated)

---

## [2025-10-02] - User Profile & Permission System Redesign

### Added
- **User Profile System**
  - Full name and nickname now required on registration
  - Profile page at `/profile` with editable fields: bio, age, weight, height
  - Avatar system with default avatar (`/default-avatar.svg`)
  - Nickname change restriction (30-day cooldown)
  - Password reset functionality via Supabase email
  - Profile accessible via navigation dropdown menu

- **Permission-Based Access Control**
  - New `can_create_events` boolean field (replaces `admin_approved`)
  - By default, all new users have `can_create_events = false`
  - Users can register without needing admin approval
  - Admin panel to manage user permissions at `/admin`

- **Admin Panel** (`/app/admin/page.tsx`)
  - Dashboard with stats: Total Users, Can Create Events, Admins, Verified
  - User table with search functionality (by name, nickname, email)
  - Toggle switches to grant/revoke `can_create_events` permission
  - Real-time permission updates
  - Admin-only access with role verification

- **Enhanced Event Joining**
  - Logged-in users can choose display name format:
    - Full Name only
    - Nickname only (@nickname)
    - Both (Full Name (@nickname))
  - Auto-fill name and email from user profile
  - Avatar display in participant lists
  - User ID tracking for participants

### Changed
- **Database Schema** (`supabase-migration-user-profiles.sql`)
  - `organizers` table:
    - Added `full_name TEXT` (required)
    - Added `nickname TEXT` (required, unique case-insensitive)
    - Added `avatar_url TEXT` (default: `/default-avatar.svg`)
    - Added `bio TEXT` (optional)
    - Added `age INTEGER` (optional)
    - Added `weight DECIMAL(5,2)` (optional)
    - Added `height DECIMAL(5,2)` (optional)
    - Added `can_create_events BOOLEAN` (default: `false`)
    - Added `nickname_last_changed TIMESTAMP` (default: NOW)
  - `participants` table:
    - Added `user_id UUID` (foreign key to organizers)
    - Added `avatar_url TEXT` (default: `/default-avatar.svg`)
  - Migrated existing data: `name` → `full_name`, `admin_approved` → `can_create_events`
  - Created unique case-insensitive index on nickname: `organizers_nickname_unique`

- **RLS Policies** (`supabase-rls-fix.sql`)
  - Event creation now checks `can_create_events` instead of `admin_approved`
  - Policy: "Users with permission can create events"
  - All policies recreated to avoid conflicts

- **Authentication Flow**
  - Login accepts email OR nickname (case-insensitive)
  - Registration requires full_name and nickname
  - Phone number is now optional
  - Default role changed from `ORGANIZER` to `USER`

- **User Interface**
  - Navigation: Avatar dropdown with profile menu and admin panel link (if admin)
  - Dashboard: Changed title from "Organizer Dashboard" to "My Events"
  - Dashboard: "Create Event" button only shows if `user.canCreateEvents === true`
  - Registration: Added full_name and nickname fields
  - Login: Changed input label to "Email or Nickname"
  - Event page: Participant list shows avatars instead of numbered badges

### API Routes

**New Routes:**
- `GET /api/profile` - Get current user's profile
- `PATCH /api/profile` - Update user profile (enforces 30-day nickname restriction)
- `GET /api/admin/users?search=query` - List all users (admin only)
- `POST /api/admin/toggle-permission` - Toggle can_create_events (admin only)

**Updated Routes:**
- `POST /api/simple-checkout` - Now accepts `userId` and `avatarUrl`
- `POST /api/webhook` - Saves `user_id` and `avatar_url` when creating participants
- `GET /api/simple-event/[id]` - Returns `avatarUrl` for participants

### Components

**New:**
- `/app/profile/page.tsx` - User profile page with edit mode
- `/app/admin/page.tsx` - Admin panel for user management

**Updated:**
- `contexts/AuthContext.tsx` - Added profile fields to User interface
- `components/Navigation.tsx` - Avatar dropdown with profile/admin links
- `app/dashboard/page.tsx` - Updated terminology and conditional buttons
- `app/event/[id]/page.tsx` - Name display options and avatar support
- `app/register/page.tsx` - Added full_name and nickname inputs
- `app/login/page.tsx` - Email OR nickname login

### Files Created
- `supabase-migration-user-profiles.sql` - Database migration script
- `supabase-rls-fix.sql` - RLS policy recreation script
- `app/api/profile/route.ts` - Profile management API
- `app/api/admin/users/route.ts` - User listing API
- `app/api/admin/toggle-permission/route.ts` - Permission toggle API
- `app/profile/page.tsx` - User profile page
- `app/admin/page.tsx` - Admin panel page
- `public/default-avatar.svg` - Default user avatar

### Security
- Nickname uniqueness enforced with case-insensitive index
- 30-day cooldown on nickname changes
- Admin-only routes verify user role before granting access
- Permission toggle uses `supabaseAdmin` to bypass RLS
- Profile updates validate ownership (users can only edit their own profile)

### UX Improvements
- Auto-fill participant name from profile when joining events
- User can choose how their name appears in participant lists
- Avatar visual identity in participant lists
- Search functionality in admin panel for easier user management
- Real-time stats dashboard for admins

### Migration Notes
To apply these changes to your database:
1. Run `supabase-migration-user-profiles.sql` in Supabase SQL Editor
2. Run `supabase-rls-fix.sql` to update RLS policies
3. Make yourself admin:
   ```sql
   UPDATE organizers
   SET role = 'ADMIN', can_create_events = true
   WHERE email = 'your@email.com';
   ```

---

## [2025-10-01] - Update Documentation

### Changed
- **README.md** - Updated to reflect current architecture
  - Authentication: Changed from "JWT with bcrypt" to "Supabase Auth (SSR with cookie-based sessions)"
  - Added Security section with Row Level Security
  - Updated environment variables (removed JWT_SECRET, added SUPABASE_SERVICE_ROLE_KEY)
  - Updated database schema with UUID primary keys and RLS policies
  - Updated file structure to include middleware and RLS files
  - Added security checklist for deployment

---

## [2025-10-01] - Row Level Security (RLS) Implementation

### Added
- **supabase-rls-policies.sql** - Comprehensive RLS policies for all tables
  - Organizers: Users can view/update own profile, admins can view/update all
  - Events: Public viewing, only approved organizers can create events
  - Participants: Public viewing, anyone can join, organizers can remove participants
  - Helper functions: `is_admin()`, `is_approved_organizer()`
- **lib/supabase-admin.ts** - Admin Supabase client with service_role key
  - Bypasses RLS for privileged operations
  - Used for Stripe webhooks and admin operations
- **RLS-SETUP.md** - Complete setup guide for Row Level Security

### Changed
- **app/api/webhook/route.ts** - Use `supabaseAdmin` for payment status updates
- **app/api/admin/approve-organizer/route.ts** - Use `supabaseAdmin` for admin operations
- **contexts/AuthContext.tsx** - Improved logout with global scope and forced page reload
- **middleware.ts** - Use `cookies.delete()` instead of setting empty value for proper cookie removal

### Fixed
- **Logout bug** - Buttons no longer disappear after logout and refresh
  - Now uses `signOut({ scope: 'global' })` to clear all sessions
  - Forces page reload to clear cached state
  - Properly deletes cookies instead of setting empty values

### Security
- Enabled Row Level Security on all tables (organizers, events, participants)
- Only approved organizers can create events
- Users can only modify their own data (except admins)
- Stripe webhooks bypass RLS using service_role key
- Admin operations use elevated privileges via service_role key

---

## [2025-10-01] - Supabase SSR Authentication Fix

### Added
- **Supabase SSR Middleware** - `middleware.ts` for proper session synchronization
  - Automatically syncs Supabase sessions between localStorage (client) and cookies (server)
  - Runs on every request to maintain session state
  - Enables server-side authentication verification
- **@supabase/ssr** package for proper SSR support
- Email confirmation page at `/auth/confirm`
  - Custom success/error states
  - Auto-redirect to dashboard after verification
  - Polish and English translations

### Changed
- **lib/supabase.ts** - Updated to use `createBrowserClient` from `@supabase/ssr`
- **lib/supabase-server.ts** - Updated to use `createServerClient` from `@supabase/ssr`
  - Proper cookie handling with get/set/remove methods
  - Error handling for Server Component restrictions
- **app/create/page.tsx** - Added `credentials: 'include'` to fetch requests

### Fixed
- **"Unauthorized" error when creating events** - Sessions now properly sync via cookies
- **Logout functionality** - Now properly clears Supabase session
- **Session persistence** - Sessions persist correctly across page reloads
- **Disappearing buttons after logout** - Fixed by proper session cleanup

---

## [2025-10-01] - Migrate API Endpoints to Supabase Client

### Changed
- **app/api/simple-events/route.ts**
  - GET: Migrated from direct PostgreSQL to Supabase client
  - POST: Migrated from direct PostgreSQL to Supabase client
  - Removed dependency on `DATABASE_URL` environment variable
  - Uses Supabase `.from()` queries with proper field mapping
- **app/api/simple-event/[id]/route.ts**
  - Migrated from direct PostgreSQL to Supabase client
  - Proper snake_case to camelCase field mapping
  - Fixed participant counting with Supabase queries

### Fixed
- **Event creation failure** - Events now create successfully
- **"Event Not Found" error** - Event detail pages now load correctly
- **Database connection issues** - No longer requires DATABASE_URL

### Security
- Removed direct database credentials from application
- Using Supabase anon key with Row Level Security (RLS) ready

---

## [2025-10-01] - Migrate to Supabase Auth

### Added
- **Supabase Authentication System**
  - Users stored in `auth.users` table (managed by Supabase)
  - Custom profile data in `organizers` table
  - Email verification with confirmation emails
  - Automatic password hashing and validation

### Changed
- **Authentication Flow**
  - Login: `supabase.auth.signInWithPassword()` instead of manual JWT
  - Register: `supabase.auth.signUp()` instead of manual bcrypt
  - Session management: Supabase sessions instead of JWT tokens
- **User ID Type**: Changed from `number` (integer) to `string` (UUID)
  - Updated all interfaces and type definitions
  - Updated database schema: `organizers.id` is now UUID
- **Database Schema Migration**
  - Dropped and recreated `organizers`, `events`, `participants` tables
  - `organizers.id` references `auth.users(id)` with CASCADE delete
  - `events.organizer_id` is now UUID type
- **contexts/AuthContext.tsx**
  - Uses Supabase client directly for auth operations
  - Real-time auth state listener with `onAuthStateChange`
  - Automatic session refresh

### Removed
- Manual JWT token generation and verification
- bcryptjs password hashing (handled by Supabase)
- Custom authentication cookies (using Supabase session cookies)

### Security
- More secure with Supabase's built-in security features
- OAuth support ready for future expansion
- Better session management with httpOnly cookies

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
