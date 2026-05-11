import { supabase } from './supabase';

const SECRET_WORDS = [
  'Eiffel Tower',
  'Pizza',
  'Ocean',
  'Rainbow',
  'Guitar',
  'Mountain',
  'Butterfly',
  'Cinema',
  'Astronaut',
  'Castle',
  'Desert',
  'Volcano',
  'Penguin',
  'Treasure',
  'Thunder',
  'Sunset',
  'Ninja',
  'Dragon',
  'Waterfall',
  'Lighthouse',
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createRoom(playerName: string, avatar: string, skinColor: string): Promise<{ roomCode: string; roomId: string; playerId: string }> {
  const roomCode = generateRoomCode();

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      host_id: '',
      status: 'waiting',
    })
    .select()
    .single();

  if (roomError) {
    console.error('createRoom room insert error:', roomError);
    throw new Error('Failed to create room: ' + roomError.message);
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      player_name: playerName,
      is_host: true,
      is_liar: false,
      avatar,
      skin_color: skinColor,
    })
    .select()
    .single();

  if (playerError) {
    console.error('createRoom player insert error:', playerError);
    throw new Error('Failed to create player: ' + playerError.message);
  }

  const { error: updateError } = await supabase
    .from('rooms')
    .update({ host_id: player.id })
    .eq('id', room.id);

  if (updateError) {
    console.error('createRoom host_id update error:', updateError);
  }

  return { roomCode, roomId: room.id, playerId: player.id };
}

export async function joinRoom(roomCode: string, playerName: string, avatar: string, skinColor: string): Promise<{ playerId: string; roomId: string }> {
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('room_code', roomCode.toUpperCase())
    .maybeSingle();

  if (roomError) {
    console.error('joinRoom room lookup error:', roomError);
    throw new Error('Failed to find room: ' + roomError.message);
  }

  if (!room) {
    throw new Error('Room not found. Check the code and try again.');
  }

  if (room.status !== 'waiting') {
    throw new Error('Game already started');
  }

  const { data: existingPlayers, error: countError } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', room.id);

  if (countError) {
    console.error('joinRoom player count error:', countError);
  }

  if (existingPlayers && existingPlayers.length >= 8) {
    throw new Error('Room is full (max 8 players)');
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      player_name: playerName,
      is_host: false,
      is_liar: false,
      avatar,
      skin_color: skinColor,
    })
    .select()
    .single();

  if (playerError) {
    console.error('joinRoom player insert error:', playerError);
    throw new Error('Failed to join room: ' + playerError.message);
  }

  return { playerId: player.id, roomId: room.id };
}

export async function startGame(roomId: string): Promise<void> {
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId);

  if (playersError) {
    console.error('startGame players fetch error:', playersError);
    throw new Error('Failed to fetch players');
  }

  if (!players || players.length < 3) {
    throw new Error('Need at least 3 players to start');
  }

  if (players.length > 8) {
    throw new Error('Maximum 8 players allowed');
  }

  const liarIndex = Math.floor(Math.random() * players.length);
  const secretWord = SECRET_WORDS[Math.floor(Math.random() * SECRET_WORDS.length)];

  for (let i = 0; i < players.length; i++) {
    const { error: updateError } = await supabase
      .from('players')
      .update({ is_liar: i === liarIndex })
      .eq('id', players[i].id);

    if (updateError) {
      console.error('startGame player update error:', updateError);
    }
  }

  const { error: roomError } = await supabase
    .from('rooms')
    .update({
      status: 'playing',
      secret_word: secretWord,
      phase: 'reveal',
      round_number: 1,
      current_speaker: 0,
    })
    .eq('id', roomId);

  if (roomError) {
    console.error('startGame room update error:', roomError);
    throw new Error('Failed to start game: ' + roomError.message);
  }
}

export async function startDiscussion(roomId: string, durationSeconds: number = 90): Promise<void> {
  const endTime = new Date(Date.now() + durationSeconds * 1000).toISOString();

  const { error } = await supabase
    .from('rooms')
    .update({
      phase: 'discussion',
      discussion_end_at: endTime,
      current_speaker: 0,
    })
    .eq('id', roomId);

  if (error) {
    console.error('startDiscussion error:', error);
    throw new Error('Failed to start discussion');
  }
}

export async function nextSpeaker(roomId: string, currentSpeaker: number, totalPlayers: number): Promise<void> {
  const next = (currentSpeaker + 1) % totalPlayers;
  const { error } = await supabase
    .from('rooms')
    .update({ current_speaker: next })
    .eq('id', roomId);

  if (error) {
    console.error('nextSpeaker error:', error);
  }
}

export async function startVoting(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ phase: 'voting' })
    .eq('id', roomId);

  if (error) {
    console.error('startVoting error:', error);
    throw new Error('Failed to start voting');
  }
}

