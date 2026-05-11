import { useEffect, useState, useCallback, useRef } from 'react';
import { Eye, EyeOff, Users, LogOut, Timer, Vote, Trophy, Skull, Shield, RotateCcw, ChevronRight, MessageCircle, Send, AlertTriangle } from 'lucide-react';
import { supabase, Player, Room, Vote as VoteType, Message, GamePhase } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import { startDiscussion, nextSpeaker, startVoting, castVote, revealResults, playAgain } from '../lib/gameLogic';
import { PlayerAvatar, PlayerAvatarSmall, PlayerAvatarChat, getSkinColor } from '../lib/avatars';
import { Leaderboard } from './Leaderboard';

interface GameScreenProps {
  roomId: string;
  playerId: string;
  onLeave: () => void;
}

export function GameScreen({ roomId, playerId, onLeave }: GameScreenProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<VoteType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadGameData();

    const channel = supabase
      .channel(`game-${roomId}`, { config: { broadcast: { self: true } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => loadGameData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => loadGameData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, () => loadGameData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe((status) => console.log('Game subscription status:', status));

    const pollInterval = setInterval(() => {
      if (!room || !player) loadGameData();
    }, 3000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId, playerId]);

  useEffect(() => {
    if (room?.phase === 'discussion' && room.discussion_end_at) {
      const endTime = new Date(room.discussion_end_at).getTime();
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 1000);

      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [room?.phase, room?.discussion_end_at]);

  async function loadGameData() {
    const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle();
    const { data: playerData } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    const { data: playersData } = await supabase.from('players').select('*').eq('room_id', roomId).order('joined_at', { ascending: true });
    const { data: votesData } = await supabase.from('votes').select('*').eq('room_id', roomId);
    const { data: messagesData } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });

    if (roomData) setRoom(roomData);
    if (playerData) setPlayer(playerData);
    if (playersData) setPlayers(playersData);
    if (votesData) setVotes(votesData);
    if (messagesData) setMessages(messagesData);
  }

  const handleStartDiscussion = useCallback(async () => {
    try { sounds.click(); await startDiscussion(roomId, 90); } catch (err) { console.error(err); }
  }, [roomId]);

  const handleNextSpeaker = useCallback(async () => {
    if (!room) return;
    sounds.nextTurn();
    await nextSpeaker(roomId, room.current_speaker, players.length);
  }, [roomId, room, players.length]);

  const handleStartVoting = useCallback(async () => {
    try { sounds.click(); await startVoting(roomId); } catch (err) { console.error(err); }
  }, [roomId]);

  const handleCastVote = useCallback(async (votedForId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedVote(votedForId);
    try { sounds.vote(); await castVote(roomId, playerId, votedForId); } catch (err) { console.error(err); setSelectedVote(null); }
    setIsSubmitting(false);
  }, [roomId, playerId, isSubmitting]);

  const handleRevealResults = useCallback(async () => {
    try { sounds.click(); await revealResults(roomId); } catch (err) { console.error(err); }
  }, [roomId]);

  const handlePlayAgain = useCallback(async () => {
    try { sounds.click(); setRevealed(false); setSelectedVote(null); await playAgain(roomId); } catch (err) { console.error(err); }
  }, [roomId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !player) return;
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      player_id: playerId,
      player_name: player.player_name,
      content: content.trim(),
    });
    if (error) console.error('Send message error:', error);
  }, [roomId, playerId, player]);

  const myVote = votes.find(v => v.voter_id === playerId);
  const hasEveryoneVoted = votes.length === players.length && players.length > 0;

  if (!room || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-white text-xl">Loading game...</div>
          <button onClick={loadGameData} className="text-cyan-400 hover:text-cyan-300 underline text-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${player.is_liar ? 'bg-red-500/10' : 'bg-cyan-500/10'} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${player.is_liar ? 'bg-orange-500/10' : 'bg-blue-500/10'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-2xl mx-auto space-y-4">
        <PhaseHeader phase={room.phase} />

        {room.phase === 'reveal' && (
          <RevealPhase
            room={room} player={player} revealed={revealed}
            onToggleReveal={() => { setRevealed(!revealed); revealed ? sounds.click() : sounds.reveal(); }}
            onStartDiscussion={handleStartDiscussion} isHost={player.is_host}
          />
        )}

        {room.phase === 'discussion' && (
          <DiscussionPhase
            room={room} players={players} playerId={playerId} player={player}
            messages={messages} timeLeft={timeLeft}
            onNextSpeaker={handleNextSpeaker} onStartVoting={handleStartVoting}
            onSendMessage={handleSendMessage} isHost={player.is_host}
          />
        )}

        {room.phase === 'voting' && (
          <VotingPhase
            players={players} playerId={playerId} votes={votes}
            myVote={myVote} selectedVote={selectedVote}
            onCastVote={handleCastVote} hasEveryoneVoted={hasEveryoneVoted}
            onRevealResults={handleRevealResults} isHost={player.is_host}
          />
        )}

        {room.phase === 'results' && (
          <ResultsPhase room={room} players={players} votes={votes} onPlayAgain={handlePlayAgain} onLeave={onLeave} onShowLeaderboard={() => setShowLeaderboard(true)} />
        )}

        <PlayerBar players={players} playerId={playerId} />

        {showLeaderboard && (
          <Leaderboard onClose={() => setShowLeaderboard(false)} currentPlayerName={player.player_name} />
        )}
      </div>
    </div>
  );
}

