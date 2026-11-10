/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PlayerBar } from './components/PlayerBar';
import { LyricsModal } from './components/LyricsModal';
import { CreditsModal } from './components/CreditsModal';
import { TrackStudioModal } from './components/TrackStudioModal';
import { HomeView } from './views/HomeView';
import { CreateMusicView } from './views/CreateMusicView';
import { LibraryView } from './views/LibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useMusic();

  return (
    <div className="flex min-h-screen bg-[#08070B] text-slate-100 font-sans">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Navigation */}
        <MobileNav />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'create' && <CreateMusicView />}
          {activeTab === 'library' && <LibraryView />}
          {activeTab === 'playlists' && <PlaylistsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Global Lyrics Modal */}
        <LyricsModal />

        {/* Global Credits & Top-Up Modal */}
        <CreditsModal />

        {/* Post-Generation Track Studio & DJ Editor Modal */}
        <TrackStudioModal />

        {/* Sticky Studio Audio Player Bar */}
        <PlayerBar />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainLayout />
    </MusicProvider>
  );
}
