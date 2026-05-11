import { Ghost, Flame, Crown, Shield, Swords, Star, Zap, Heart, Moon, Sun, Snowflake, Feather, Skull, Eye, Fish, Bird, Bug, Cat, Dog, Rabbit } from 'lucide-react';
import React from 'react';

export const AVATARS = [
  { id: 'ghost', name: 'Phantom', icon: Ghost },
  { id: 'flame', name: 'Blaze', icon: Flame },
  { id: 'crown', name: 'Royal', icon: Crown },
  { id: 'shield', name: 'Guardian', icon: Shield },
  { id: 'swords', name: 'Warrior', icon: Swords },
  { id: 'star', name: 'Celestial', icon: Star },
  { id: 'zap', name: 'Storm', icon: Zap },
  { id: 'heart', name: 'Charm', icon: Heart },
  { id: 'moon', name: 'Eclipse', icon: Moon },
  { id: 'sun', name: 'Solar', icon: Sun },
  { id: 'snowflake', name: 'Frost', icon: Snowflake },
  { id: 'feather', name: 'Zephyr', icon: Feather },
  { id: 'skull', name: 'Reaper', icon: Skull },
  { id: 'eye', name: 'Oracle', icon: Eye },
  { id: 'fish', name: 'Aqua', icon: Fish },
  { id: 'bird', name: 'Soar', icon: Bird },
  { id: 'bug', name: 'Venom', icon: Bug },
  { id: 'cat', name: 'Shadow', icon: Cat },
  { id: 'dog', name: 'Fang', icon: Dog },
  { id: 'rabbit', name: 'Dash', icon: Rabbit },
] as const;

export const SKIN_COLORS = [
  { id: 'crimson', name: 'Crimson', bg: 'from-red-500 to-rose-600', ring: 'ring-red-400', text: 'text-red-400', light: 'bg-red-500/20', border: 'border-red-500/40', gradient: 'from-red-500/20 to-rose-500/20' },
  { id: 'ocean', name: 'Ocean', bg: 'from-blue-500 to-cyan-600', ring: 'ring-blue-400', text: 'text-blue-400', light: 'bg-blue-500/20', border: 'border-blue-500/40', gradient: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'forest', name: 'Forest', bg: 'from-emerald-500 to-green-600', ring: 'ring-emerald-400', text: 'text-emerald-400', light: 'bg-emerald-500/20', border: 'border-emerald-500/40', gradient: 'from-emerald-500/20 to-green-500/20' },
  { id: 'amber', name: 'Amber', bg: 'from-amber-500 to-yellow-600', ring: 'ring-amber-400', text: 'text-amber-400', light: 'bg-amber-500/20', border: 'border-amber-500/40', gradient: 'from-amber-500/20 to-yellow-500/20' },
  { id: 'violet', name: 'Violet', bg: 'from-fuchsia-500 to-pink-600', ring: 'ring-fuchsia-400', text: 'text-fuchsia-400', light: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/40', gradient: 'from-fuchsia-500/20 to-pink-500/20' },
  { id: 'teal', name: 'Teal', bg: 'from-teal-500 to-cyan-600', ring: 'ring-teal-400', text: 'text-teal-400', light: 'bg-teal-500/20', border: 'border-teal-500/40', gradient: 'from-teal-500/20 to-cyan-500/20' },
  { id: 'sunset', name: 'Sunset', bg: 'from-orange-500 to-red-600', ring: 'ring-orange-400', text: 'text-orange-400', light: 'bg-orange-500/20', border: 'border-orange-500/40', gradient: 'from-orange-500/20 to-red-500/20' },
  { id: 'arctic', name: 'Arctic', bg: 'from-sky-400 to-blue-500', ring: 'ring-sky-400', text: 'text-sky-400', light: 'bg-sky-500/20', border: 'border-sky-500/40', gradient: 'from-sky-500/20 to-blue-500/20' },
  { id: 'slate', name: 'Slate', bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-400', text: 'text-slate-400', light: 'bg-slate-500/20', border: 'border-slate-500/40', gradient: 'from-slate-500/20 to-slate-600/20' },
] as const;

export type AvatarId = typeof AVATARS[number]['id'];
export type SkinColorId = typeof SKIN_COLORS[number]['id'];

export function getAvatar(id: string) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

export function getSkinColor(id: string) {
  return SKIN_COLORS.find(s => s.id === id) || SKIN_COLORS[8];
}

export function PlayerAvatar({ avatar, skinColor, size = 40, showName = false, name }: {
  avatar: string; skinColor: string; size?: number; showName?: boolean; name?: string;
}) {
  const avatarData = getAvatar(avatar);
  const skin = getSkinColor(skinColor);
  const Icon = avatarData.icon;
  const iconSize = Math.round(size * 0.5);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`bg-gradient-to-br ${skin.bg} rounded-2xl flex items-center justify-center ring-2 ${skin.ring} ring-offset-2 ring-offset-slate-900 shadow-lg`}
        style={{ width: size, height: size }}
      >
        <Icon size={iconSize} className="text-white drop-shadow-md" />
      </div>
      {showName && name && (
        <span className={`text-xs font-bold ${skin.text} truncate max-w-[80px]`}>{name}</span>
      )}
    </div>
  );
}

export function PlayerAvatarSmall({ avatar, skinColor }: { avatar: string; skinColor: string }) {
  const avatarData = getAvatar(avatar);
  const skin = getSkinColor(skinColor);
  const Icon = avatarData.icon;

  return (
    <div className={`bg-gradient-to-br ${skin.bg} rounded-lg flex items-center justify-center w-8 h-8 ring-1 ${skin.ring} ring-offset-1 ring-offset-slate-900`}>
      <Icon size={14} className="text-white" />
    </div>
  );
}

export function PlayerAvatarChat({ avatar, skinColor, isSpeaking }: { avatar: string; skinColor: string; isSpeaking?: boolean }) {
  const avatarData = getAvatar(avatar);
  const skin = getSkinColor(skinColor);
  const Icon = avatarData.icon;

  return (
    <div className={`bg-gradient-to-br ${skin.bg} rounded-xl flex items-center justify-center w-9 h-9 ring-1 ${skin.ring} ring-offset-1 ring-offset-slate-900 ${isSpeaking ? `ring-2 ${skin.ring} animate-pulse` : ''}`}>
      <Icon size={16} className="text-white" />
    </div>
  );
}
