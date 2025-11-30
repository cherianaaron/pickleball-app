-- Supabase Schema for Pickleball Tournament App
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Pickleball Championship',
  rounds INTEGER DEFAULT 0,
  is_started BOOLEAN DEFAULT FALSE,
  is_complete BOOLEAN DEFAULT FALSE,
  champion_id UUID,
  -- Game settings
  score_limit INTEGER DEFAULT 11,
  win_by_two BOOLEAN DEFAULT TRUE,
  game_timer_minutes INTEGER DEFAULT NULL,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
  score1 INTEGER,
  score2 INTEGER,
  winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for champion after players table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_champion'
  ) THEN
    ALTER TABLE tournaments 
      ADD CONSTRAINT fk_champion 
      FOREIGN KEY (champion_id) 
      REFERENCES players(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(tournament_id, round);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow all operations on tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow all operations on players" ON players;
DROP POLICY IF EXISTS "Allow all operations on matches" ON matches;
DROP POLICY IF EXISTS "Allow all on tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow all on players" ON players;
DROP POLICY IF EXISTS "Allow all on matches" ON matches;

-- Create policies to allow all operations (for public access)
CREATE POLICY "Allow all on tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on matches" ON matches FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
