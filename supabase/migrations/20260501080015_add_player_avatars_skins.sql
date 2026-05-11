/*
  # Add Player Avatars and Skins

  ## Changes

  ### Modified Tables
  - `players` - Add `avatar` column (text) for icon selection
  - `players` - Add `skin_color` column (text) for color theme selection

  ### New Columns
  - `avatar` - Icon identifier (e.g. 'dragon', 'phoenix', 'wolf')
  - `skin_color` - Color identifier (e.g. 'crimson', 'ocean', 'forest')

  ## Notes
  1. Default values ensure existing players get assigned defaults
  2. Both columns are optional with sensible defaults
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE players ADD COLUMN avatar text DEFAULT 'ghost';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'skin_color'
  ) THEN
    ALTER TABLE players ADD COLUMN skin_color text DEFAULT 'slate';
  END IF;
END $$;