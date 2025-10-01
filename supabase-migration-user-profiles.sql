-- =====================================================
-- FOOTHUB - User Profile System Migration
-- =====================================================
-- Run this in Supabase SQL Editor
-- Date: 2025-10-01
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMNS TO ORGANIZERS TABLE
-- =====================================================

-- Required fields for all users
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Profile fields (all optional)
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/default-avatar.svg',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS nickname_last_changed TIMESTAMP DEFAULT NOW();

-- Permission field (replaces admin_approved)
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS can_create_events BOOLEAN DEFAULT false;

-- =====================================================
-- 2. MIGRATE EXISTING DATA
-- =====================================================

-- Copy existing 'name' to 'full_name' for existing users
UPDATE organizers
SET full_name = name
WHERE full_name IS NULL;

-- Generate nicknames from email for existing users (temporary, they can change later)
UPDATE organizers
SET nickname = SPLIT_PART(email, '@', 1)
WHERE nickname IS NULL;

-- Migrate admin_approved to can_create_events
UPDATE organizers
SET can_create_events = admin_approved
WHERE can_create_events IS NULL OR can_create_events = false;

-- =====================================================
-- 3. ADD CONSTRAINTS
-- =====================================================

-- Make full_name and nickname required
ALTER TABLE organizers
ALTER COLUMN full_name SET NOT NULL;

ALTER TABLE organizers
ALTER COLUMN nickname SET NOT NULL;

-- Make nickname unique (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS organizers_nickname_unique
ON organizers (LOWER(nickname));

-- =====================================================
-- 4. UPDATE PARTICIPANTS TABLE
-- =====================================================

-- Add user_id to link logged-in participants to their profiles
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES organizers(id) ON DELETE SET NULL;

-- Add avatar_url to show in participant lists
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/default-avatar.png';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS participants_user_id_idx ON participants(user_id);

-- =====================================================
-- 5. OPTIONAL: REMOVE OLD COLUMNS (After confirming migration works)
-- =====================================================

-- Uncomment these after confirming the migration works:
-- ALTER TABLE organizers DROP COLUMN IF EXISTS admin_approved;
-- ALTER TABLE organizers DROP COLUMN IF EXISTS approved_at;
-- ALTER TABLE organizers DROP COLUMN IF EXISTS approved_by;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that all users have required fields
-- SELECT id, email, full_name, nickname, can_create_events, avatar_url
-- FROM organizers
-- WHERE full_name IS NULL OR nickname IS NULL;

-- Check for duplicate nicknames (should return 0 rows)
-- SELECT LOWER(nickname), COUNT(*)
-- FROM organizers
-- GROUP BY LOWER(nickname)
-- HAVING COUNT(*) > 1;

-- View updated schema
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'organizers'
-- ORDER BY ordinal_position;
