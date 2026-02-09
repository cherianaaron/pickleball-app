-- Migration: Add is_admin column for super access
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Add is_admin column
-- ============================================
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create an index for faster admin lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_admin 
ON user_subscriptions(is_admin) 
WHERE is_admin = true;

-- ============================================
-- STEP 2: Backfill subscription records for ALL existing users
-- This creates a free tier record for any user who doesn't have one
-- ============================================
INSERT INTO user_subscriptions (user_id, tier, status, is_admin)
SELECT 
  au.id as user_id,
  'free' as tier,
  'active' as status,
  false as is_admin
FROM auth.users au
LEFT JOIN user_subscriptions us ON au.id = us.user_id
WHERE us.user_id IS NULL;

-- ============================================
-- STEP 3: Ensure RLS allows users to read their own is_admin flag
-- (This may already be covered by existing policies)
-- ============================================
-- Check if your existing RLS policy includes is_admin in the select
-- If you have a policy like "Users can read own subscription", it should work
-- If not, you may need to update it

-- ============================================
-- ADMIN MANAGEMENT COMMANDS
-- ============================================

-- Grant admin access to a user by email:
-- UPDATE user_subscriptions 
-- SET is_admin = true 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'admin@picklebracket.app'
-- );

-- Revoke admin access:
-- UPDATE user_subscriptions 
-- SET is_admin = false 
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- View all admin users:
-- SELECT us.*, au.email 
-- FROM user_subscriptions us
-- JOIN auth.users au ON us.user_id = au.id
-- WHERE us.is_admin = true;

-- View all users without subscription records (should be empty after backfill):
-- SELECT au.id, au.email 
-- FROM auth.users au
-- LEFT JOIN user_subscriptions us ON au.id = us.user_id
-- WHERE us.user_id IS NULL;
