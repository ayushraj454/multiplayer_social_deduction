/*
  # Add Player Stats for Leaderboard

  ## Changes

  ### Modified Tables
  - `players` - Add `total_wins` column (integer) - times the player's side won
  - `players` - Add `total_losses` column (integer) - times the player's side lost
  - `players` - Add `games_played` column (integer) - total rounds played
  - `players` - Add `times_as_liar` column (integer) - times assigned the liar role
  - `players` - Add `times_caught` column (integer) - times caught as liar
  - `players` - Add `times_escaped` column (integer) - times escaped as liar

  ### New Tables
  - `player_stats` - Persistent stats table keyed by player name
    - `id` (uuid, primary key)
    - `player_name` (text, unique) - Player display name
    - `avatar` (text) - Last used avatar
    - `skin_color` (text) - Last used skin color
    - `total_wins` (integer) - Total wins across all rooms
    - `total_losses` (integer) - Total losses across all rooms
    - `games_played` (integer) - Total games played
    - `times_as_liar` (integer) - Times assigned the liar role
    - `times_caught` (integer) - Times caught as liar
    - `times_escaped` (integer) - Times escaped as liar
    - `updated_at` (timestamptz)

  ## Notes
  1. player_stats is a persistent table that tracks stats across sessions
  2. When a game ends, stats are updated for all players in that room
  3. The leaderboard reads from player_stats for all-time records
*/

-- Add per-session stats to players table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'total_wins') THEN
    ALTER TABLE players ADD COLUMN total_wins integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'total_losses') THEN
    ALTER TABLE players ADD COLUMN total_losses integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'games_played') THEN
    ALTER TABLE players ADD COLUMN games_played integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'times_as_liar') THEN
    ALTER TABLE players ADD COLUMN times_as_liar integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'times_caught') THEN
    ALTER TABLE players ADD COLUMN times_caught integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'times_escaped') THEN
    ALTER TABLE players ADD COLUMN times_escaped integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create persistent player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text UNIQUE NOT NULL,
  avatar text DEFAULT 'ghost' NOT NULL,
  skin_color text DEFAULT 'slate' NOT NULL,
  total_wins integer DEFAULT 0 NOT NULL,
  total_losses integer DEFAULT 0 NOT NULL,
  games_played integer DEFAULT 0 NOT NULL,
  times_as_liar integer DEFAULT 0 NOT NULL,
  times_caught integer DEFAULT 0 NOT NULL,
  times_escaped integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player stats"
  ON player_stats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert player stats"
  ON player_stats FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update player stats"
  ON player_stats FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE player_stats;

CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_player_stats_wins ON player_stats(total_wins DESC);