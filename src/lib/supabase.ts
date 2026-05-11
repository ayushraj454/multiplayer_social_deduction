import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type GamePhase = 'reveal' | 'discussion' | 'voting' | 'results';

export interface Room {
  id: string;
  room_code: string;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  secret_word: string | null;
  phase: GamePhase;
  round_number: number;
  discussion_end_at: string | null;
  current_speaker: number;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  player_name: string;
  is_liar: boolean;
  is_host: boolean;
  avatar: string;
  skin_color: string;
  total_wins: number;
  total_losses: number;
  games_played: number;
  times_as_liar: number;
  times_caught: number;
  times_escaped: number;
  score: number;
  joined_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  voter_id: string;
  voted_for_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  player_id: string;
  player_name: string;
  content: string;
  created_at: string;
}

export interface PlayerStats {
  id: string;
  player_name: string;
  avatar: string;
  skin_color: string;
  total_wins: number;
  total_losses: number;
  games_played: number;
  times_as_liar: number;
  times_caught: number;
  times_escaped: number;
  score: number;
  updated_at: string;
}
