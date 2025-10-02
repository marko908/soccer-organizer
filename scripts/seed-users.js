// Seed script: Create 15 real users using Supabase Admin API
// These users will be able to login with password: "Password123!"

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error('\nMake sure .env.local contains both variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const users = [
  // User 1: Complete profile, organizer
  {
    email: 'john.smith@example.com',
    password: 'Password123!',
    fullName: 'John Smith',
    nickname: 'johnny_goals',
    phone: '+48123456701',
    bio: 'Passionate football player and coach. Love organizing weekend matches! ⚽ Playing since 2010.',
    age: 28,
    weight: 75,
    height: 178,
    canCreateEvents: true,
  },

  // User 2: Admin with full info
  {
    email: 'admin.demo@example.com',
    password: 'Password123!',
    fullName: 'Michael Johnson',
    nickname: 'admin_mike',
    phone: '+48123456702',
    role: 'ADMIN',
    bio: 'System administrator and football enthusiast. Managing the platform and playing every weekend!',
    age: 32,
    weight: 82,
    height: 185,
    canCreateEvents: true,
  },

  // User 3: Organizer with partial info
  {
    email: 'sarah.williams@example.com',
    password: 'Password123!',
    fullName: 'Sarah Williams',
    nickname: 'sarah_kicks',
    phone: '+48123456703',
    bio: 'Football lover and event organizer. Always looking for new players to join our community! 🎯',
    age: 25,
    weight: 62,
    height: 165,
    canCreateEvents: true,
  },

  // User 4: Regular user, full stats
  {
    email: 'david.brown@example.com',
    password: 'Password123!',
    fullName: 'David Brown',
    nickname: 'dave_striker',
    bio: 'Striker position. Fast and passionate about scoring goals. Available on weekends.',
    age: 30,
    weight: 78,
    height: 180,
  },

  // User 5: Minimal info user
  {
    email: 'emma.jones@example.com',
    password: 'Password123!',
    fullName: 'Emma Jones',
    nickname: 'emma_j',
  },

  // User 6: Bio only, no stats
  {
    email: 'chris.martinez@example.com',
    password: 'Password123!',
    fullName: 'Chris Martinez',
    nickname: 'chris_m',
    phone: '+48123456706',
    bio: 'Just started playing football. Looking forward to meeting new teammates and improving my skills!',
  },

  // User 7: Stats only, no bio
  {
    email: 'lisa.garcia@example.com',
    password: 'Password123!',
    fullName: 'Lisa Garcia',
    nickname: 'lisa_defender',
    age: 27,
    weight: 60,
    height: 170,
  },

  // User 8: Organizer with medium info
  {
    email: 'robert.miller@example.com',
    password: 'Password123!',
    fullName: 'Robert Miller',
    nickname: 'rob_coach',
    phone: '+48123456708',
    bio: 'Former semi-pro player, now organizing amateur leagues. Let\'s play!',
    age: 35,
    weight: 85,
    height: 183,
    canCreateEvents: true,
  },

  // User 9: Young player, full profile
  {
    email: 'alex.davis@example.com',
    password: 'Password123!',
    fullName: 'Alex Davis',
    nickname: 'alex_speedster',
    bio: 'Young and energetic midfielder. Love fast-paced games and team coordination. Available anytime! ⚡',
    age: 22,
    weight: 70,
    height: 175,
  },

  // User 10: No bio, no stats
  {
    email: 'patricia.wilson@example.com',
    password: 'Password123!',
    fullName: 'Patricia Wilson',
    nickname: 'patty_w',
  },

  // User 11: Veteran organizer
  {
    email: 'james.anderson@example.com',
    password: 'Password123!',
    fullName: 'James Anderson',
    nickname: 'james_veteran',
    phone: '+48123456711',
    bio: 'Playing football for 20+ years. Organizing tournaments and friendly matches. Everyone is welcome regardless of skill level! 🏆',
    age: 42,
    weight: 88,
    height: 182,
    canCreateEvents: true,
  },

  // User 12: Bio with emoji, partial stats
  {
    email: 'sophia.taylor@example.com',
    password: 'Password123!',
    fullName: 'Sophia Taylor',
    nickname: 'sophia_star',
    phone: '+48123456712',
    bio: '⭐ Football is life! Weekend warrior and team player. Always bringing positive energy to the field! 💪',
    age: 26,
    height: 168,
  },

  // User 13: Minimal user
  {
    email: 'daniel.thomas@example.com',
    password: 'Password123!',
    fullName: 'Daniel Thomas',
    nickname: 'danny_t',
  },

  // User 14: New organizer with enthusiasm
  {
    email: 'olivia.jackson@example.com',
    password: 'Password123!',
    fullName: 'Olivia Jackson',
    nickname: 'olivia_organizer',
    phone: '+48123456714',
    bio: 'New to organizing but passionate about bringing people together for great games. Always learning and improving! 📚⚽',
    age: 29,
    weight: 65,
    height: 172,
    canCreateEvents: true,
  },

  // User 15: Complete profile, experienced player
  {
    email: 'william.white@example.com',
    password: 'Password123!',
    fullName: 'William White',
    nickname: 'will_goalie',
    phone: '+48123456715',
    bio: 'Goalkeeper with 10 years of experience. Reliable, communicative, and always ready to save the day! 🧤 Looking for regular games.',
    age: 31,
    weight: 80,
    height: 188,
  },
]

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n')

  let created = 0
  let skipped = 0
  let errors = 0

  for (const userData of users) {
    try {
      console.log(`📝 Creating user: ${userData.email}`)

      // Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.fullName,
          nickname: userData.nickname,
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  User already exists, skipping...`)
          skipped++
          continue
        }
        throw authError
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`)

      // Create profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          nickname: userData.nickname,
          phone: userData.phone || null,
          role: userData.role || 'USER',
          avatar_url: '/default-avatar.svg',
          bio: userData.bio || null,
          age: userData.age || null,
          weight: userData.weight || null,
          height: userData.height || null,
          can_create_events: userData.canCreateEvents || false,
          email_verified: true,
          phone_verified: false,
        })

      if (profileError) {
        console.error(`   ❌ Profile creation failed:`, profileError.message)
        errors++
        continue
      }

      console.log(`   ✅ Profile created: @${userData.nickname}\n`)
      created++

    } catch (error) {
      console.error(`   ❌ Error creating user:`, error.message, '\n')
      errors++
    }
  }

  console.log('═══════════════════════════════════════')
  console.log('🎉 Seeding complete!')
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⚠️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors:  ${errors}`)
  console.log('═══════════════════════════════════════')
  console.log('\n📌 All users have password: Password123!')
  console.log('📌 Test login: john.smith@example.com / Password123!')
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
