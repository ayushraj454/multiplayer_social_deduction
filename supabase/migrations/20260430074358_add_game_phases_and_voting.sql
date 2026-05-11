/*
  # Add Game Phases and Voting

  ## Changes

  ### Modified Tables
  - `rooms` - Add `phase` column to track game stage (reveal, discussion, voting, results)
  - `rooms` - Add `round_number` column for multiple rounds
  - `rooms` - Add `discussion_end_at` column for timer
  - `rooms` - Add `current_speaker` column for turn tracking

  ### New Tables
  - `votes` - Stores player votes during the voting phase
    - `id` (uuid, primary key)
    - `room_id` (uuid, foreign key to rooms)
    - `voter_id` (uuid) - The player who voted
    - `voted_for_id` (uuid) - The player who was voted for
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on votes table
  - Allow public read/write for game functionality
*/

-- Add phase columns to rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'phase'
  ) THEN
    ALTER TABLE rooms ADD COLUMN phase text DEFAULT 'reveal' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'round_number'
  ) THEN
    ALTER TABLE rooms ADD COLUMN round_number integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'discussion_end_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN discussion_end_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'current_speaker'
  ) THEN
    ALTER TABLE rooms ADD COLUMN current_speaker integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  voter_id uuid NOT NULL,
  voted_for_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(voter_id, room_id)
);

-- Enable RLS on votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can cast votes"
  ON votes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete votes"
  ON votes FOR DELETE
  TO public
  USING (true);

-- Add votes to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Create index for votes lookups
CREATE INDEX IF NOT EXISTS idx_votes_room ON votes(room_id);