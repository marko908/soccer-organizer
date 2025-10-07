-- Fix missing updated_at column in participants table
-- Run this in Supabase SQL Editor

-- Add updated_at column to participants table
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add trigger to auto-update the timestamp
CREATE OR REPLACE FUNCTION update_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_participants_timestamp ON participants;
CREATE TRIGGER trigger_update_participants_timestamp
BEFORE UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION update_participants_updated_at();

-- Verify the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'participants' AND column_name = 'updated_at';
