-- Seed script: Create 15 sample users with varied information
-- Run this in Supabase SQL Editor

-- Note: These users won't be able to login (no auth.users entries)
-- They are for demonstration purposes only

-- Delete existing seed users if any
DELETE FROM users WHERE email LIKE '%@example.com';

-- Insert 15 sample users
INSERT INTO users (id, email, full_name, nickname, phone, role, avatar_url, bio, age, weight, height, can_create_events, email_verified, phone_verified, created_at)
VALUES
  -- User 1: Complete profile, organizer
  (gen_random_uuid(), 'john.smith@example.com', 'John Smith', 'johnny_goals', '+48123456701', 'USER', '/default-avatar.svg',
   'Passionate football player and coach. Love organizing weekend matches! ⚽ Playing since 2010.',
   28, 75, 178, true, true, false, NOW() - INTERVAL '2 years'),

  -- User 2: Admin with full info
  (gen_random_uuid(), 'admin.demo@example.com', 'Michael Johnson', 'admin_mike', '+48123456702', 'ADMIN', '/default-avatar.svg',
   'System administrator and football enthusiast. Managing the platform and playing every weekend!',
   32, 82, 185, true, true, true, NOW() - INTERVAL '3 years'),

  -- User 3: Organizer with partial info
  (gen_random_uuid(), 'sarah.williams@example.com', 'Sarah Williams', 'sarah_kicks', '+48123456703', 'USER', '/default-avatar.svg',
   'Football lover and event organizer. Always looking for new players to join our community! 🎯',
   25, 62, 165, true, true, false, NOW() - INTERVAL '1 year'),

  -- User 4: Regular user, full stats
  (gen_random_uuid(), 'david.brown@example.com', 'David Brown', 'dave_striker', NULL, 'USER', '/default-avatar.svg',
   'Striker position. Fast and passionate about scoring goals. Available on weekends.',
   30, 78, 180, false, true, false, NOW() - INTERVAL '8 months'),

  -- User 5: Minimal info user
  (gen_random_uuid(), 'emma.jones@example.com', 'Emma Jones', 'emma_j', NULL, 'USER', '/default-avatar.svg',
   NULL, NULL, NULL, NULL, false, false, false, NOW() - INTERVAL '2 months'),

  -- User 6: Bio only, no stats
  (gen_random_uuid(), 'chris.martinez@example.com', 'Chris Martinez', 'chris_m', '+48123456706', 'USER', '/default-avatar.svg',
   'Just started playing football. Looking forward to meeting new teammates and improving my skills!',
   NULL, NULL, NULL, false, true, false, NOW() - INTERVAL '3 months'),

  -- User 7: Stats only, no bio
  (gen_random_uuid(), 'lisa.garcia@example.com', 'Lisa Garcia', 'lisa_defender', NULL, 'USER', '/default-avatar.svg',
   NULL, 27, 60, 170, false, true, false, NOW() - INTERVAL '1 year 3 months'),

  -- User 8: Organizer with medium info
  (gen_random_uuid(), 'robert.miller@example.com', 'Robert Miller', 'rob_coach', '+48123456708', 'USER', '/default-avatar.svg',
   'Former semi-pro player, now organizing amateur leagues. Let''s play!',
   35, 85, 183, true, true, true, NOW() - INTERVAL '2 years 6 months'),

  -- User 9: Young player, full profile
  (gen_random_uuid(), 'alex.davis@example.com', 'Alex Davis', 'alex_speedster', NULL, 'USER', '/default-avatar.svg',
   'Young and energetic midfielder. Love fast-paced games and team coordination. Available anytime! ⚡',
   22, 70, 175, false, true, false, NOW() - INTERVAL '5 months'),

  -- User 10: No bio, no stats
  (gen_random_uuid(), 'patricia.wilson@example.com', 'Patricia Wilson', 'patty_w', NULL, 'USER', '/default-avatar.svg',
   NULL, NULL, NULL, NULL, false, false, false, NOW() - INTERVAL '1 month'),

  -- User 11: Veteran organizer
  (gen_random_uuid(), 'james.anderson@example.com', 'James Anderson', 'james_veteran', '+48123456711', 'USER', '/default-avatar.svg',
   'Playing football for 20+ years. Organizing tournaments and friendly matches. Everyone is welcome regardless of skill level! 🏆',
   42, 88, 182, true, true, true, NOW() - INTERVAL '4 years'),

  -- User 12: Bio with emoji, partial stats
  (gen_random_uuid(), 'sophia.taylor@example.com', 'Sophia Taylor', 'sophia_star', '+48123456712', 'USER', '/default-avatar.svg',
   '⭐ Football is life! Weekend warrior and team player. Always bringing positive energy to the field! 💪',
   26, NULL, 168, false, true, false, NOW() - INTERVAL '7 months'),

  -- User 13: Minimal user
  (gen_random_uuid(), 'daniel.thomas@example.com', 'Daniel Thomas', 'danny_t', NULL, 'USER', '/default-avatar.svg',
   NULL, NULL, NULL, NULL, false, false, false, NOW() - INTERVAL '2 weeks'),

  -- User 14: New organizer with enthusiasm
  (gen_random_uuid(), 'olivia.jackson@example.com', 'Olivia Jackson', 'olivia_organizer', '+48123456714', 'USER', '/default-avatar.svg',
   'New to organizing but passionate about bringing people together for great games. Always learning and improving! 📚⚽',
   29, 65, 172, true, true, false, NOW() - INTERVAL '4 months'),

  -- User 15: Complete profile, experienced player
  (gen_random_uuid(), 'william.white@example.com', 'William White', 'will_goalie', '+48123456715', 'USER', '/default-avatar.svg',
   'Goalkeeper with 10 years of experience. Reliable, communicative, and always ready to save the day! 🧤 Looking for regular games.',
   31, 80, 188, false, true, true, NOW() - INTERVAL '1 year 8 months');

-- Verify the insert
SELECT
  full_name,
  nickname,
  CASE
    WHEN bio IS NOT NULL THEN '✓ Bio'
    ELSE '✗ No bio'
  END as bio_status,
  CASE
    WHEN age IS NOT NULL OR weight IS NOT NULL OR height IS NOT NULL THEN '✓ Stats'
    ELSE '✗ No stats'
  END as stats_status,
  can_create_events as organizer,
  role
FROM users
WHERE email LIKE '%@example.com'
ORDER BY created_at DESC;

-- Summary statistics
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN bio IS NOT NULL THEN 1 END) as with_bio,
  COUNT(CASE WHEN age IS NOT NULL THEN 1 END) as with_age,
  COUNT(CASE WHEN can_create_events = true THEN 1 END) as organizers,
  COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
FROM users
WHERE email LIKE '%@example.com';
