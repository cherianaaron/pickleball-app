-- Migration: Add is_admin column for super access
-- Run this in Supabase SQL Editor

-- Add is_admin column to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create an index for faster admin lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_admin 
ON user_subscriptions(is_admin) 
WHERE is_admin = true;

-- Example: Grant admin access to a user by email
-- UPDATE user_subscriptions 
-- SET is_admin = true 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'admin@picklebracket.app'
-- );

-- Example: View all admin users
-- SELECT us.*, au.email 
-- FROM user_subscriptions us
-- JOIN auth.users au ON us.user_id = au.id
-- WHERE us.is_admin = true;