function PhaseHeader({ phase }: { phase: GamePhase }) {
  const config = {
    reveal: { label: 'Role Reveal', icon: Eye, color: 'text-cyan-400' },
    discussion: { label: 'Discussion', icon: MessageCircle, color: 'text-amber-400' },
    voting: { label: 'Voting', icon: Vote, color: 'text-rose-400' },
    results: { label: 'Results', icon: Trophy, color: 'text-emerald-400' },
  }[phase];
  const Icon = config.icon;
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <Icon size={24} className={config.color} />
      <h1 className={`text-2xl font-bold ${config.color}`}>{config.label}</h1>
    </div>
  );
}

function RevealPhase({ room, player, revealed, onToggleReveal, onStartDiscussion, isHost }: {
  room: Room; player: Player; revealed: boolean; onToggleReveal: () => void; onStartDiscussion: () => void; isHost: boolean;
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Your Role</h2>
          <p className="text-slate-400">Tap below to reveal your assignment</p>
        </div>
        <button
          onClick={onToggleReveal}
          className="w-full bg-gradient-to-br from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 p-12 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
          {!revealed ? (
            <div className="relative flex flex-col items-center gap-4">
              <EyeOff size={48} className="text-slate-400" />
              <p className="text-2xl font-bold text-white">Tap to Reveal</p>
            </div>
          ) : (
            <div className="relative animate-fade-in">
              {player.is_liar ? (
                <div className="space-y-4">
                  <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">YOU ARE THE LIAR</div>
                  <p className="text-slate-300 text-lg">Blend in and figure out the secret word!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-2">YOUR WORD IS:</div>
                  <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">{room.secret_word}</div>
                  <p className="text-slate-300 text-lg">Describe it carefully to find the liar!</p>
                </div>
              )}
            </div>
          )}
          <div className="absolute bottom-4 right-4">
            <Eye size={24} className={`transition-opacity ${revealed ? 'opacity-50' : 'opacity-20'} text-white`} />
          </div>
        </button>
      </div>
      {revealed && isHost && (
        <button onClick={onStartDiscussion} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 px-6 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg shadow-lg animate-slide-up">
          <MessageCircle size={24} /> Start Discussion
        </button>
      )}
      {revealed && !isHost && (
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-xl border border-slate-700 p-4 text-center animate-fade-in">
          <p className="text-slate-400">Waiting for the host to start the discussion...</p>
        </div>
      )}
    </div>
  );
}

