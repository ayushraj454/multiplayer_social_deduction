import { useEffect, useState } from 'react';
import { Copy, Play, Users, LogOut } from 'lucide-react';
import { supabase, Player } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import { PlayerAvatar } from '../lib/avatars';

interface LobbyProps {
  roomCode: string;
  roomId: string;
  playerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export function Lobby({ roomCode, roomId, playerId, isHost, onStartGame, onLeave }: LobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPlayers();

    const channel = supabase
      .channel(`room-${roomId}`, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            sounds.playerJoin();
          }
          loadPlayers();
        }
      )
      .subscribe((status) => {
        console.log('Lobby subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  async function loadPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (data) {
      setPlayers(data);
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    sounds.click();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (players.length >= 3 && players.length <= 8) {
      sounds.gameStart();
      onStartGame();
    } else {
      sounds.error();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Waiting Room</h2>
            <div className="inline-flex items-center gap-3 bg-slate-900/50 px-6 py-3 rounded-xl">
              <span className="text-slate-400">Room Code:</span>
              <span className="text-3xl font-mono font-bold text-cyan-400 tracking-widest">{roomCode}</span>
              <button
                onClick={copyRoomCode}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Copy room code"
              >
                <Copy size={20} className="text-slate-400 hover:text-cyan-400" />
              </button>
            </div>
            {copied && (
              <p className="text-green-400 text-sm mt-2 animate-fade-in">Copied to clipboard!</p>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-cyan-400" size={24} />
              <h3 className="text-xl font-bold text-white">
                Players ({players.length}/8)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-slate-700/50 backdrop-blur-sm px-5 py-4 rounded-xl flex items-center gap-4 animate-slide-up border border-slate-600"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PlayerAvatar
                    avatar={player.avatar || 'ghost'}
                    skinColor={player.skin_color || 'slate'}
                    size={44}
                  />
                  <span className="text-white font-medium flex-1">{player.player_name}</span>
                  {player.is_host && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {players.length < 3 && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
              <p className="text-amber-200 text-center font-medium">
                Need at least 3 players to start the game
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={players.length < 3 || players.length > 8}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                <Play size={24} />
                Start Game
              </button>
            )}
            {!isHost && (
              <div className="flex-1 bg-slate-700/50 text-slate-400 font-medium py-4 px-6 rounded-xl text-center">
                Waiting for host to start...
              </div>
            )}
            <button
              onClick={() => {
                sounds.click();
                onLeave();
              }}
              className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all flex items-center gap-2 font-medium"
            >
              <LogOut size={20} />
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
