/*
  # Enable Real-time for Game Tables

  ## Changes
  Adds the `rooms` and `players` tables to the Supabase real-time publication
  so that WebSocket subscriptions work properly for live updates.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;