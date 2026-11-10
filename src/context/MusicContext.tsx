import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song, Playlist, UserProfile } from '../types';
import { api } from '../services/api';
import { generateSynthesizedTrackAudio, hashStringToSeed } from '../utils/audioSynth';
import { generateCoverArt } from '../utils/artworkGenerator';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  queueIndex: number;
  isShuffle: boolean;
  isRepeat: boolean;
  songs: Song[];
  playlists: Playlist[];
  isLoadingSongs: boolean;
  activeTab: 'home' | 'create' | 'library' | 'playlists' | 'settings';
  lyricsModalSong: Song | null;
  studioModalSong: Song | null;
  userProfile: UserProfile;
  audioBlobCache: Record<string, Blob>;
  prefillGenre: import('../types').Genre | null;
  prefillPrompt: string;

  // Credits System
  credits: number;
  transactions: import('../types').CreditTransaction[];
  canClaimDaily: boolean;
  nextClaimMs: number;
  isCreditsModalOpen: boolean;
  openCreditsModal: () => void;
  closeCreditsModal: () => void;
  claimDailyBonus: () => Promise<{ success: boolean; message: string }>;
  purchaseCredits: (pkg: import('../types').CreditPackage) => Promise<void>;
  deductCredits: (amount: number, type: string, description: string) => Promise<void>;
  refreshCredits: () => Promise<void>;

  setActiveTab: (tab: 'home' | 'create' | 'library' | 'playlists' | 'settings') => void;
  setPrefillStudio: (genre?: import('../types').Genre, prompt?: string) => void;
  playSong: (song: Song, customQueue?: Song[]) => Promise<void>;
  pauseSong: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (songId: string) => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  updateSongTitle: (songId: string, newTitle: string) => Promise<void>;
  updateSongInStudio: (songId: string, updates: Partial<Song>) => Promise<Song>;
  addSongToPlaylist: (songId: string, playlistId: string) => Promise<void>;
  removeSongFromPlaylist: (songId: string, playlistId: string) => Promise<void>;
  createNewPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  openLyricsModal: (song: Song) => void;
  closeLyricsModal: () => void;
  openStudioModal: (song: Song) => void;
  closeStudioModal: () => void;
  refreshLibrary: () => Promise<void>;
  attachSynthesizedAudio: (songId: string, audioUrl: string, blob?: Blob) => void;
  downloadSongAudio: (song: Song) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

