# Database Migration Instructions

## ⚠️ IMPORTANT: Run this SQL in Supabase BEFORE creating events with new fields

The app has been updated with new soccer-specific fields, but the database needs to be updated first.

## Step-by-Step Instructions:

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New query"

### 3. Copy and Paste the SQL Below

```sql
-- Migration: Add soccer-specific fields to events table
-- Date: 2025-10-05
-- Description: Add end_time, players_per_team, field_type, cleats_allowed, min_players

-- Add new columns to events table
ALTER TABLE events
  ADD COLUMN end_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN players_per_team INTEGER DEFAULT 6,
  ADD COLUMN field_type TEXT DEFAULT 'artificial_grass',
  ADD COLUMN cleats_allowed BOOLEAN DEFAULT true,
  ADD COLUMN min_players INTEGER DEFAULT 10;

-- Add constraints
ALTER TABLE events
  ADD CONSTRAINT check_end_time_after_start CHECK (end_time > date),
  ADD CONSTRAINT check_min_max_players CHECK (min_players < max_players),
  ADD CONSTRAINT check_players_per_team CHECK (players_per_team >= 2 AND players_per_team <= 11),
  ADD CONSTRAINT check_field_type CHECK (field_type IN ('futsal', 'artificial_grass', 'natural_grass'));

-- Update max_players constraint (increase from 30 to 50)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_max_players_check;
ALTER TABLE events
  ADD CONSTRAINT check_max_players CHECK (max_players >= 2 AND max_players <= 50);

-- Add comments for documentation
COMMENT ON COLUMN events.end_time IS 'End time of the soccer game';
COMMENT ON COLUMN events.players_per_team IS 'Number of players per team (e.g., 6 for 6v6, 7 for 7v7, 11 for 11v11)';
COMMENT ON COLUMN events.field_type IS 'Type of soccer field: futsal, artificial_grass, or natural_grass';
COMMENT ON COLUMN events.cleats_allowed IS 'Whether cleats/studs are allowed on this field';
COMMENT ON COLUMN events.min_players IS 'Minimum number of players required to start the game';

-- Update existing events with default values if needed
-- Note: This sets end_time to date + 2 hours for existing events
UPDATE events
SET
  end_time = date + INTERVAL '2 hours',
  players_per_team = 7,
  field_type = 'artificial_grass',
  cleats_allowed = true,
  min_players = LEAST(10, max_players - 2)
WHERE end_time IS NULL;

-- Make end_time NOT NULL after setting defaults
ALTER TABLE events ALTER COLUMN end_time SET NOT NULL;
```

### 4. Run the Query
- Click "Run" button (or press Ctrl+Enter / Cmd+Enter)
- You should see "Success. No rows returned"

### 5. Verify the Migration
Run this query to check if columns were added:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

You should see the new columns:
- `end_time` - timestamp with time zone
- `players_per_team` - integer
- `field_type` - text
- `cleats_allowed` - boolean
- `min_players` - integer

## What This Migration Does:

1. **Adds new columns** for soccer-specific data
2. **Sets default values** for new columns
3. **Updates existing events** with sensible defaults (end_time = start + 2 hours, etc.)
4. **Adds validation constraints** to ensure data quality
5. **Increases max_players limit** from 30 to 50

## After Migration:

✅ You can now create events with:
- Time ranges (start and end time)
- Players per team (6v6, 7v7, etc.)
- Field type (Futsal, Artificial Grass, Natural Grass)
- Cleats allowed/not allowed
- Min/max player ranges

## Troubleshooting:

**Error: "column already exists"**
- The migration has already been run. You're good to go!

**Error: "constraint already exists"**
- Some constraints already exist. You can ignore this or drop them first with:
```sql
ALTER TABLE events DROP CONSTRAINT IF EXISTS constraint_name_here;
```

**Error: "check constraint violated"**
- There might be existing data that violates the new rules
- Check your existing events and fix any issues before adding constraints