function DiscussionPhase({ room, players, playerId, player, messages, timeLeft, onNextSpeaker, onStartVoting, onSendMessage, isHost }: {
  room: Room; players: Player[]; playerId: string; player: Player; messages: Message[];
  timeLeft: number; onNextSpeaker: () => void; onStartVoting: () => void;
  onSendMessage: (content: string) => void; isHost: boolean;
}) {
  const [input, setInput] = useState('');
  const [wordWarning, setWordWarning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 15;
  const currentSpeakerPlayer = players[room.current_speaker % players.length];
  const isMyTurn = currentSpeakerPlayer?.id === playerId;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const secretWord = room.secret_word?.toLowerCase() || '';
    const msgLower = input.toLowerCase();
    if (secretWord && msgLower.includes(secretWord)) {
      setWordWarning(true);
      setTimeout(() => setWordWarning(false), 3000);
      return;
    }
    onSendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Timer + Current Speaker Bar */}
      <div className="flex gap-3">
        <div className={`flex-1 bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl border p-4 flex items-center gap-3 ${isLowTime ? 'border-red-500/50' : 'border-slate-700'}`}>
          <Timer size={24} className={isLowTime ? 'text-red-400' : 'text-amber-400'} />
          <div className={`text-2xl font-mono font-bold ${isLowTime ? 'text-red-400' : 'text-white'}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
        <div className={`flex-1 bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl border p-4 flex items-center gap-3 ${isMyTurn ? 'border-cyan-500/50' : 'border-slate-700'}`}>
          {currentSpeakerPlayer && (
            <PlayerAvatarSmall avatar={currentSpeakerPlayer.avatar || 'ghost'} skinColor={currentSpeakerPlayer.skin_color || 'slate'} />
          )}
          <span className={`font-bold truncate ${isMyTurn ? 'text-cyan-400' : 'text-white'}`}>
            {isMyTurn ? 'Your turn!' : currentSpeakerPlayer?.player_name}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 flex flex-col" style={{ height: '400px' }}>
        {/* Speaker Order Strip */}
        <div className="px-4 py-2 border-b border-slate-700 flex gap-2 overflow-x-auto">
          {players.map((p, i) => {
            const skin = getSkinColor(p.skin_color || 'slate');
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                  i === room.current_speaker % players.length
                    ? `bg-gradient-to-r ${skin.gradient} border ${skin.border} ${skin.text}`
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                <PlayerAvatarSmall avatar={p.avatar || 'ghost'} skinColor={p.skin_color || 'slate'} />
                {p.player_name}
              </div>
            );
          })}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No messages yet. Start the discussion!</p>
              {isMyTurn && (
                <p className="text-cyan-400 text-sm mt-2 font-medium">It's your turn to describe the word!</p>
              )}
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.player_id === playerId;
            const isSpeaker = msg.player_id === currentSpeakerPlayer?.id;
            const msgPlayer = players.find(p => p.id === msg.player_id);
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && msgPlayer && (
                  <PlayerAvatarChat avatar={msgPlayer.avatar || 'ghost'} skinColor={msgPlayer.skin_color || 'slate'} isSpeaking={isSpeaker} />
                )}
                <div className={`max-w-[75%]`}>
                  <div className={`text-xs font-medium mb-1 ${isMe ? 'text-right' : 'text-left'} ${isSpeaker ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {msg.player_name} {isSpeaker && <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded-full ml-1">speaking</span>}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-cyan-600/30 border border-cyan-500/30 text-cyan-50 rounded-br-md'
                      : 'bg-slate-700/60 border border-slate-600 text-slate-200 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {isMe && msgPlayer && (
                  <PlayerAvatarChat avatar={msgPlayer.avatar || 'ghost'} skinColor={msgPlayer.skin_color || 'slate'} />
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Word Warning */}
        {wordWarning && (
          <div className="px-4 py-2 bg-red-500/20 border-t border-red-500/40 flex items-center gap-2 animate-shake">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-red-300 text-sm font-medium">You almost said the secret word! Be more careful.</span>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isMyTurn ? "Describe the word (don't say it!)..." : "Ask questions or comment..."}
              className={`flex-1 bg-slate-900/80 border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                isMyTurn
                  ? 'border-cyan-500/40 focus:ring-cyan-500/30 placeholder-cyan-400/50'
                  : 'border-slate-600 focus:ring-slate-500/30'
              }`}
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="flex gap-3">
          <button
            onClick={onNextSpeaker}
            className="flex-1 bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <ChevronRight size={18} /> Next Speaker
          </button>
          <button
            onClick={onStartVoting}
            className="flex-1 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <Vote size={18} /> Start Voting
          </button>
        </div>
      )}

      {!isHost && (
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 p-3 text-center">
          <p className="text-slate-500 text-sm">The host controls speaker turns and voting</p>
        </div>
      )}
    </div>
  );
}

function VotingPhase({ players, playerId, votes, myVote, selectedVote, onCastVote, hasEveryoneVoted, onRevealResults, isHost }: {
  players: Player[]; playerId: string; votes: VoteType[]; myVote: VoteType | undefined; selectedVote: string | null;
  onCastVote: (id: string) => void; hasEveryoneVoted: boolean; onRevealResults: () => void; isHost: boolean;
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-rose-500/30 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Who is the Liar?</h2>
          <p className="text-slate-400">Vote for the player you think is hiding the truth</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.filter(p => p.id !== playerId).map((p) => {
            const isSelected = selectedVote === p.id || myVote?.voted_for_id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onCastVote(p.id)}
                disabled={!!myVote}
                className={`p-5 rounded-xl transition-all duration-200 text-left ${
                  isSelected
                    ? 'bg-rose-500/30 border-2 border-rose-400 scale-105 shadow-lg shadow-rose-500/20'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700 hover:border-slate-500'
                } ${myVote ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar avatar={p.avatar || 'ghost'} skinColor={p.skin_color || 'slate'} size={40} />
                  <span className={`font-bold text-lg ${isSelected ? 'text-rose-300' : 'text-white'}`}>{p.player_name}</span>
                </div>
              </button>
            );
          })}
        </div>
        {myVote && (
          <div className="mt-6 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-emerald-300 font-medium">Vote cast!</span>
            </div>
          </div>
        )}
      </div>
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Votes cast</span>
          <span className="text-white font-bold">{players.filter(p => votes.find(v => v.voter_id === p.id)).length}/{players.length}</span>
        </div>
        <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all duration-500" style={{ width: `${(votes.length / players.length) * 100}%` }}></div>
        </div>
      </div>
      {isHost && hasEveryoneVoted && (
        <button onClick={onRevealResults} className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg shadow-lg animate-slide-up">
          <Trophy size={24} /> Reveal Results
        </button>
      )}
      {!isHost && (
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-xl border border-slate-700 p-4 text-center">
          <p className="text-slate-400">{hasEveryoneVoted ? 'All votes are in! Waiting for host to reveal...' : 'Waiting for all players to vote...'}</p>
        </div>
      )}
    </div>
  );
}

function ResultsPhase({ room, players, votes, onPlayAgain, onLeave, onShowLeaderboard }: {
  room: Room; players: Player[]; votes: VoteType[]; onPlayAgain: () => void; onLeave: () => void; onShowLeaderboard: () => void;
}) {
  const tally: Record<string, number> = {};
  votes.forEach(v => { tally[v.voted_for_id] = (tally[v.voted_for_id] || 0) + 1; });

  let maxVotes = 0;
  let mostVotedId = '';
  Object.entries(tally).forEach(([pid, count]) => {
    if (count > maxVotes) { maxVotes = count; mostVotedId = pid; }
  });

  const liarPlayer = players.find(p => p.is_liar);
  const liarCaught = mostVotedId === liarPlayer?.id;

  const getPlayerPoints = (p: Player) => {
    if (p.is_liar) return liarCaught ? 0 : 1;
    const votedForLiar = votes.find(v => v.voter_id === p.id)?.voted_for_id === liarPlayer?.id;
    return (liarCaught && votedForLiar) ? 1 : 0;
  };

  const sortedPlayers = [...players].sort((a, b) => getPlayerPoints(b) - getPlayerPoints(a));

  return (
    <div className="space-y-6 animate-slide-up">
      <div className={`bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border p-8 text-center ${liarCaught ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
        {liarCaught ? sounds.caught() : sounds.escaped()}
        <div className="mb-6">
          {liarCaught ? (
            <div className="space-y-3">
              <Shield size={64} className="text-emerald-400 mx-auto" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">LIAR CAUGHT!</h2>
              <p className="text-slate-300">The group found the liar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Skull size={64} className="text-red-400 mx-auto" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">LIAR ESCAPED!</h2>
              <p className="text-slate-300">The wrong person was accused!</p>
            </div>
          )}
        </div>
        <div className={`p-6 rounded-2xl ${liarCaught ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <p className="text-slate-400 text-sm mb-2">The Liar was</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            {liarPlayer && <PlayerAvatar avatar={liarPlayer.avatar || 'ghost'} skinColor={liarPlayer.skin_color || 'slate'} size={48} />}
            <p className="text-3xl font-bold text-white">{liarPlayer?.player_name}</p>
          </div>
          <p className="text-slate-400 text-sm mb-1">The secret word was</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{room.secret_word}</p>
        </div>
      </div>
      <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 text-center">Round Results</h3>
        <div className="space-y-3">
          {sortedPlayers.map((p) => {
            const voteCount = tally[p.id] || 0;
            const isLiar = p.is_liar;
            const isMostVoted = p.id === mostVotedId;
            const points = getPlayerPoints(p);
            return (
              <div key={p.id} className={`flex items-center gap-3 p-4 rounded-xl ${isLiar ? 'bg-red-500/15 border border-red-500/40' : isMostVoted ? 'bg-amber-500/15 border border-amber-500/40' : 'bg-slate-700/30 border border-slate-600'}`}>
                <PlayerAvatar avatar={p.avatar || 'ghost'} skinColor={p.skin_color || 'slate'} size={36} />
                <span className={`font-bold text-lg flex-1 ${isLiar ? 'text-red-400' : 'text-white'}`}>
                  {p.player_name}
                  {isLiar && <span className="ml-2 text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full">LIAR</span>}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">{Array.from({ length: voteCount }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-rose-400"></div>)}</div>
                  <span className="text-slate-400 font-mono text-sm w-8 text-right">{voteCount}</span>
                  <div className={`w-10 text-center font-bold text-lg ${points > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                    +{points}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="text-amber-400 font-bold">+1</span> catch the liar
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">+1</span> escape as liar
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 font-bold">0</span> otherwise
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onPlayAgain} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
          <RotateCcw size={20} /> Play Again
        </button>
        <button onClick={onShowLeaderboard} className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-all flex items-center gap-2 font-medium hover:scale-105 active:scale-95">
          <Trophy size={20} /> Leaderboard
        </button>
        <button onClick={() => { sounds.click(); onLeave(); }} className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all flex items-center gap-2 font-medium">
          <LogOut size={20} /> Leave
        </button>
      </div>
    </div>
  );
}

function PlayerBar({ players, playerId }: { players: Player[]; playerId: string }) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="text-cyan-400" size={18} />
        <h3 className="text-sm font-bold text-white">Players</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${p.id === playerId ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-slate-700/50 border border-slate-600'}`}>
            <PlayerAvatarSmall avatar={p.avatar || 'ghost'} skinColor={p.skin_color || 'slate'} />
            <span className={`text-sm font-medium ${p.id === playerId ? 'text-cyan-300' : 'text-slate-300'}`}>{p.player_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
