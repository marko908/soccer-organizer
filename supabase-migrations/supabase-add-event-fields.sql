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
-- Note: You may want to set end_time to date + 2 hours for existing events
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
