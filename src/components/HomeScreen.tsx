import { useState } from 'react';
import { UserPlus, Users, ChevronRight, Trophy } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { AVATARS, SKIN_COLORS, PlayerAvatar, getAvatar, getSkinColor } from '../lib/avatars';
import { Leaderboard } from './Leaderboard';

interface HomeScreenProps {
  onCreateRoom: (playerName: string, avatar: string, skinColor: string) => void;
  onJoinRoom: (roomCode: string, playerName: string, avatar: string, skinColor: string) => void;
}

export function HomeScreen({ onCreateRoom, onJoinRoom }: HomeScreenProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('ghost');
  const [selectedSkin, setSelectedSkin] = useState('ocean');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      sounds.success();
      onCreateRoom(playerName.trim(), selectedAvatar, selectedSkin);
    } else {
      sounds.error();
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      sounds.success();
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim(), selectedAvatar, selectedSkin);
    } else {
      sounds.error();
    }
  };

  const ProfilePreview = () => (
    <div className="space-y-4">
      {/* Name Input */}
      <input
        type="text"
        placeholder="Enter your name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        className="w-full bg-slate-700/50 text-white placeholder-slate-400 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-lg"
        maxLength={20}
        autoFocus
      />

      {/* Avatar + Skin Preview */}
      <div className="flex items-center gap-4 bg-slate-900/50 rounded-xl p-4">
        <PlayerAvatar avatar={selectedAvatar} skinColor={selectedSkin} size={56} />
        <div className="flex-1">
          <div className="text-white font-bold text-lg">{playerName || 'Your Name'}</div>
          <div className="text-slate-400 text-sm">{getAvatar(selectedAvatar).name} &middot; {getSkinColor(selectedSkin).name}</div>
        </div>
      </div>

      {/* Avatar Picker Toggle */}
      <div>
        <button
          onClick={() => { sounds.click(); setShowAvatarPicker(!showAvatarPicker); setShowSkinPicker(false); }}
          className="w-full flex items-center justify-between bg-slate-700/40 hover:bg-slate-700/60 px-4 py-3 rounded-xl transition-colors"
        >
          <span className="text-slate-300 font-medium">Choose Avatar</span>
          <ChevronRight size={18} className={`text-slate-500 transition-transform ${showAvatarPicker ? 'rotate-90' : ''}`} />
        </button>
        {showAvatarPicker && (
          <div className="mt-2 bg-slate-900/60 rounded-xl p-3 animate-fade-in">
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((a) => {
                const Icon = a.icon;
                const skin = getSkinColor(selectedSkin);
                return (
                  <button
                    key={a.id}
                    onClick={() => { sounds.click(); setSelectedAvatar(a.id); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      selectedAvatar === a.id
                        ? `bg-gradient-to-br ${skin.gradient} ring-2 ${skin.ring} scale-110`
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`bg-gradient-to-br ${skin.bg} rounded-xl w-10 h-10 flex items-center justify-center`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-medium ${selectedAvatar === a.id ? skin.text : 'text-slate-500'}`}>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Skin Color Picker Toggle */}
      <div>
        <button
          onClick={() => { sounds.click(); setShowSkinPicker(!showSkinPicker); setShowAvatarPicker(false); }}
          className="w-full flex items-center justify-between bg-slate-700/40 hover:bg-slate-700/60 px-4 py-3 rounded-xl transition-colors"
        >
          <span className="text-slate-300 font-medium">Choose Color</span>
          <ChevronRight size={18} className={`text-slate-500 transition-transform ${showSkinPicker ? 'rotate-90' : ''}`} />
        </button>
        {showSkinPicker && (
          <div className="mt-2 bg-slate-900/60 rounded-xl p-3 animate-fade-in">
            <div className="grid grid-cols-3 gap-2">
              {SKIN_COLORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { sounds.click(); setSelectedSkin(s.id); }}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                    selectedSkin === s.id
                      ? `bg-gradient-to-br ${s.gradient} ring-2 ${s.ring} scale-105`
                      : 'bg-slate-800/50 hover:bg-slate-700/50'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${s.bg} w-8 h-8 rounded-lg`}></div>
                  <span className={`text-sm font-medium ${selectedSkin === s.id ? s.text : 'text-slate-400'}`}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
            Secret Word
          </h1>
          <p className="text-slate-300 text-lg">The Ultimate Social Deduction Game</p>
        </div>

        {mode === 'select' && (
          <div className="space-y-4 animate-slide-up">
            <button
              onClick={() => { sounds.click(); setMode('create'); }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-xl"
            >
              <UserPlus size={28} />
              Create Room
            </button>
            <button
              onClick={() => { sounds.click(); setMode('join'); }}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold py-6 px-8 rounded-2xl shadow-2xl transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-xl"
            >
              <Users size={28} />
              Join Room
            </button>
            <button
              onClick={() => { sounds.click(); setShowLeaderboard(true); }}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <Trophy size={24} />
              Leaderboard
            </button>
          </div>
        )}

        {showLeaderboard && (
          <Leaderboard onClose={() => setShowLeaderboard(false)} />
        )}

        {mode === 'create' && (
          <div className="bg-slate-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-6">Create Room</h2>
            <ProfilePreview />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
              >
                Create
              </button>
              <button
                onClick={() => { sounds.click(); setMode('select'); }}
                className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-slate-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-6">Join Room</h2>
            <ProfilePreview />
            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              className="w-full bg-slate-700/50 text-white placeholder-slate-400 px-6 py-4 rounded-xl mt-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-lg uppercase tracking-widest font-mono"
              maxLength={6}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomCode.trim()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
              >
                Join
              </button>
              <button
                onClick={() => { sounds.click(); setMode('select'); }}
                className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
