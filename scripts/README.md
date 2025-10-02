# Scripts

## Seed Users

Creates 15 sample users for testing and development.

### Prerequisites

1. Get your Supabase Service Role Key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` secret key (NOT the anon key!)

2. Add to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Usage

```bash
# Run the seed script
node scripts/seed-users.js
```

### Sample Users Created

The script creates 15 users with varied profiles:

| Email | Nickname | Password | Role | Can Create Events | Notes |
|-------|----------|----------|------|-------------------|-------|
| john.smith@example.com | johnny_goals | Password123! | USER | ✅ | Complete profile with bio & stats |
| admin.demo@example.com | admin_mike | Password123! | ADMIN | ✅ | Admin account |
| sarah.williams@example.com | sarah_kicks | Password123! | USER | ✅ | Organizer with partial info |
| david.brown@example.com | dave_striker | Password123! | USER | ❌ | Full stats, no bio |
| emma.jones@example.com | emma_j | Password123! | USER | ❌ | Minimal info |
| chris.martinez@example.com | chris_m | Password123! | USER | ❌ | Bio only, no stats |
| lisa.garcia@example.com | lisa_defender | Password123! | USER | ❌ | Stats only, no bio |
| robert.miller@example.com | rob_coach | Password123! | USER | ✅ | Former semi-pro |
| alex.davis@example.com | alex_speedster | Password123! | USER | ❌ | Young player, full profile |
| patricia.wilson@example.com | patty_w | Password123! | USER | ❌ | Minimal info |
| james.anderson@example.com | james_veteran | Password123! | USER | ✅ | Veteran organizer (20+ years) |
| sophia.taylor@example.com | sophia_star | Password123! | USER | ❌ | Bio with emojis |
| daniel.thomas@example.com | danny_t | Password123! | USER | ❌ | Minimal info |
| olivia.jackson@example.com | olivia_organizer | Password123! | USER | ✅ | New enthusiastic organizer |
| william.white@example.com | will_goalie | Password123! | USER | ❌ | Experienced goalkeeper |

### Test Login

```
Email: john.smith@example.com
Password: Password123!
```

Or visit public profiles:
- https://soccer-organizer.vercel.app/u/johnny_goals
- https://soccer-organizer.vercel.app/u/admin_mike
- https://soccer-organizer.vercel.app/u/emma_j

### Notes

- All users are auto-verified (email_confirm: true)
- Users can login immediately
- Script skips users that already exist
- Safe to run multiple times
