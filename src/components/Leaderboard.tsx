import { useEffect, useState } from 'react';
import { Trophy, X, ArrowUpDown, Target, Skull, Shield, Zap, Crown, Star } from 'lucide-react';
import { supabase, PlayerStats } from '../lib/supabase';
import { PlayerAvatar, getSkinColor } from '../lib/avatars';
import { sounds } from '../lib/sounds';

type SortKey = 'score' | 'total_wins' | 'games_played' | 'times_as_liar' | 'times_escaped' | 'win_rate';

interface LeaderboardProps {
  onClose: () => void;
  currentPlayerName?: string;
}

export function Leaderboard({ onClose, currentPlayerName }: LeaderboardProps) {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel('leaderboard', { config: { broadcast: { self: true } } })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, () => loadStats())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from('player_stats')
      .select('*')
      .order('score', { ascending: false });

    if (data) setStats(data);
    setLoading(false);
  }

  const handleSort = (key: SortKey) => {
    sounds.click();
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const getWinRate = (s: PlayerStats) => s.games_played > 0 ? Math.round((s.total_wins / s.games_played) * 100) : 0;

  const sorted = [...stats].sort((a, b) => {
    let aVal: number, bVal: number;
    if (sortBy === 'win_rate') {
      aVal = getWinRate(a);
      bVal = getWinRate(b);
    } else {
      aVal = a[sortBy] as number;
      bVal = b[sortBy] as number;
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const SortButton = ({ sortKey, label, icon: Icon }: { sortKey: SortKey; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
        sortBy === sortKey
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          : 'bg-slate-700/40 text-slate-400 hover:text-slate-300 border border-transparent'
      }`}
    >
      <Icon size={14} />
      {label}
      {sortBy === sortKey && <ArrowUpDown size={12} className={sortAsc ? 'rotate-180' : ''} />}
    </button>
  );

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown size={20} className="text-amber-400" />;
    if (index === 1) return <Crown size={20} className="text-slate-300" />;
    if (index === 2) return <Crown size={20} className="text-amber-600" />;
    return <span className="text-slate-500 font-mono text-sm w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700 w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Trophy size={28} className="text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          </div>
          <button onClick={() => { sounds.click(); onClose(); }} className="p-2 hover:bg-slate-700 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Scoring Rules */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Star size={12} className="text-amber-500" />
            <span><span className="text-amber-400 font-bold">+1</span> catch the liar</span>
            <span className="text-slate-600">|</span>
            <span><span className="text-amber-400 font-bold">+1</span> escape as liar</span>
            <span className="text-slate-600">|</span>
            <span><span className="text-slate-500 font-bold">0</span> otherwise</span>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-slate-800">
          <SortButton sortKey="score" label="Score" icon={Star} />
          <SortButton sortKey="total_wins" label="Wins" icon={Trophy} />
          <SortButton sortKey="win_rate" label="Win Rate" icon={Target} />
          <SortButton sortKey="games_played" label="Games" icon={Zap} />
          <SortButton sortKey="times_as_liar" label="Liar" icon={Skull} />
          <SortButton sortKey="times_escaped" label="Escapes" icon={Shield} />
        </div>

        {/* Stats List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading stats...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
              <p className="text-slate-500">No games played yet!</p>
              <p className="text-slate-600 text-sm mt-1">Stats will appear after the first round</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((player, index) => {
                const isMe = player.player_name === currentPlayerName;
                const winRate = getWinRate(player);
                const skin = getSkinColor(player.skin_color);
                const isTop3 = index < 3;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isMe
                        ? `bg-gradient-to-r ${skin.gradient} border ${skin.border}`
                        : isTop3
                        ? 'bg-slate-800/60 border border-slate-700'
                        : 'bg-slate-800/30 border border-transparent'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Rank */}
                    <div className="w-7 flex justify-center flex-shrink-0">
                      {getRankBadge(index)}
                    </div>

                    {/* Avatar */}
                    <PlayerAvatar avatar={player.avatar} skinColor={player.skin_color} size={40} />

                    {/* Name + Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold truncate ${isMe ? skin.text : 'text-white'}`}>
                          {player.player_name}
                        </span>
                        {isMe && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${skin.light} ${skin.text} font-bold`}>YOU</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-emerald-400 text-xs font-medium">{player.total_wins}W</span>
                        <span className="text-red-400 text-xs font-medium">{player.total_losses}L</span>
                        <span className="text-slate-500 text-xs">{player.games_played} games</span>
                      </div>
                    </div>

                    {/* Key Stat */}
                    <div className="text-right flex-shrink-0">
                      {sortBy === 'score' && (
                        <div className="text-2xl font-bold text-amber-400">{player.score}</div>
                      )}
                      {sortBy === 'total_wins' && (
                        <div className="text-2xl font-bold text-emerald-400">{player.total_wins}</div>
                      )}
                      {sortBy === 'win_rate' && (
                        <div className={`text-2xl font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{winRate}%</div>
                      )}
                      {sortBy === 'games_played' && (
                        <div className="text-2xl font-bold text-cyan-400">{player.games_played}</div>
                      )}
                      {sortBy === 'times_as_liar' && (
                        <div className="text-2xl font-bold text-rose-400">{player.times_as_liar}</div>
                      )}
                      {sortBy === 'times_escaped' && (
                        <div className="text-2xl font-bold text-teal-400">{player.times_escaped}</div>
                      )}
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {sortBy === 'score' && 'pts'}
                        {sortBy === 'total_wins' && 'wins'}
                        {sortBy === 'win_rate' && 'win rate'}
                        {sortBy === 'games_played' && 'games'}
                        {sortBy === 'times_as_liar' && 'as liar'}
                        {sortBy === 'times_escaped' && 'escapes'}
                      </div>
                    </div>

                    {/* Mini Stat Bars */}
                    <div className="flex flex-col gap-1 flex-shrink-0 w-16">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${player.games_played > 0 ? (player.total_wins / player.games_played) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${player.games_played > 0 ? (player.total_losses / player.games_played) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      {player.times_as_liar > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${player.times_caught > 0 ? (player.times_escaped / player.times_as_liar) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-slate-500 text-xs text-center">Stats update in real-time after each round</p>
        </div>
      </div>
    </div>
  );
}
