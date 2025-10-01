require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function migrateToUUID() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    console.log('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
    console.log('You can find it in: Supabase Dashboard > Project Settings > API > service_role key')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('Connected to Supabase')

    // Execute raw SQL to drop and recreate tables
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing tables
        DROP TABLE IF EXISTS participants CASCADE;
        DROP TABLE IF EXISTS events CASCADE;
        DROP TABLE IF EXISTS organizers CASCADE;

        -- Create organizers table with UUID
        CREATE TABLE organizers (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'ORGANIZER',
          email_verified BOOLEAN DEFAULT FALSE,
          phone_verified BOOLEAN DEFAULT FALSE,
          admin_approved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create events table with UUID organizer_id
        CREATE TABLE events (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          location TEXT NOT NULL,
          total_cost DECIMAL(10, 2) NOT NULL,
          max_players INTEGER NOT NULL,
          price_per_player DECIMAL(10, 2) NOT NULL,
          organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Recreate participants table
        CREATE TABLE participants (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          payment_status TEXT NOT NULL,
          stripe_session_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (error) {
      throw error
    }

    console.log('✅ Migration complete!')
    console.log('Tables recreated with UUID support')
    console.log('You can now register new users with Supabase Auth')

  } catch (error) {
    console.error('Migration error:', error.message)
    console.log('\n⚠️  RPC function not available. Please run these SQL commands manually in Supabase SQL Editor:')
    console.log(`
-- Drop existing tables
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;

-- Create organizers table with UUID
CREATE TABLE organizers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'ORGANIZER',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  admin_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table with UUID organizer_id
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  max_players INTEGER NOT NULL,
  price_per_player DECIMAL(10, 2) NOT NULL,
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate participants table
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    `)
  }
}

migrateToUUID()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
