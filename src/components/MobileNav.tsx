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

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, credits, openCreditsModal } = useMusic();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: PlusCircle, isCreate: true },
    { id: 'library', label: 'Library', icon: Disc3 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0B0914]/95 backdrop-blur-md border-b border-purple-900/30 sticky top-0 z-30">
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 via-violet-600 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white">SONIQ</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Credit Counter Pill */}
          <button
            onClick={openCreditsModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold active:scale-95 transition-transform"
            aria-label="Studio Credits"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>{credits}</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30 active:scale-95 transition-transform"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Fixed at the very bottom, below the mini player) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0914]/95 backdrop-blur-xl border-t border-purple-900/30 px-2 py-1 flex items-center justify-around h-[58px] safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                isActive ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_6px_#A855F7]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
