import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Playlist, Song } from '../types';
import {
  ListMusic,
  Plus,
  Play,
  Pause,
  Trash2,
  X,
  Music,
  Clock,
  ChevronRight,
  ChevronLeft,
  Disc,
  Edit3,
} from 'lucide-react';

export const PlaylistsView: React.FC = () => {
  const {
    playlists,
    songs,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    createNewPlaylist,
    deletePlaylist,
    removeSongFromPlaylist,
    setActiveTab,
  } = useMusic();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  // Resolve songs belonging to active playlist
  const playlistSongs: Song[] = activePlaylist
    ? activePlaylist.songIds
        .map((id) => songs.find((s) => s.id === id))
        .filter((s): s is Song => Boolean(s))
    : [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const pl = await createNewPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setSelectedPlaylistId(pl.id);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreatingModal(false);
    setMobileDetailOpen(true);
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-36">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ListMusic className="w-7 h-7 text-purple-400" />
            <span>Playlists</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {playlists.length} Lists
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize your generated tracks into curated sets, club crates, and playlists.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingModal(true)}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Main Grid: Playlists List on Left, Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Playlists List (Hidden on mobile if detail is open) */}
        <div className={`lg:col-span-4 space-y-3 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            All Playlists
          </h2>

          <div className="space-y-2">
            {playlists.map((pl) => {
              const isSelected = activePlaylist?.id === pl.id;
              const count = pl.songIds.length;
              return (
                <div
                  key={pl.id}
                  onClick={() => {
                    setSelectedPlaylistId(pl.id);
                    setMobileDetailOpen(true);
                  }}
                  className={`p-4 rounded-xl cursor-pointer border transition-all flex items-center justify-between group active:scale-[0.99] ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                      : 'glass-card border-purple-500/15 hover:border-purple-500/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300">
                      {pl.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {pl.description || `${count} tracks`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-900/30">
                      {count}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Playlist Detail (Shown on mobile if detail is open, or always on desktop) */}
        <div className={`lg:col-span-8 ${!mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          {activePlaylist ? (
            <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
              {/* Mobile Back to List Button */}
              <div className="lg:hidden p-3 bg-purple-950/30 border-b border-purple-900/30 flex items-center justify-between">
                <button
                  onClick={() => setMobileDetailOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to all playlists</span>
                </button>
                <span className="text-xs font-mono text-slate-400">{playlistSongs.length} Tracks</span>
              </div>

              {/* Playlist Header Banner */}
              <div className="p-5 md:p-8 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border-b border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                    Playlist
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    {activePlaylist.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-lg">
                    {activePlaylist.description || 'Custom playlist created in SONIQ Studio.'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-3">
                    <span>{playlistSongs.length} Tracks</span>
                    <span>•</span>
                    <span>
                      {Math.round(
                        playlistSongs.reduce((acc, s) => acc + (s.duration || 32), 0) / 60
                      )}{' '}
                      mins total
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handlePlayAll}
                    disabled={playlistSongs.length === 0}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play All</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete playlist "${activePlaylist.name}"?`)) {
                        deletePlaylist(activePlaylist.id);
                        setMobileDetailOpen(false);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 hover:bg-red-900/40 active:scale-95 transition-colors"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tracks List */}
              {playlistSongs.length === 0 ? (
                <div className="p-8 sm:p-12 text-center space-y-3">
                  <Music className="w-10 h-10 mx-auto text-purple-400 opacity-40" />
                  <p className="text-sm font-semibold text-slate-300">This playlist is empty</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add tracks from your Library or Create new songs and assign them to this playlist!
                  </p>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="text-xs text-purple-400 hover:underline font-semibold"
                  >
                    Browse Library to Add Tracks
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-purple-900/20">
                  {playlistSongs.map((song, idx) => {
                    const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
                    return (
                      <div
                        key={song.id}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-4 text-center text-xs font-mono text-slate-500">
                            {idx + 1}
                          </span>

                          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow">
                            <img
                              src={song.coverArtUrl}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => {
                                if (currentSong?.id === song.id) {
                                  togglePlay();
                                } else {
                                  playSong(song, playlistSongs);
                                }
                              }}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {isCurrentPlaying ? (
                                <Pause className="w-4 h-4 fill-white" />
                              ) : (
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              )}
                            </button>
                          </div>

                          <div className="min-w-0">
                            <h4
                              onClick={() => playSong(song, playlistSongs)}
                              className="text-xs font-bold text-white truncate hover:text-purple-300 cursor-pointer"
                            >
                              {song.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <span className="text-purple-400">{song.genre}</span>
                              <span>•</span>
                              <span className="font-mono">{song.bpm} BPM</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                            {song.duration}s
                          </span>

                          <button
                            onClick={() => removeSongFromPlaylist(song.id, activePlaylist.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 active:scale-90 transition-colors"
                            title="Remove from Playlist"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400">
              No playlists found. Create your first playlist to get started!
            </div>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-[#130F20] border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                Create New Playlist
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Playlist Name <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g. Deep House Club Sessions"
                className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="Curated playlist of late night electronic beats..."
                className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
              >
                Create Playlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
