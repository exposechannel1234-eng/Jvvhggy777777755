import React from 'react';
import { useMusic } from '../context/MusicContext';
import {
  Home,
  PlusCircle,
  Disc3,
  ListMusic,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, userProfile, credits, openCreditsModal, canClaimDaily } = useMusic();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create', label: 'Create Music', icon: PlusCircle, isHighlight: true },
    { id: 'library', label: 'My Library', icon: Disc3 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-[#0B0914] border-r border-purple-900/20 flex flex-col justify-between p-4 shrink-0 hidden md:flex h-screen sticky top-0">
      {/* Top Branding & Main Nav */}
      <div>
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 px-3 py-4 cursor-pointer group mb-4"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-violet-600 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">SONIQ</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-mono font-bold border border-purple-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-medium">STUDIO MUSIC ENGINE</p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-1 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:via-violet-500 hover:to-pink-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(147,51,234,0.35)] flex items-center justify-center gap-2 group transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Create New Song</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Credits Status */}
      <div className="pt-4 border-t border-purple-900/20 space-y-3 px-1 mb-20">
        {/* Credits Card */}
        <div
          onClick={openCreditsModal}
          className="p-3 rounded-xl bg-gradient-to-br from-purple-950/30 to-violet-950/20 border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="flex items-center gap-1 text-purple-300 font-medium group-hover:text-purple-200">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Studio Credits
            </span>
            <span className="font-mono font-extrabold text-white">{credits}</span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, (credits / 1000) * 100))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px]">
            {canClaimDaily ? (
              <span className="text-yellow-400 font-bold flex items-center gap-0.5 animate-pulse">
                🎁 +25 Bonus klaar!
              </span>
            ) : (
              <span className="text-slate-400">5-10 cr / song</span>
            )}
            <span className="text-purple-400 font-semibold group-hover:text-purple-300 flex items-center gap-0.5">
              Opwaarderen →
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-9 h-9 rounded-full object-cover border border-purple-500/40"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{userProfile.name}</div>
            <div className="text-[10px] text-purple-400 font-medium">{userProfile.plan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
