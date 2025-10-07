-- Add city column to events table
-- This enables filtering events by city

-- Add the city column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update existing events with a default city (you can change this as needed)
UPDATE events
SET city = 'Warsaw'
WHERE city IS NULL;

-- Make city required for future events
ALTER TABLE events
ALTER COLUMN city SET NOT NULL;

-- Create an index for faster city filtering
CREATE INDEX IF NOT EXISTS events_city_idx ON events(city);

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name = 'city';
