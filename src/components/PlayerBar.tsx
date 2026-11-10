import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { WaveformVisualizer } from './WaveformVisualizer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Download,
  ListPlus,
  FileText,
  Check,
  Plus,
  ChevronDown,
  Maximize2,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    playlists,
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    addSongToPlaylist,
    createNewPlaylist,
    openLyricsModal,
    downloadSongAudio,
  } = useMusic();

  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (!currentSong) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  const handleSeek = (ratio: number) => {
    if (duration > 0) {
      seekTo(ratio * duration);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentSong) return;
    await addSongToPlaylist(currentSong.id, playlistId);
    setAddedSuccess(playlistId);
    setTimeout(() => {
      setAddedSuccess(null);
      setShowPlaylistMenu(false);
    }, 1200);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !currentSong) return;
    const pl = await createNewPlaylist(newPlaylistName.trim());
    await addSongToPlaylist(currentSong.id, pl.id);
    setNewPlaylistName('');
    setShowPlaylistMenu(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. COMPACT DOCKED PLAYER (Responsive: Mobile & Desktop)   */}
      {/* ======================================================== */}
      <div className="fixed bottom-[58px] md:bottom-0 left-0 right-0 z-40 bg-[#0B0914]/95 md:bg-[#0B0914]/90 backdrop-blur-xl border-t border-purple-500/20 px-3 md:px-6 py-2 shadow-[0_-10px_35px_-5px_rgba(124,58,237,0.2)]">
        {/* Mobile thin top progress line */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-1 bg-purple-950/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-6">
          {/* Left: Track Info & Artwork (Clickable on Mobile to expand drawer) */}
          <div
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsMobileDrawerOpen(true);
              }
            }}
            className="flex items-center gap-2.5 md:gap-3 w-full md:w-1/4 min-w-0 md:min-w-[200px] cursor-pointer md:cursor-default"
          >
            <div className="relative group shrink-0">
              <img
                src={currentSong.coverArtUrl}
                alt={currentSong.title}
                className="w-11 h-11 md:w-14 md:h-14 rounded-xl object-cover border border-purple-500/30 shadow-md group-hover:scale-105 transition-transform"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center gap-0.5">
                  <span className="w-1 bg-purple-400 rounded-full animate-eq-1" />
                  <span className="w-1 bg-purple-300 rounded-full animate-eq-2" />
                  <span className="w-1 bg-purple-400 rounded-full animate-eq-3" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs md:text-sm font-bold text-white truncate hover:text-purple-300">
                  {currentSong.title}
                </h4>
                {currentSong.version && (
                  <span className="text-[9px] md:text-[10px] font-mono font-bold px-1.5 py-0.2 bg-purple-900/60 text-purple-300 rounded border border-purple-500/30 shrink-0">
                    v{currentSong.version}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400 truncate mt-0.5">
                <span className="text-purple-400 font-medium">{currentSong.genre}</span>
                <span>•</span>
                <span className="font-mono">{currentSong.bpm} BPM</span>
              </div>
            </div>

            {/* Mobile Expand Indicator */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileDrawerOpen(true);
              }}
              className="md:hidden p-1.5 text-slate-400 hover:text-white"
              title="Expand Player"
            >
              <Maximize2 className="w-4 h-4 text-purple-400" />
            </button>
          </div>

          {/* Desktop Center: Controls & Waveform Timeline */}
          <div className="hidden md:flex flex-col items-center w-full md:w-2/4 max-w-2xl">
            {/* Playback Buttons */}
            <div className="flex items-center gap-4 mb-1">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-md transition-colors ${
                  isShuffle ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={playPrev}
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                title="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={playNext}
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-1.5 rounded-md transition-colors ${
                  isRepeat ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Repeat"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Waveform */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right shrink-0">
                {formatTime(currentTime)}
              </span>

              <div className="flex-1">
                <WaveformVisualizer
                  isPlaying={isPlaying}
                  progress={progressRatio}
                  onSeek={handleSeek}
                  barCount={52}
                  height={24}
                  accentColor="#C084FC"
                />
              </div>

              <span className="text-[11px] font-mono text-slate-500 w-10 shrink-0">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Desktop Right: Actions, Lyrics, Volume */}
          <div className="hidden md:flex items-center justify-end gap-2.5 w-full md:w-1/4 min-w-[200px]">
            {/* Quick Favorite */}
            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className={`p-2 rounded-lg transition-colors shrink-0 ${
                currentSong.isFavorite
                  ? 'text-pink-500 hover:text-pink-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              title={currentSong.isFavorite ? 'Favorited' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-pink-500' : ''}`} />
            </button>

            {/* Lyrics Button */}
            <button
              onClick={() => openLyricsModal(currentSong)}
              className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
              title="View Lyrics & Prompt"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Download Audio */}
            <button
              onClick={() => downloadSongAudio(currentSong)}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/20 transition-colors"
              title="Download Master WAV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Add to Playlist Popup */}
            <div className="relative">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
                title="Add to Playlist"
              >
                <ListPlus className="w-4 h-4" />
              </button>

              {showPlaylistMenu && (
                <div className="absolute right-0 bottom-full mb-3 w-64 bg-[#141022] border border-purple-500/30 rounded-xl shadow-2xl p-3 z-50">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Add to Playlist
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                    {playlists.length === 0 ? (
                      <div className="text-xs text-slate-500 py-1">No playlists yet.</div>
                    ) : (
                      playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => handleAddToPlaylist(pl.id)}
                          className="w-full flex items-center justify-between p-2 rounded-lg text-xs text-left text-slate-200 hover:bg-purple-900/30 hover:text-purple-300 transition-colors"
                        >
                          <span className="truncate">{pl.name}</span>
                          {addedSuccess === pl.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : pl.songIds.includes(currentSong.id) ? (
                            <span className="text-[10px] text-purple-400 font-mono">Added</span>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleCreateAndAdd} className="flex items-center gap-1.5 pt-2 border-t border-purple-900/30">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="New playlist name..."
                      className="flex-1 bg-black/40 border border-purple-500/20 rounded-md px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                className="w-16 md:w-20 accent-purple-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Mobile Right Controls: Large Touch Target Play/Pause & Favorite */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleFavorite(currentSong.id)}
              className="p-2.5 text-slate-400 active:scale-90 transition-transform"
              title="Favorite"
            >
              <Heart className={`w-5 h-5 ${currentSong.isFavorite ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center active:scale-90 transition-transform shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={playNext}
              className="p-2 text-slate-400 active:scale-90 transition-transform"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FULL-SCREEN MOBILE NOW-PLAYING DRAWER (iOS / Android)  */}
      {/* ======================================================== */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#08070B] flex flex-col justify-between p-6 overflow-y-auto animate-fade-in safe-bottom">
          {/* Top Bar: Drag indicator & Minimize Chevron */}
          <div className="flex items-center justify-between pb-4">
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-2 rounded-full bg-white/[0.06] text-slate-300 hover:text-white"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-[10px] uppercase tracking-wider font-mono text-purple-400 font-bold block">
                PLAYING FROM SONIQ STUDIO
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {currentSong.genre} Anthems
              </span>
            </div>

            <button
              onClick={() => {
                setIsMobileDrawerOpen(false);
                openLyricsModal(currentSong);
              }}
              className="p-2 rounded-full bg-white/[0.06] text-purple-300 hover:text-white"
              title="Lyrics"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>

          {/* Large Square Artwork with Ambient Glow */}
          <div className="my-auto py-4 flex flex-col items-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-[0_15px_50px_rgba(139,92,246,0.35)] border border-purple-500/30">
              <img
                src={currentSong.coverArtUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1 border border-purple-500/30">
                  <span className="w-1.5 h-3 bg-purple-400 rounded-full animate-eq-1" />
                  <span className="w-1.5 h-4 bg-purple-300 rounded-full animate-eq-2" />
                  <span className="w-1.5 h-2.5 bg-purple-400 rounded-full animate-eq-3" />
                </div>
              )}
            </div>

            {/* Song Meta Info */}
            <div className="w-full text-center mt-6 space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {currentSong.title}
                </h2>
                {currentSong.version && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                    v{currentSong.version}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span className="text-purple-400 font-semibold">{currentSong.genre}</span>
                <span>•</span>
                <span className="font-mono">{currentSong.bpm} BPM</span>
                <span>•</span>
                <span>{currentSong.mood}</span>
              </div>
            </div>
          </div>

          {/* Waveform & Time Scrubber */}
          <div className="space-y-2 mb-4">
            <WaveformVisualizer
              isPlaying={isPlaying}
              progress={progressRatio}
              onSeek={handleSeek}
              barCount={48}
              height={38}
              accentColor="#C084FC"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400 px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Large Mobile Touch Controls */}
          <div className="flex items-center justify-between px-4 mb-6">
            <button
              onClick={toggleShuffle}
              className={`p-3 rounded-full transition-colors ${
                isShuffle ? 'text-purple-400' : 'text-slate-400'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={playPrev}
              className="p-3 text-slate-300 active:scale-90 transition-transform"
            >
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.5)] active:scale-90 transition-transform"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
            </button>

            <button
              onClick={playNext}
              className="p-3 text-slate-300 active:scale-90 transition-transform"
            >
              <SkipForward className="w-7 h-7" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-3 rounded-full transition-colors ${
                isRepeat ? 'text-purple-400' : 'text-slate-400'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Bottom Quick Actions */}
          <div className="flex items-center justify-around pt-4 border-t border-purple-900/30">
            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
                currentSong.isFavorite ? 'text-pink-400' : 'text-slate-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${currentSong.isFavorite ? 'fill-pink-500' : ''}`} />
              <span>Favorite</span>
            </button>

            <button
              onClick={() => downloadSongAudio(currentSong)}
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-emerald-400"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>

            <button
              onClick={() => {
                setIsMobileDrawerOpen(false);
                openLyricsModal(currentSong);
              }}
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-purple-300"
            >
              <FileText className="w-5 h-5" />
              <span>Lyrics</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
