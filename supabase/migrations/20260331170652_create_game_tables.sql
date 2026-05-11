/*
  # Social Deduction Game Schema

  ## Overview
  This migration creates the database structure for a real-time multiplayer social deduction game
  where players join rooms and are assigned roles (Liar or Truth-Teller).

  ## New Tables

  ### `rooms`
  - `id` (uuid, primary key) - Unique room identifier
  - `room_code` (text, unique) - 6-character join code
  - `host_id` (text) - Player ID of the room creator
  - `status` (text) - Room status: 'waiting', 'playing', 'finished'
  - `secret_word` (text) - The word that Truth-Tellers receive
  - `created_at` (timestamptz) - Room creation timestamp

  ### `players`
  - `id` (uuid, primary key) - Unique player identifier
  - `room_id` (uuid, foreign key) - References rooms table
  - `player_name` (text) - Display name of the player
  - `is_liar` (boolean) - Whether this player is the Liar
  - `is_host` (boolean) - Whether this player is the host
  - `joined_at` (timestamptz) - When player joined the room

  ## Security
  - Enable RLS on both tables
  - Allow public read access for game functionality
  - Allow anyone to create rooms and join as players
  - This is a casual game where security is less critical than accessibility
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  host_id text NOT NULL,
  status text DEFAULT 'waiting' NOT NULL,
  secret_word text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  player_name text NOT NULL,
  is_liar boolean DEFAULT false NOT NULL,
  is_host boolean DEFAULT false NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for players
CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can join as player"
  ON players FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can remove players"
  ON players FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);