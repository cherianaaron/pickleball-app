-- Round Robin Tables for Pickleball Tournament App
-- Run this SQL in your Supabase SQL Editor

-- First, create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Round Robin Tournaments
CREATE TABLE IF NOT EXISTS round_robin_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Round Robin Championship',
  score_limit INTEGER DEFAULT 11,
  num_courts INTEGER DEFAULT 3,
  is_pool_play_complete BOOLEAN DEFAULT FALSE,
  is_playoffs_started BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Round Robin Pools (Pool A, Pool B, etc.)
CREATE TABLE IF NOT EXISTS round_robin_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES round_robin_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Round Robin Teams
CREATE TABLE IF NOT EXISTS round_robin_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES round_robin_tournaments(id) ON DELETE CASCADE,
  pool_id UUID REFERENCES round_robin_pools(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Round Robin Matches (Pool Play)
CREATE TABLE IF NOT EXISTS round_robin_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES round_robin_pools(id) ON DELETE CASCADE,
  team1_id UUID REFERENCES round_robin_teams(id) ON DELETE CASCADE,
  team2_id UUID REFERENCES round_robin_teams(id) ON DELETE CASCADE,
  match_number INTEGER NOT NULL,
  score1 INTEGER,
  score2 INTEGER,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Round Robin tables
CREATE INDEX IF NOT EXISTS idx_rr_pools_tournament ON round_robin_pools(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rr_teams_tournament ON round_robin_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_rr_teams_pool ON round_robin_teams(pool_id);
CREATE INDEX IF NOT EXISTS idx_rr_matches_pool ON round_robin_matches(pool_id);

-- Enable RLS for Round Robin tables
ALTER TABLE round_robin_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_robin_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_robin_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_robin_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all on round_robin_tournaments" ON round_robin_tournaments;
DROP POLICY IF EXISTS "Allow all on round_robin_pools" ON round_robin_pools;
DROP POLICY IF EXISTS "Allow all on round_robin_teams" ON round_robin_teams;
DROP POLICY IF EXISTS "Allow all on round_robin_matches" ON round_robin_matches;

-- Create policies for Round Robin tables (allow all operations)
CREATE POLICY "Allow all on round_robin_tournaments" ON round_robin_tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on round_robin_pools" ON round_robin_pools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on round_robin_teams" ON round_robin_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on round_robin_matches" ON round_robin_matches FOR ALL USING (true) WITH CHECK (true);

-- Trigger for round_robin_tournaments updated_at
DROP TRIGGER IF EXISTS update_rr_tournaments_updated_at ON round_robin_tournaments;
CREATE TRIGGER update_rr_tournaments_updated_at
  BEFORE UPDATE ON round_robin_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for round_robin_matches updated_at
DROP TRIGGER IF EXISTS update_rr_matches_updated_at ON round_robin_matches;
CREATE TRIGGER update_rr_matches_updated_at
  BEFORE UPDATE ON round_robin_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

