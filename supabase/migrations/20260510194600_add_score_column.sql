/*
  # Add Score Column for Point-Based Scoring

  ## Changes

  ### Modified Tables
  - `players` - Add `score` column (integer) - points earned this session
  - `player_stats` - Add `score` column (integer) - total all-time points

  ## Scoring Rules
  1. Players who correctly voted for the liar get 1 point each
  2. The liar gets 1 point if they escape (not caught)
  3. Everyone else gets 0 points
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'score') THEN
    ALTER TABLE players ADD COLUMN score integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_stats' AND column_name = 'score') THEN
    ALTER TABLE player_stats ADD COLUMN score integer DEFAULT 0 NOT NULL;
  END IF;
END $$;