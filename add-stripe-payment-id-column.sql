-- Add stripe_payment_intent_id column to participants table
-- Run this in Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Add index for faster lookups when querying by Stripe payment intent ID
CREATE INDEX IF NOT EXISTS idx_participants_stripe_payment_intent
ON participants(stripe_payment_intent_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'participants'
ORDER BY ordinal_position;
