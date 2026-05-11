/*
  # Add Chat Messages Table

  ## New Tables
  - `messages` - Stores in-game chat messages during the discussion phase
    - `id` (uuid, primary key)
    - `room_id` (uuid, foreign key to rooms)
    - `player_id` (uuid) - The player who sent the message
    - `player_name` (text) - Denormalized player name for quick display
    - `content` (text) - The message text
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on messages table
  - Allow public read/write for game functionality
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  player_id uuid NOT NULL,
  player_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at);