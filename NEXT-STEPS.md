# Remaining Implementation Tasks

## ✅ COMPLETED (8/15 tasks)

1. Database schema migrations
2. RLS policies updated
3. AuthContext with new fields
4. Registration with full_name + nickname
5. Login with email OR nickname
6. Database migrations run successfully
7. Default avatar added (`/default-avatar.svg`)
8. Profile API endpoints (`/api/profile`)
9. User profile page (`/app/profile/page.tsx`)

## 🚧 TODO (Remaining 6 tasks)

### 1. Add Profile Navigation to Layout
**File:** `app/layout.tsx` or create a header component

Add top-right dropdown menu:
```tsx
<div className="dropdown">
  <Image src={user.avatarUrl} />
  <div className="dropdown-menu">
    <Link href="/profile">My Profile</Link>
    <Link href="/dashboard">My Events</Link>
    <button onClick={logout}>Logout</button>
  </div>
</div>
```

### 2. Update Event Joining with Avatar & Auto-fill
**File:** `app/event/[id]/page.tsx`

Changes needed:
- For logged-in users: show name selection (Full Name / Nickname / Both)
- Auto-fill name field based on selection
- Save `user_id` and `avatar_url` when joining
- Display avatars in participant list

### 3. Create Admin Panel
**File:** `app/admin/page.tsx`

Features:
- Check if user.role === 'ADMIN' (redirect if not)
- List all users in a table
- Search/filter functionality
- Toggle `can_create_events` permission
- Show user stats

### 4. Create Admin APIs
**Files:**
- `app/api/admin/users/route.ts` - GET list of users
- `app/api/admin/grant-permission/route.ts` - PATCH toggle permission

Both need admin role check.

### 5. Update Dashboard Terminology
**File:** `app/dashboard/page.tsx`

- Change "Organizer Dashboard" → "My Events"
- Update any "organizer" references to "user" or "event creator"

### 6. Update CHANGELOG
Document all changes made in this implementation.

## 📝 Quick Implementation Guide

### Profile Navigation (15 min)
Check if there's a navigation component or update layout.tsx.
Add user avatar + dropdown menu in top-right.

### Event Joining (30 min)
1. Check if user is logged in
2. If yes, show radio buttons for name selection
3. Update participant creation to include user_id and avatar_url
4. Update participant list to show avatars

### Admin Panel (45 min)
1. Create `/admin` page with role check
2. Fetch users from `/api/admin/users`
3. Display in table with toggle switches
4. Call `/api/admin/grant-permission` to toggle

### Admin APIs (20 min)
1. Create GET endpoint for users list
2. Create PATCH endpoint for permission toggle
3. Both must verify user.role === 'ADMIN'

### Dashboard (5 min)
Simple text changes in dashboard page.

### CHANGELOG (10 min)
Add new section documenting all changes.

---

## 🔑 Current System Status

**Database:** ✅ Migrated with all new fields
**RLS:** ✅ Updated to use `can_create_events`
**Auth:** ✅ Login with email OR nickname working
**Registration:** ✅ Collects full_name + nickname
**Profile:** ✅ Users can edit their profile

**What users can do now:**
- Register with full name + nickname
- Login with email or nickname
- View and edit their profile
- Change nickname (once per 30 days)

**What's NOT working yet:**
- No profile navigation (can't access `/profile` easily)
- Event joining doesn't show avatar or auto-fill
- No admin panel to grant permissions
- All new users have `can_create_events = false` (can't create events)

**CRITICAL:** You need an admin user with `can_create_events = true` to test event creation!

### Make yourself admin:
```sql
UPDATE organizers
SET role = 'ADMIN', can_create_events = true
WHERE email = 'your@email.com';
```

---

Total estimated time to finish: **~2 hours**