function getSongCacheKey(song: Song): string {
  return `${song.id}::${song.generationId || 'gen'}::${song.seed || 0}::${song.bpm}::${song.genre}::${song.camelotKey || ''}`;
}

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'create' | 'library' | 'playlists' | 'settings'>('home');
  const [lyricsModalSong, setLyricsModalSong] = useState<Song | null>(null);
  const [studioModalSong, setStudioModalSong] = useState<Song | null>(null);
  const [prefillGenre, setPrefillGenre] = useState<import('../types').Genre | null>(null);
  const [prefillPrompt, setPrefillPrompt] = useState<string>('');

  // Credits System State
  const [credits, setCredits] = useState<number>(450);
  const [transactions, setTransactions] = useState<import('../types').CreditTransaction[]>([]);
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(true);
  const [nextClaimMs, setNextClaimMs] = useState<number>(0);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState<boolean>(false);

  // Audio object URL and Blob cache keyed by composite generation key (never stale)
  const [audioUrlCache, setAudioUrlCache] = useState<Record<string, string>>({});
  const [audioBlobCache, setAudioBlobCache] = useState<Record<string, Blob>>({});

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-studio-creator',
    name: 'Alex Rivera',
    email: 'exposechannel1234@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    plan: 'Pro Studio',
    creditsRemaining: 450,
  });

  const openCreditsModal = () => setIsCreditsModalOpen(true);
  const closeCreditsModal = () => setIsCreditsModalOpen(false);

  const refreshCredits = async () => {
    try {
      const data = await api.getCredits();
      setCredits(data.credits);
      setTransactions(data.transactions || []);
      setCanClaimDaily(data.canClaimDaily);
      setNextClaimMs(data.nextClaimMs || 0);
      setUserProfile((prev) => ({
        ...prev,
        creditsRemaining: data.credits,
        lastDailyBonusClaimed: data.lastDailyBonusClaimed || undefined,
      }));
    } catch (err) {
      console.error('Failed to load credit balance:', err);
    }
  };

  const claimDailyBonus = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.claimDailyBonus();
      setCredits(res.credits);
      setCanClaimDaily(false);
      setNextClaimMs(24 * 60 * 60 * 1000);
      setTransactions((prev) => [res.transaction, ...prev]);
      setUserProfile((prev) => ({
        ...prev,
        creditsRemaining: res.credits,
        lastDailyBonusClaimed: res.transaction.createdAt,
      }));
      return { success: true, message: res.message };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      return { success: false, message: msg };
    }
  };

  const purchaseCredits = async (pkg: import('../types').CreditPackage) => {
    const res = await api.purchaseCredits({
      packageId: pkg.id,
      credits: pkg.credits,
      price: pkg.priceEur,
      name: pkg.name,
    });
    setCredits(res.credits);
    setTransactions((prev) => [res.transaction, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      creditsRemaining: res.credits,
    }));
  };

  const deductCredits = async (amount: number, type: string, description: string) => {
    const res = await api.deductCredits({ amount, type, description });
    setCredits(res.credits);
    setTransactions((prev) => [res.transaction, ...prev]);
    setUserProfile((prev) => ({
      ...prev,
      creditsRemaining: res.credits,
    }));
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Setup HTML Audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNext();
      }
    };

    const onError = (e: Event) => {
      console.warn('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, [isRepeat]);

  // Load songs & playlists
  const loadData = async () => {
    try {
      setIsLoadingSongs(true);
      const [fetchedSongs, fetchedPlaylists] = await Promise.all([
        api.getSongs(),
        api.getPlaylists(),
      ]);

      const enrichedSongs = fetchedSongs.map((song, i) => {
        const coverArt =
          song.coverArtUrl ||
          generateCoverArt(song.title, song.genre, song.mood, (song.seed || i + 1));
        return {
          ...song,
          coverArtUrl: coverArt,
        };
      });

      setSongs(enrichedSongs);
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      console.error('Failed to load songs and playlists:', err);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  useEffect(() => {
    loadData();
    refreshCredits();
  }, []);

  // Synchronously resolve direct server/AI stream URL when available (0ms latency)
  const getDirectStreamUrlSync = (song: Song, forceRebuild = false): string | null => {
    const cacheKey = getSongCacheKey(song);
    if (!forceRebuild && audioUrlCache[cacheKey]) {
      return audioUrlCache[cacheKey];
    }

    if (
      song.audioUrl &&
      (song.audioUrl.startsWith('/api/music/stream/') ||
        song.audioUrl.startsWith('http://') ||
        song.audioUrl.startsWith('https://') ||
        song.audioUrl.startsWith('data:audio/') ||
        song.audioUrl.startsWith('blob:'))
    ) {
      if (song.audioUrl.startsWith('data:audio/') || song.audioUrl.startsWith('blob:')) {
        return song.audioUrl;
      }
      const hasGenParam = song.audioUrl.includes('genId=') || song.audioUrl.includes('_gen=');
      const separator = song.audioUrl.includes('?') ? '&' : '?';
      return hasGenParam
        ? `${song.audioUrl}${forceRebuild ? `&_t=${Date.now()}` : ''}`
        : `${song.audioUrl}${separator}_gen=${encodeURIComponent(song.generationId || song.id)}`;
    }
    return null;
  };

  // Ensure playable, unique audio is ready for a track without replacing valid server/AI audio with oscillator synthesis
  const prepareSongAudio = async (song: Song, forceRebuild = false): Promise<string> => {
    const cacheKey = getSongCacheKey(song);

    // Revoke previous temporary blob: URL for this cacheKey if rebuilding
    if (forceRebuild && audioUrlCache[cacheKey]?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(audioUrlCache[cacheKey]);
      } catch {
        // Ignore revoke errors
      }
    }

    // 1. Directly use server-generated audio streams (/api/music/stream/...), external HTTP(S) URLs, and data:audio/... URLs
    const directUrl = getDirectStreamUrlSync(song, forceRebuild);
    if (directUrl) {
      setAudioUrlCache((prev) => (prev[cacheKey] === directUrl ? prev : { ...prev, [cacheKey]: directUrl }));
      return directUrl;
    }

    // 2. Fallback only when no server/external audioUrl exists at all
    const derivedSeed =
      typeof song.seed === 'number' && song.seed > 0
        ? song.seed
        : hashStringToSeed(`${song.id}|${song.generationId || ''}|${song.title}|${song.prompt}|${song.lyrics || ''}`);

    const { audioUrl, blob, audioFingerprint } = await generateSynthesizedTrackAudio({
      genre: song.genre,
      bpm: song.bpm,
      mood: song.mood,
      durationSeconds: song.duration || 32,
      seed: derivedSeed,
      prompt: song.prompt,
      lyrics: song.lyrics || '',
      title: song.title,
      camelotKey: song.camelotKey || '8A (A Minor)',
      vocalMode: song.vocalMode || 'female',
      isInstrumental: song.isInstrumental,
      djIntroStyle: song.djIntroStyle || '16-bar-percussive',
      djOutroStyle: song.djOutroStyle || '16-bar-dj-loop',
      stemMix: song.stemMix,
    });

    console.log('[SONIQ_SYNTH_FALLBACK_READY]', {
      songId: song.id,
      generationId: song.generationId,
      seed: derivedSeed,
      audioFingerprint,
      blobUrl: audioUrl,
    });

    setAudioUrlCache((prev) => ({ ...prev, [cacheKey]: audioUrl }));
    setAudioBlobCache((prev) => ({ ...prev, [cacheKey]: blob, [song.id]: blob }));
    return audioUrl;
  };

  // Play a song: instant 0ms UI response + synchronous stream assignment on the same user gesture tick
  const playSong = async (song: Song, customQueue?: Song[]) => {
    try {
      const audio = audioRef.current;
      if (!audio) return;

      const activeQueue = customQueue || (queue.length > 0 ? queue : songs);
      setQueue(activeQueue);
      const songIndex = activeQueue.findIndex((s) => s.id === song.id);
      setQueueIndex(songIndex >= 0 ? songIndex : 0);

      // If clicking Play on the exact same song & generationId that is already loaded, resume or restart immediately
      if (
        currentSong &&
        currentSong.id === song.id &&
        currentSong.generationId === song.generationId &&
        audio.src &&
        audio.src !== window.location.href
      ) {
        audio.volume = isMuted ? 0 : volume;
        setIsPlaying(true);
        await audio.play();
        return;
      }

      // Optimistically update UI state immediately so Play icon & player bar respond in 0ms
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(song.duration || 28);
      setIsPlaying(true);

      // Fast synchronous path for all server & AI audio streams
      const syncStreamUrl = getDirectStreamUrlSync(song);
      if (syncStreamUrl) {
        const cacheKey = getSongCacheKey(song);
        setAudioUrlCache((prev) => (prev[cacheKey] === syncStreamUrl ? prev : { ...prev, [cacheKey]: syncStreamUrl }));
        audio.pause();
        audio.src = syncStreamUrl;
        audio.volume = isMuted ? 0 : volume;
        await audio.play();
        return;
      }

      // Async fallback only if song has no audioUrl at all
      audio.pause();
      const resolvedUrl = await prepareSongAudio(song);
      setCurrentSong({ ...song, audioUrl: song.audioUrl || resolvedUrl });
      audio.src = resolvedUrl;
      audio.volume = isMuted ? 0 : volume;
      await audio.play();
    } catch (err) {
      console.error('[SONIQ_PLAYER_ERROR] Failed to load or decode audio playback:', err);
      setIsPlaying(false);
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!currentSong && songs.length > 0) {
      playSong(songs[0]);
      return;
    }
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolumeLevel = (vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : vol;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const playNext = () => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      nextIdx = 0;
    }
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx], queue);
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx], queue);
  };

  const toggleShuffle = () => setIsShuffle((prev) => !prev);
  const toggleRepeat = () => setIsRepeat((prev) => !prev);

  const toggleFavorite = async (songId: string) => {
    const song = songs.find((s) => s.id === songId);
    if (!song) return;
    const updated = await api.updateSong(songId, { isFavorite: !song.isFavorite });
    setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, isFavorite: updated.isFavorite } : s)));
    if (currentSong?.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, isFavorite: updated.isFavorite } : null));
    }
  };

  const deleteSong = async (songId: string) => {
    const target = songs.find((s) => s.id === songId);
    await api.deleteSong(songId);

    // Revoke any temporary object URLs associated with the deleted song
    if (target) {
      const key = getSongCacheKey(target);
      const cachedUrl = audioUrlCache[key] || audioUrlCache[songId];
      if (cachedUrl && cachedUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(cachedUrl);
        } catch {
          // Ignore revoke error
        }
      }
    }

    setSongs((prev) => prev.filter((s) => s.id !== songId));
    setQueue((prev) => prev.filter((s) => s.id !== songId));
    if (currentSong?.id === songId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      setIsPlaying(false);
      setCurrentSong(null);
    }
  };

  const updateSongTitle = async (songId: string, newTitle: string) => {
    const updated = await api.updateSong(songId, { title: newTitle });
    setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, title: updated.title } : s)));
    if (currentSong?.id === songId) {
      setCurrentSong((prev) => (prev ? { ...prev, title: updated.title } : null));
    }
  };

  const updateSongInStudio = async (songId: string, updates: Partial<Song>): Promise<Song> => {
    const updated = await api.updateSong(songId, updates);
    const current = songs.find((s) => s.id === songId);
    const mergedSong: Song = { ...(current || updated), ...updated, ...updates, audioUrl: updated.audioUrl || current?.audioUrl || '' };

    const newPlaybackUrl = await prepareSongAudio(mergedSong, true);

    setSongs((prev) => prev.map((s) => (s.id === songId ? mergedSong : s)));
    setStudioModalSong(mergedSong);

    if (currentSong?.id === songId) {
      setCurrentSong(mergedSong);
      if (audioRef.current) {
        const wasPlaying = isPlaying;
        audioRef.current.pause();
        audioRef.current.src = newPlaybackUrl;
        audioRef.current.load();
        if (wasPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
    return mergedSong;
  };

  const addSongToPlaylist = async (songId: string, playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    if (playlist.songIds.includes(songId)) return;

    const newSongIds = [...playlist.songIds, songId];
    const updated = await api.updatePlaylist(playlistId, { songIds: newSongIds });
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  };

  const removeSongFromPlaylist = async (songId: string, playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const newSongIds = playlist.songIds.filter((id) => id !== songId);
    const updated = await api.updatePlaylist(playlistId, { songIds: newSongIds });
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
  };

  const createNewPlaylist = async (name: string, description: string = '') => {
    const created = await api.createPlaylist(name, description);
    setPlaylists((prev) => [created, ...prev]);
    return created;
  };

  const deletePlaylist = async (playlistId: string) => {
    await api.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const openLyricsModal = (song: Song) => setLyricsModalSong(song);
  const closeLyricsModal = () => setLyricsModalSong(null);
  const openStudioModal = (song: Song) => setStudioModalSong(song);
  const closeStudioModal = () => setStudioModalSong(null);

  const setPrefillStudio = (genre?: import('../types').Genre, prompt?: string) => {
    if (genre) setPrefillGenre(genre);
    if (prompt !== undefined) setPrefillPrompt(prompt);
    setActiveTab('create');
  };

  const attachSynthesizedAudio = (songId: string, audioUrl: string, blob?: Blob) => {
    setAudioUrlCache((prev) => {
      const existing = prev[songId];
      if (existing && existing.startsWith('blob:') && existing !== audioUrl) {
        try {
          URL.revokeObjectURL(existing);
        } catch {
          // Ignore revoke error
        }
      }
      return { ...prev, [songId]: audioUrl };
    });
    if (blob) {
      setAudioBlobCache((prev) => ({ ...prev, [songId]: blob }));
    }
  };

  const downloadSongAudio = async (song: Song) => {
    const cacheKey = getSongCacheKey(song);
    let blob = audioBlobCache[cacheKey] || audioBlobCache[song.id];

    // Fetch actual server/AI audio stream if not already in blob cache
    if (!blob && song.audioUrl) {
      try {
        const response = await fetch(song.audioUrl, { cache: 'no-store' });
        if (response.ok) {
          blob = await response.blob();
          setAudioBlobCache((prev) => ({ ...prev, [cacheKey]: blob!, [song.id]: blob! }));
        }
      } catch (err) {
        console.warn('Could not fetch server stream for download, falling back to local DSP render:', err);
      }
    }

    if (!blob) {
      const derivedSeed =
        typeof song.seed === 'number' && song.seed > 0
          ? song.seed
          : hashStringToSeed(`${song.id}|${song.generationId || ''}|${song.title}|${song.prompt}|${song.lyrics || ''}`);

      const res = await generateSynthesizedTrackAudio({
        genre: song.genre,
        bpm: song.bpm,
        mood: song.mood,
        durationSeconds: song.duration || 32,
        seed: derivedSeed,
        prompt: song.prompt,
        lyrics: song.lyrics || '',
        title: song.title,
        camelotKey: song.camelotKey || '8A (A Minor)',
        vocalMode: song.vocalMode || 'female',
        isInstrumental: song.isInstrumental,
        djIntroStyle: song.djIntroStyle || '16-bar-percussive',
        djOutroStyle: song.djOutroStyle || '16-bar-dj-loop',
        stemMix: song.stemMix,
      });
      blob = res.blob;
      setAudioBlobCache((prev) => ({ ...prev, [cacheKey]: blob!, [song.id]: blob! }));
    }

    const ext = blob.type.includes('mpeg') || blob.type.includes('mp3') ? 'mp3' : 'wav';
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${song.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(song.generationId || song.id).slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  };

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        isShuffle,
        isRepeat,
        songs,
        playlists,
        isLoadingSongs,
        activeTab,
        lyricsModalSong,
        studioModalSong,
        userProfile,
        audioBlobCache,
        prefillGenre,
        prefillPrompt,
        credits,
        transactions,
        canClaimDaily,
        nextClaimMs,
        isCreditsModalOpen,
        openCreditsModal,
        closeCreditsModal,
        claimDailyBonus,
        purchaseCredits,
        deductCredits,
        refreshCredits,
        setActiveTab,
        setPrefillStudio,
        playSong,
        pauseSong,
        togglePlay,
        seekTo,
        setVolumeLevel,
        toggleMute,
        playNext,
        playPrev,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        deleteSong,
        updateSongTitle,
        updateSongInStudio,
        addSongToPlaylist,
        removeSongFromPlaylist,
        createNewPlaylist,
        deletePlaylist,
        openLyricsModal,
        closeLyricsModal,
        openStudioModal,
        closeStudioModal,
        refreshLibrary: loadData,
        attachSynthesizedAudio,
        downloadSongAudio,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
