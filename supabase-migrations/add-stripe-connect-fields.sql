-- Add Stripe Connect fields to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);

-- Comment the columns
COMMENT ON COLUMN users.stripe_account_id IS 'Stripe Connect account ID for receiving payments';
COMMENT ON COLUMN users.stripe_onboarding_complete IS 'Whether the user completed Stripe Connect onboarding';
COMMENT ON COLUMN users.stripe_charges_enabled IS 'Whether the account can accept charges';
COMMENT ON COLUMN users.stripe_payouts_enabled IS 'Whether the account can receive payouts';