export async function castVote(roomId: string, voterId: string, votedForId: string): Promise<void> {
  const { error: deleteError } = await supabase
    .from('votes')
    .delete()
    .eq('voter_id', voterId)
    .eq('room_id', roomId);

  if (deleteError) {
    console.error('castVote delete old error:', deleteError);
  }

  const { error: insertError } = await supabase
    .from('votes')
    .insert({
      room_id: roomId,
      voter_id: voterId,
      voted_for_id: votedForId,
    });

  if (insertError) {
    console.error('castVote insert error:', insertError);
    throw new Error('Failed to cast vote');
  }
}

export async function revealResults(roomId: string): Promise<void> {
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle();
  if (!room) throw new Error('Room not found');

  const { data: players } = await supabase.from('players').select('*').eq('room_id', roomId);
  if (!players) throw new Error('Players not found');

  const { data: votes } = await supabase.from('votes').select('*').eq('room_id', roomId);

  const tally: Record<string, number> = {};
  votes?.forEach(v => { tally[v.voted_for_id] = (tally[v.voted_for_id] || 0) + 1; });

  let maxVotes = 0;
  let mostVotedId = '';
  Object.entries(tally).forEach(([pid, count]) => {
    if (count > maxVotes) { maxVotes = count; mostVotedId = pid; }
  });

  const liarPlayer = players.find(p => p.is_liar);
  const liarCaught = mostVotedId === liarPlayer?.id;

  for (const player of players) {
    const isLiar = player.is_liar;
    const votedForLiar = votes?.find(v => v.voter_id === player.id)?.voted_for_id === liarPlayer?.id;
    let wins = 0, losses = 0, asLiar = 0, caught = 0, escaped = 0, points = 0;

    if (isLiar) {
      asLiar = 1;
      if (liarCaught) { caught = 1; losses = 1; } else { escaped = 1; wins = 1; points = 1; }
    } else {
      if (liarCaught && votedForLiar) { wins = 1; points = 1; }
      else { losses = 1; }
    }

    await supabase.from('players').update({
      total_wins: player.total_wins + wins,
      total_losses: player.total_losses + losses,
      games_played: player.games_played + 1,
      times_as_liar: player.times_as_liar + asLiar,
      times_caught: player.times_caught + caught,
      times_escaped: player.times_escaped + escaped,
      score: player.score + points,
    }).eq('id', player.id);

    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_name', player.player_name)
      .maybeSingle();

    if (existingStats) {
      await supabase.from('player_stats').update({
        total_wins: existingStats.total_wins + wins,
        total_losses: existingStats.total_losses + losses,
        games_played: existingStats.games_played + 1,
        times_as_liar: existingStats.times_as_liar + asLiar,
        times_caught: existingStats.times_caught + caught,
        times_escaped: existingStats.times_escaped + escaped,
        score: existingStats.score + points,
        avatar: player.avatar,
        skin_color: player.skin_color,
        updated_at: new Date().toISOString(),
      }).eq('id', existingStats.id);
    } else {
      await supabase.from('player_stats').insert({
        player_name: player.player_name,
        avatar: player.avatar,
        skin_color: player.skin_color,
        total_wins: wins,
        total_losses: losses,
        games_played: 1,
        times_as_liar: asLiar,
        times_caught: caught,
        times_escaped: escaped,
        score: points,
      });
    }
  }

  const { error } = await supabase
    .from('rooms')
    .update({ phase: 'results' })
    .eq('id', roomId);

  if (error) {
    console.error('revealResults error:', error);
    throw new Error('Failed to reveal results');
  }
}

export async function playAgain(roomId: string): Promise<void> {
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId);

  if (playersError || !players) {
    throw new Error('Failed to fetch players');
  }

  const { error: votesError } = await supabase
    .from('votes')
    .delete()
    .eq('room_id', roomId);

  if (votesError) {
    console.error('playAgain votes delete error:', votesError);
  }

  const liarIndex = Math.floor(Math.random() * players.length);
  const secretWord = SECRET_WORDS[Math.floor(Math.random() * SECRET_WORDS.length)];

  for (let i = 0; i < players.length; i++) {
    await supabase
      .from('players')
      .update({ is_liar: i === liarIndex })
      .eq('id', players[i].id);
  }

  const { error: roomError } = await supabase
    .from('rooms')
    .update({
      phase: 'reveal',
      secret_word: secretWord,
      round_number: 1,
      current_speaker: 0,
      discussion_end_at: null,
    })
    .eq('id', roomId);

  if (roomError) {
    throw new Error('Failed to restart game');
  }
}

export async function leaveRoom(playerId: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);

  if (error) {
    console.error('leaveRoom error:', error);
  }
}
