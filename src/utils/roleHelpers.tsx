import React from 'react';
import {
  Crown,
  Shield,
  Users,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Sword,
  HelpCircle,
  Megaphone,
  TrendingUp,
  Share2,
  Code,
  Terminal,
  Cpu,
  Layers,
  User,
  Camera,
  Sparkles,
  Video,
  Gift,
  Server,
  Gem,
  Heart,
  Handshake,
  Compass,
  Award,
} from 'lucide-react';
import { RoleColor } from '../types';

export const getRoleIcon = (iconType: string, className = 'w-4 h-4'): React.ReactNode => {
  switch (iconType) {
    case 'crown': return <Crown className={className} />;
    case 'shield': return <Shield className={className} />;
    case 'users': return <Users className={className} />;
    case 'briefcase': return <Briefcase className={className} />;
    case 'user-check': return <UserCheck className={className} />;
    case 'shield-alert': return <ShieldAlert className={className} />;
    case 'sword': return <Sword className={className} />;
    case 'help-circle': return <HelpCircle className={className} />;
    case 'megaphone': return <Megaphone className={className} />;
    case 'trending-up': return <TrendingUp className={className} />;
    case 'share-2': return <Share2 className={className} />;
    case 'code': return <Code className={className} />;
    case 'terminal': return <Terminal className={className} />;
    case 'cpu': return <Cpu className={className} />;
    case 'layers': return <Layers className={className} />;
    case 'user': return <User className={className} />;
    case 'camera': return <Camera className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'video': return <Video className={className} />;
    case 'gift': return <Gift className={className} />;
    case 'server': return <Server className={className} />;
    case 'gem': return <Gem className={className} />;
    case 'heart': return <Heart className={className} />;
    case 'handshake': return <Handshake className={className} />;
    case 'compass': return <Compass className={className} />;
    case 'award': return <Award className={className} />;
    default: return <Shield className={className} />;
  }
};

export const getRoleColorStyles = (color: RoleColor) => {
  switch (color) {
    case 'red':
      return {
        bg: 'bg-red-500/15',
        border: 'border-red-500/30',
        text: 'text-red-400',
        badgeBg: 'bg-red-500/20 text-red-300',
        iconBg: 'bg-red-500 text-white',
      };
    case 'purple':
      return {
        bg: 'bg-purple-500/15',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        badgeBg: 'bg-purple-500/20 text-purple-300',
        iconBg: 'bg-purple-600 text-white',
      };
    case 'orange':
      return {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300',
        iconBg: 'bg-amber-500 text-white',
      };
    case 'indigo':
    case 'blue':
      return {
        bg: 'bg-blue-500/15',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        badgeBg: 'bg-blue-500/20 text-blue-300',
        iconBg: 'bg-blue-500 text-white',
      };
    case 'green':
      return {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300',
        iconBg: 'bg-emerald-500 text-white',
      };
    case 'lime':
      return {
        bg: 'bg-lime-500/15',
        border: 'border-lime-500/30',
        text: 'text-lime-400',
        badgeBg: 'bg-lime-500/20 text-lime-300',
        iconBg: 'bg-lime-500 text-slate-950 font-bold',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-500/15',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/20 text-yellow-300',
        iconBg: 'bg-yellow-500 text-slate-950 font-bold',
      };
    case 'pink':
      return {
        bg: 'bg-pink-500/15',
        border: 'border-pink-500/30',
        text: 'text-pink-400',
        badgeBg: 'bg-pink-500/20 text-pink-300',
        iconBg: 'bg-pink-500 text-white',
      };
    case 'magenta':
      return {
        bg: 'bg-fuchsia-500/15',
        border: 'border-fuchsia-500/30',
        text: 'text-fuchsia-400',
        badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300',
        iconBg: 'bg-fuchsia-600 text-white',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-500/15',
        border: 'border-cyan-500/30',
        text: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 text-cyan-300',
        iconBg: 'bg-cyan-500 text-slate-950 font-bold',
      };
    default:
      return {
        bg: 'bg-purple-500/15',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        badgeBg: 'bg-purple-500/20 text-purple-300',
        iconBg: 'bg-purple-500 text-white',
      };
  }
};
