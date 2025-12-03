-- Add timer columns to matches table
-- timer_started_at: stores when the game timer was started
-- timer_paused_remaining: stores remaining seconds when timer is paused

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS timer_paused_remaining INTEGER DEFAULT NULL;

-- Create an index for faster queries on matches with running timers
CREATE INDEX IF NOT EXISTS idx_matches_timer_started_at ON matches(timer_started_at) WHERE timer_started_at IS NOT NULL;

