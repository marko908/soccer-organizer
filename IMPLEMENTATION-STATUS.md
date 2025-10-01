# User Profile & Permission System - Implementation Status

## ✅ COMPLETED

### 1. Database Schema
- ✅ Created `supabase-migration-user-profiles.sql`
  - Added `full_name`, `nickname` (required, unique)
  - Added profile fields: `avatar_url`, `bio`, `age`, `weight`, `height`
  - Added `can_create_events` permission (replaces `admin_approved`)
  - Added `nickname_last_changed` for 30-day restriction
  - Added `user_id` and `avatar_url` to `participants` table
  - Migrated existing data from `name` to `full_name`

### 2. RLS Policies
- ✅ Created `supabase-rls-policies-updated.sql`
  - Updated event creation policy to check `can_create_events = true`
  - Users can update own profile (except role and can_create_events)
  - Admins can update any user including permissions
  - Added `can_create_events()` helper function

### 3. AuthContext
- ✅ Updated User interface with all new fields
- ✅ Login accepts email OR nickname (case-insensitive lookup)
- ✅ Register collects full_name and nickname
- ✅ Profile fetching includes all new fields
- ✅ Changed role from 'ORGANIZER' to 'USER'

### 4. Registration Page
- ✅ Updated form to collect Full Name and Nickname
- ✅ Made phone optional
- ✅ Added nickname helper text
- ✅ Changed title from "Create Organizer Account" to "Create Account"

### 5. Login Page
- ✅ Changed input to "Email or Nickname"
- ✅ Updated placeholder text
- ✅ Form now accepts both email and nickname

---

## 🚧 IN PROGRESS / TODO

### 6. Database Migrations (NEXT STEP - CRITICAL)
**YOU MUST DO THIS BEFORE TESTING:**

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase-migration-user-profiles.sql` first
   - This adds all new columns and migrates data
3. Then run `supabase-rls-policies-updated.sql`
   - This updates the RLS policies

**Verification:**
```sql
-- Check schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizers';

-- Check existing users have data
SELECT id, email, full_name, nickname, can_create_events
FROM organizers;
```

### 7. User Profile Page
**File to create:** `app/profile/page.tsx`

**Features needed:**
- Display avatar (or default)
- Show Full Name (read-only)
- Edit Nickname (with 30-day restriction check)
- Edit optional fields: bio, age, weight, height
- Change password button (triggers Supabase password reset)

**API needed:** `app/api/profile/route.ts`
- GET: Fetch user profile
- PATCH: Update profile fields
- Validate nickname uniqueness
- Check `nickname_last_changed` for 30-day restriction

### 8. Profile Navigation
**File to update:** `app/layout.tsx` or create navigation component

Add to top-right:
- Avatar icon
- Dropdown menu:
  - "My Profile" → `/profile`
  - "My Events" → `/dashboard`
  - "Logout"

### 9. Event Joining with Auto-fill
**File to update:** `app/event/[id]/page.tsx`

For logged-in users:
- Pre-fill name field with user's data
- Radio buttons to choose: "Full Name", "Nickname", "Full Name (Nickname)"
- Copy `avatar_url` and `user_id` to participants table

Participant list display:
- Show avatar next to each participant name

### 10. Admin Panel
**File to create:** `app/admin/page.tsx`

Features:
- List all users with permissions
- Search/filter by name, nickname, or email
- Toggle `can_create_events` permission
- Show user stats (events created, events joined)

**Only accessible by users with role = 'ADMIN'**

### 11. Admin APIs
**Files to create:**
- `app/api/admin/users/route.ts` - List all users
- `app/api/admin/grant-permission/route.ts` - Toggle can_create_events

Both must check if user.role = 'ADMIN'

### 12. Default Avatar
**File to add:** `public/default-avatar.png`

Create or download a simple default avatar image.

### 13. Update Terminology
**Files to update:**
- `app/dashboard/page.tsx` - Change "Organizer Dashboard" to "My Events"
- Any references to "organizer" should be "user" or "event creator"

### 14. CHANGELOG
Document all changes made in this implementation.

---

## 🔑 KEY CHANGES SUMMARY

### Authentication Flow
- **Before:** Login with email only
- **After:** Login with email OR nickname

### Registration
- **Before:** Name, email, phone, password
- **After:** Full Name, Nickname, email, phone (optional), password

### User Permissions
- **Before:** `admin_approved` boolean (admin manually approves)
- **After:** `can_create_events` boolean (admin grants permission in admin panel)

### User Roles
- **Before:** 'ADMIN' | 'ORGANIZER'
- **After:** 'ADMIN' | 'USER'

### Default State
- **Before:** New users could create events after email verification and admin approval
- **After:** New users can only join events. Admin must grant `can_create_events` permission

---

## 📋 TESTING CHECKLIST

After completing all todos:

1. **Registration:**
   - [ ] Can register with full_name and nickname
   - [ ] Nickname must be unique
   - [ ] Phone is optional
   - [ ] New users have `can_create_events = false`

2. **Login:**
   - [ ] Can login with email
   - [ ] Can login with nickname (case-insensitive)
   - [ ] Wrong nickname shows error

3. **Profile:**
   - [ ] Can view own profile
   - [ ] Can edit bio, age, weight, height
   - [ ] Can change nickname (check 30-day restriction)
   - [ ] Cannot change full_name
   - [ ] Cannot change email

4. **Permissions:**
   - [ ] Users without `can_create_events` cannot access `/create`
   - [ ] Admin can grant permission in admin panel
   - [ ] After permission granted, user can create events

5. **Event Joining:**
   - [ ] Non-logged-in users can join (enter name manually)
   - [ ] Logged-in users see auto-fill options
   - [ ] Avatar shows in participant list

6. **Admin Panel:**
   - [ ] Only admins can access
   - [ ] Can see all users
   - [ ] Can toggle permissions
   - [ ] Search/filter works

---

## 💡 IMPORTANT NOTES

1. **Run migrations FIRST** before testing anything
2. All existing users will get `nickname` auto-generated from email (e.g., user@example.com → "user")
3. Existing users keep their current `admin_approved` status as `can_create_events`
4. Default avatar is `/default-avatar.png` for all users
5. `organizers` table is still called "organizers" (didn't rename to avoid breaking changes)

---

## 🐛 POTENTIAL ISSUES TO WATCH

1. **Nickname uniqueness:** Ensure case-insensitive uniqueness (done via index)
2. **30-day restriction:** Need to implement in profile edit form
3. **Avatar upload:** Currently just default, upload feature needed later
4. **RLS policies:** Test that users can't bypass permission checks
5. **Admin safety:** Ensure non-admins can't access admin endpoints

---

**Next step:** Run the database migrations in Supabase Dashboard!
