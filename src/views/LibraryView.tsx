import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import {
  Play,
  Pause,
  Search,
  Heart,
  Download,
  Trash2,
  Edit2,
  ListPlus,
  FileText,
  Calendar,
  Music,
  Check,
  X,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Sliders,
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const {
    songs,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    toggleFavorite,
    deleteSong,
    updateSongTitle,
    addSongToPlaylist,
    playlists,
    openLyricsModal,
    openStudioModal,
    downloadSongAudio,
    setActiveTab,
  } = useMusic();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'instrumental' | 'vocal'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Rename modal state
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Mobile action sheet for a song
  const [mobileActionSong, setMobileActionSong] = useState<Song | null>(null);

  // Playlist dropdown state
  const [playlistDropdownSongId, setPlaylistDropdownSongId] = useState<string | null>(null);
  const [playlistSuccess, setPlaylistSuccess] = useState<string | null>(null);

  // Filter songs
  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'favorites' && !song.isFavorite) return false;
    if (filterType === 'instrumental' && !song.isInstrumental) return false;
    if (filterType === 'vocal' && song.isInstrumental) return false;

    if (selectedGenre !== 'all' && song.genre !== selectedGenre) return false;

    return true;
  });

  const handleOpenRename = (song: Song) => {
    setEditingSong(song);
    setRenameInput(song.title);
    setMobileActionSong(null);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSong && renameInput.trim()) {
      await updateSongTitle(editingSong.id, renameInput.trim());
      setEditingSong(null);
    }
  };

  const handleAddToPlaylist = async (songId: string, playlistId: string) => {
    await addSongToPlaylist(songId, playlistId);
    setPlaylistSuccess(playlistId);
    setTimeout(() => {
      setPlaylistSuccess(null);
      setPlaylistDropdownSongId(null);
    }, 1200);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-36">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Club & Studio Library</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {songs.length} Masters
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Beheer je elektronische producties, open elk nummer in de <strong>Track Studio</strong> om stems, BPM, DJ-intro/outro of zang verder te bewerken, of download 44.1 kHz WAV-bestanden.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[#141022] p-1 rounded-xl border border-purple-500/20">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('create')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-900/30 active:scale-95 transition-all text-center cursor-pointer"
          >
            + Nieuwe Club Track
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op titel, genre, BPM, Camelot key of prompt..."
            className="w-full bg-[#110E1D] border border-purple-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {(
            [
              { id: 'all', label: 'Alle Tracks' },
              { id: 'favorites', label: 'Favorieten' },
              { id: 'vocal', label: 'Meertalige Zang' },
              { id: 'instrumental', label: 'Club Dub / Instrumental' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-colors active:scale-95 cursor-pointer ${
                filterType === f.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-[#110E1D] border border-purple-500/20 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Genre select */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-[#110E1D] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-400 shrink-0"
          >
            <option value="all">Alle Genres</option>
            <option value="Deep House">Deep House</option>
            <option value="Afro House">Afro House</option>
            <option value="Latin House">Latin House</option>
            <option value="Tech House">Tech House</option>
            <option value="Melodic Techno">Melodic Techno</option>
            <option value="Progressive House">Progressive House</option>
            <option value="EDM">EDM</option>
            <option value="Cyberpunk">Cyberpunk</option>
            <option value="Pop">Pop</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="R&B">R&B</option>
          </select>
        </div>
      </div>

      {/* Tracks Container */}
      {filteredSongs.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-4">
          <Music className="w-12 h-12 mx-auto text-purple-400 opacity-40" />
          <h3 className="text-lg font-bold text-white">Geen tracks gevonden</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Pas je zoekfilter aan of open de Producer Studio om een nieuwe Deep, Afro, Latin of Tech House track te maken.
          </p>
          <button
            onClick={() => setActiveTab('create')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg cursor-pointer"
          >
            Open Producer Studio
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
          <div className="grid grid-cols-12 gap-3 p-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-purple-900/30 bg-purple-950/20">
            <div className="col-span-8 md:col-span-5">Track, Genre & Talen</div>
            <div className="hidden md:block col-span-2">BPM, Key & DJ Grid</div>
            <div className="hidden md:block col-span-2">Datum & Lengte</div>
            <div className="col-span-4 md:col-span-3 text-right">Studio & Acties</div>
          </div>

          <div className="divide-y divide-purple-900/20">
            {filteredSongs.map((song) => {
              const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
              return (
                <div
                  key={song.id}
                  className="grid grid-cols-12 gap-2 sm:gap-3 p-3 sm:p-3.5 items-center hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Track & Play */}
                  <div className="col-span-8 md:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow">
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
                            playSong(song, filteredSongs);
                          }
                        }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {isCurrentPlaying ? (
                          <Pause className="w-5 h-5 fill-white text-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        )}
                      </button>
                      {isCurrentPlaying && (
                        <div className="absolute inset-0 bg-purple-950/50 flex items-center justify-center gap-0.5 pointer-events-none">
                          <span className="w-1 bg-purple-300 rounded-full animate-eq-1" />
                          <span className="w-1 bg-purple-200 rounded-full animate-eq-2" />
                          <span className="w-1 bg-purple-300 rounded-full animate-eq-3" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs sm:text-sm font-bold text-white truncate hover:text-purple-300 cursor-pointer"
                          onClick={() => playSong(song, filteredSongs)}
                        >
                          {song.title}
                        </span>
                        {song.version && (
                          <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-purple-900/50 text-purple-300 border border-purple-500/20 shrink-0">
                            v{song.version}
                          </span>
                        )}
                        {song.mixType && (
                          <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                            {song.mixType}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                        <span className="text-purple-400 font-semibold">{song.genre}</span>
                        <span>•</span>
                        <span className="font-mono">{song.bpm} BPM</span>
                        {song.camelotKey && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-300 font-bold">{song.camelotKey}</span>
                          </>
                        )}
                        {song.vocalLanguages && song.vocalLanguages.length > 0 && (
                          <span className="hidden sm:inline text-pink-300 truncate">
                            • 🌐 {song.vocalLanguages.join(' + ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Tempo, Key & DJ Intro/Outro */}
                  <div className="hidden md:flex flex-col col-span-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-200 font-bold">{song.bpm} BPM</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        {song.camelotKey || '8A'}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[10px] font-mono truncate mt-0.5">
                      {song.djIntroStyle || '16-bar-percussive'}
                    </span>
                  </div>

                  {/* Desktop Date */}
                  <div className="hidden md:flex flex-col col-span-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(song.createdAt)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{song.duration}s Club Master</span>
                  </div>

                  {/* Mobile Actions: Studio Edit + More button */}
                  <div className="md:hidden col-span-4 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openStudioModal(song)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-200 text-[10px] font-bold flex items-center gap-1"
                      title="Bewerk in Track Studio"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Studio</span>
                    </button>
                    <button
                      onClick={() => setMobileActionSong(song)}
                      className="p-2 text-slate-400 active:text-white"
                      title="Meer Opties"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Desktop Full Actions */}
                  <div className="hidden md:flex col-span-3 items-center justify-end gap-1.5">
                    {/* Track Studio Editor Button */}
                    <button
                      onClick={() => openStudioModal(song)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-600/25 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Open in Track Studio (Bewerk Stems, BPM, DJ-Intro/Outro & Zang)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Studio</span>
                    </button>

                    {/* Favorite */}
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        song.isFavorite
                          ? 'text-pink-500 hover:text-pink-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={song.isFavorite ? 'Verwijder uit favorieten' : 'Favoriet'}
                    >
                      <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-pink-500' : ''}`} />
                    </button>

                    {/* View lyrics */}
                    <button
                      onClick={() => openLyricsModal(song)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                      title="Bekijk Lyrics & Club Structuur"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Download WAV */}
                    <button
                      onClick={() => downloadSongAudio(song)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Download 44.1 kHz Club WAV"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Rename */}
                    <button
                      onClick={() => handleOpenRename(song)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Hernoem Track"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Add to Playlist Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setPlaylistDropdownSongId(
                            playlistDropdownSongId === song.id ? null : song.id
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                        title="Toevoegen aan Playlist"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      {playlistDropdownSongId === song.id && (
                        <div className="absolute right-0 top-full mt-1 w-52 bg-[#141022] border border-purple-500/30 rounded-xl shadow-2xl p-2 z-50">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                            Selecteer Playlist
                          </span>
                          {playlists.length === 0 ? (
                            <div className="text-xs text-slate-500 px-2 py-1">Geen playlists</div>
                          ) : (
                            playlists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => handleAddToPlaylist(song.id, pl.id)}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left text-slate-200 hover:bg-purple-900/30 hover:text-purple-300"
                              >
                                <span className="truncate">{pl.name}</span>
                                {playlistSuccess === pl.id && (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Verwijder "${song.title}" uit je library?`)) {
                          deleteSong(song.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Verwijder Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredSongs.map((song) => {
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            return (
              <div
                key={song.id}
                className="glass-card rounded-2xl overflow-hidden border border-purple-500/20 group flex flex-col justify-between"
              >
                <div>
                  {/* Square cover artwork */}
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={song.coverArtUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => {
                        if (currentSong?.id === song.id) {
                          togglePlay();
                        } else {
                          playSong(song, filteredSongs);
                        }
                      }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-purple-950/60 cursor-pointer"
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-8 h-8 fill-white text-white" />
                      ) : (
                        <Play className="w-8 h-8 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold truncate">
                        {song.genre}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono font-bold">
                        {song.bpm} BPM • {song.camelotKey || '8A'}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-white truncate mt-1">{song.title}</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {song.prompt}
                    </p>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="px-3 pb-3 pt-2 border-t border-purple-900/20 flex items-center justify-between text-xs text-slate-400">
                  <button
                    onClick={() => openStudioModal(song)}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/25 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/35 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Bewerk in Studio</span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        song.isFavorite ? 'text-pink-500' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-pink-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => setMobileActionSong(song)}
                      className="p-1.5 rounded-lg hover:text-white cursor-pointer"
                      title="Opties"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Track Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSaveRename}
            className="w-full max-w-md bg-[#130F20] border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                Track Hernoemen
              </h3>
              <button
                type="button"
                onClick={() => setEditingSong(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Track Titel</label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSong(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/[0.05]"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Track Action Sheet */}
      {mobileActionSong && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[#130F22] border-t border-purple-500/30 rounded-t-3xl p-5 space-y-4 safe-bottom shadow-2xl">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={mobileActionSong.coverArtUrl}
                  alt={mobileActionSong.title}
                  className="w-12 h-12 rounded-xl object-cover border border-purple-500/30 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">
                    {mobileActionSong.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {mobileActionSong.genre} • {mobileActionSong.bpm} BPM • {mobileActionSong.camelotKey || '8A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileActionSong(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions list */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  openStudioModal(mobileActionSong);
                  setMobileActionSong(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-200 active:scale-98 transition-colors text-xs font-bold"
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Verder Bewerken in Track Studio (Stems, BPM, DJ Intro/Outro)</span>
              </button>

              <button
                onClick={() => {
                  playSong(mobileActionSong, songs);
                  setMobileActionSong(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-900/30 text-slate-200 active:scale-98 transition-colors text-xs font-semibold"
              >
                <Play className="w-4 h-4 text-purple-400" />
                <span>Track Afspelen</span>
              </button>

              <button
                onClick={() => {
                  openLyricsModal(mobileActionSong);
                  setMobileActionSong(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-900/30 text-slate-200 active:scale-98 transition-colors text-xs font-semibold"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Bekijk Lyrics & Prompt</span>
              </button>

              <button
                onClick={() => {
                  downloadSongAudio(mobileActionSong);
                  setMobileActionSong(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-900/30 text-slate-200 active:scale-98 transition-colors text-xs font-semibold"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download 44.1 kHz Club WAV</span>
              </button>

              <button
                onClick={() => {
                  handleOpenRename(mobileActionSong);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-900/30 text-slate-200 active:scale-98 transition-colors text-xs font-semibold"
              >
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>Track Hernoemen</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Verwijder "${mobileActionSong.title}"?`)) {
                    deleteSong(mobileActionSong.id);
                    setMobileActionSong(null);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-950/40 text-red-400 active:scale-98 transition-colors text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Verwijder uit Library</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
