-- Migration: Add Google OAuth support to users table
-- Run this in Supabase SQL Editor

-- Add new columns for OAuth support
ALTER TABLE users 
  ALTER COLUMN password DROP NOT NULL;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create index for auth_user_id
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Update existing users to have email_verified = true
UPDATE users SET email_verified = TRUE WHERE password IS NOT NULL;
