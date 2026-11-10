import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import {
  CamelotKey,
  DJIntroStyle,
  DJOutroStyle,
  SongSection,
  StemMix,
} from '../types';
import { api } from '../services/api';
import { generateCoverArt } from '../utils/artworkGenerator';
import confetti from 'canvas-confetti';
import {
  Sliders,
  X,
  Play,
  Pause,
  Sparkles,
  Disc,
  Layers,
  Globe,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Volume2,
  Music,
  Download,
} from 'lucide-react';

const CAMELOT_KEYS: CamelotKey[] = [
  '8A (A Minor)',
  '9A (E Minor)',
  '7A (D Minor)',
  '6A (G Minor)',
  '4A (F Minor)',
  '5A (C Minor)',
  '10A (B Minor)',
  '8B (C Major)',
  '11B (A Major)',
];

const DJ_INTRO_OPTIONS: { id: DJIntroStyle; label: string; desc: string }[] = [
  { id: '16-bar-percussive', label: '16-Bar Percussive DJ Intro', desc: 'Strakke 4/4 kick & shakers zonder melodie voor naadloos inmixen' },
  { id: '32-bar-club-grid', label: '32-Bar Extended Club Grid', desc: 'Lange DJ beatgrid opbouw met rolling sub-bass lock' },
  { id: 'filtered-sub-roll', label: 'Filtered Sub & Hat Roll', desc: 'Low-pass filter sweep vanuit diepe club sub' },
  { id: 'none', label: 'Radio Edit (Direct Start)', desc: 'Geen DJ intro, direct starten met akkoorden & vocal' },
];

const DJ_OUTRO_OPTIONS: { id: DJOutroStyle; label: string; desc: string }[] = [
  { id: '16-bar-dj-loop', label: '16-Bar DJ Mix-Out Loop', desc: 'Stripped drum- & percussieloop voor strakke overgangen' },
  { id: '32-bar-extended', label: '32-Bar Extended Club Outro', desc: 'Geleidelijke afbouw van synths naar pure beatgrid' },
  { id: 'dub-delay-strip', label: 'Dub Delay Strip-Down', desc: 'Analoge tape-echo tail op laatste vocal/chord stab' },
  { id: 'none', label: 'Radio Fade-Out', desc: 'Compact einde zonder verlengde DJ mix-out' },
];

const DEFAULT_ARRANGEMENT: SongSection[] = [
  { id: 'sec-1', type: 'dj_intro', label: 'DJ Beatgrid Intro', bars: 16, energy: 45 },
  { id: 'sec-2', type: 'groove_verse', label: 'Sub Groove & Vocal', bars: 16, energy: 68 },
  { id: 'sec-3', type: 'breakdown', label: 'Melodic Breakdown', bars: 8, energy: 40 },
  { id: 'sec-4', type: 'buildup', label: 'Snare & Filter Riser', bars: 8, energy: 82 },
  { id: 'sec-5', type: 'main_drop', label: 'Peak-Time Club Drop', bars: 16, energy: 100 },
  { id: 'sec-6', type: 'vocal_bridge', label: 'Multilingual Hook Bridge', bars: 8, energy: 60 },
  { id: 'sec-7', type: 'second_drop', label: '2nd Rolling Drop', bars: 16, energy: 98 },
  { id: 'sec-8', type: 'dj_outro', label: 'DJ Mix-Out Loop', bars: 16, energy: 45 },
];

const VOCAL_LANGUAGES = [
  'Spanish',
  'English',
  'Yoruba / Swahili Chants',
  'Portuguese',
  'French',
  'Dutch',
  'Italian',
  'Arabic',
];

export const TrackStudioModal: React.FC = () => {
  const {
    studioModalSong,
    closeStudioModal,
    updateSongInStudio,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    downloadSongAudio,
    refreshLibrary,
    credits,
    openCreditsModal,
    refreshCredits,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'stems' | 'arrangement' | 'vocals'>('stems');
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState(124);
  const [camelotKey, setCamelotKey] = useState<CamelotKey>('8A (A Minor)');
  const [mixType, setMixType] = useState<'Original Club Mix' | 'Extended DJ Mix' | 'VIP Dub Edit' | 'Radio Vocal Mix'>('Extended DJ Mix');
  const [djIntroStyle, setDjIntroStyle] = useState<DJIntroStyle>('16-bar-percussive');
  const [djOutroStyle, setDjOutroStyle] = useState<DJOutroStyle>('16-bar-dj-loop');
  const [arrangement, setArrangement] = useState<SongSection[]>(DEFAULT_ARRANGEMENT);
  const [vocalLanguages, setVocalLanguages] = useState<string[]>(['Spanish', 'English']);
  const [lyrics, setLyrics] = useState('');
  const [stemMix, setStemMix] = useState<StemMix>({
    kickSub: 90,
    percussion: 88,
    synthsChords: 85,
    vocalsChants: 85,
    sidechainPump: 84,
    filterCutoff: 88,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingVip, setIsCreatingVip] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (studioModalSong) {
      setTitle(studioModalSong.title);
      setBpm(studioModalSong.bpm || 124);
      setCamelotKey((studioModalSong.camelotKey as CamelotKey) || '8A (A Minor)');
      setMixType(studioModalSong.mixType || 'Extended DJ Mix');
      setDjIntroStyle((studioModalSong.djIntroStyle as DJIntroStyle) || '16-bar-percussive');
      setDjOutroStyle((studioModalSong.djOutroStyle as DJOutroStyle) || '16-bar-dj-loop');
      setArrangement(
        studioModalSong.arrangement && studioModalSong.arrangement.length > 0
          ? studioModalSong.arrangement
          : DEFAULT_ARRANGEMENT
      );
      setVocalLanguages(
        studioModalSong.vocalLanguages && studioModalSong.vocalLanguages.length > 0
          ? studioModalSong.vocalLanguages
          : [studioModalSong.language || 'English']
      );
      setLyrics(studioModalSong.lyrics || '');
      setStemMix(
        studioModalSong.stemMix || {
          kickSub: 90,
          percussion: 88,
          synthsChords: 85,
          vocalsChants: studioModalSong.isInstrumental ? 0 : 88,
          sidechainPump: 84,
          filterCutoff: 88,
        }
      );
      setStatusMessage(null);
    }
  }, [studioModalSong]);

  if (!studioModalSong) return null;

  const isThisPlaying = currentSong?.id === studioModalSong.id && isPlaying;
  const totalBars = arrangement.reduce((acc, s) => acc + s.bars, 0);

  const toggleLanguage = (lang: string) => {
    setVocalLanguages((prev) =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter((l) => l !== lang) : prev) : [...prev, lang]
    );
  };

  const handleSectionBarsChange = (id: string, bars: 8 | 16 | 32) => {
    setArrangement((prev) => prev.map((s) => (s.id === id ? { ...s, bars } : s)));
  };

  const handleSectionEnergyChange = (id: string, energy: number) => {
    setArrangement((prev) => prev.map((s) => (s.id === id ? { ...s, energy } : s)));
  };

  const handleAddSection = (type: SongSection['type'], label: string) => {
    const newSec: SongSection = {
      id: `sec-${Date.now()}`,
      type,
      label,
      bars: 16,
      energy: type.includes('drop') ? 98 : 65,
    };
    setArrangement((prev) => [...prev, newSec]);
  };

  const handleRemoveSection = (id: string) => {
    if (arrangement.length <= 3) return;
    setArrangement((prev) => prev.filter((s) => s.id !== id));
  };

  // Update Track In-Place (Free)
  const handleUpdateInPlace = async () => {
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      let newDuration = 34;
      if (djIntroStyle !== 'none') newDuration += djIntroStyle.includes('32') ? 8 : 5;
      if (djOutroStyle !== 'none') newDuration += djOutroStyle.includes('32') ? 8 : 5;

      const updated = await updateSongInStudio(studioModalSong.id, {
        title: title.trim() || studioModalSong.title,
        bpm,
        camelotKey,
        mixType,
        djIntroStyle,
        djOutroStyle,
        arrangement,
        stemMix,
        vocalLanguages,
        language: vocalLanguages.join(' & '),
        lyrics,
        isInstrumental: stemMix.vocalsChants === 0,
        duration: newDuration,
      });

      setStatusMessage('✅ Studio Mix, DJ Intro/Outro & 4-Stem Audio succesvol bijgewerkt!');
      await playSong(updated);
    } catch {
      setStatusMessage('Kon wijzigingen niet opslaan.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Render as New VIP / Extended Club Edit (5 Credits)
  const handleSaveAsNewVipRemix = async () => {
    if (credits < 5) {
      openCreditsModal();
      setStatusMessage('Je hebt 5 credits nodig om een nieuwe VIP Club Edit te masteren.');
      return;
    }

    setIsCreatingVip(true);
    setStatusMessage(null);
    try {
      const remixTitle = title.includes('VIP') || title.includes('Extended')
        ? title
        : `${title} (${mixType})`;

      const res = await api.generateMusic({
        title: remixTitle,
        prompt: `${studioModalSong.prompt} [${mixType}, ${bpm} BPM, Key ${camelotKey}, DJ Intro: ${djIntroStyle}, DJ Outro: ${djOutroStyle}]`,
        lyrics,
        genre: studioModalSong.genre,
        bpm,
        mood: studioModalSong.mood,
        vocalMode: stemMix.vocalsChants === 0 ? 'instrumental' : studioModalSong.vocalMode,
        language: vocalLanguages.join(' & '),
        vocalLanguages,
        isInstrumental: stemMix.vocalsChants === 0,
        provider: 'internal-synth',
        generateDualVersions: false,
        extendedFromId: studioModalSong.id,
        camelotKey,
        djIntroStyle,
        djOutroStyle,
        arrangement,
        stemMix,
        mixType,
      });

      const createdSong = res.songs[0];
      if (createdSong) {
        const enriched = {
          ...createdSong,
          coverArtUrl: generateCoverArt(createdSong.title, createdSong.genre, createdSong.mood, Date.now()),
        };
        await api.saveSong(enriched);
        await refreshLibrary();
        await refreshCredits();

        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#A855F7', '#EC4899', '#10B981'],
        });

        setStatusMessage(`🔥 Nieuwe "${enriched.title}" opgeslagen in je bibliotheek!`);
        await playSong(enriched);
      }
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'VIP Remix generatie mislukt.');
    } finally {
      setIsCreatingVip(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={closeStudioModal}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0C0916] border border-purple-500/35 rounded-2xl md:rounded-3xl shadow-2xl shadow-purple-950/70 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Studio Header */}
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/40 via-[#120D24] to-[#0C0916]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-purple-500/40 shrink-0 shadow-md">
              <img
                src={studioModalSong.coverArtUrl}
                alt={studioModalSong.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  if (currentSong?.id === studioModalSong.id) {
                    togglePlay();
                  } else {
                    playSong(studioModalSong);
                  }
                }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white hover:bg-purple-900/60 transition-colors cursor-pointer"
              >
                {isThisPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  SONIQ Track Studio & DJ Editor
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {studioModalSong.genre} • {bpm} BPM • {camelotKey.split(' ')[0]}
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-transparent text-base md:text-lg font-extrabold text-white focus:outline-none focus:border-b border-purple-400 w-full truncate"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => downloadSongAudio(studioModalSong)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
              title="Download huidige WAV Master"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>WAV</span>
            </button>
            <button
              onClick={closeStudioModal}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Feedback Banner */}
        {statusMessage && (
          <div className="px-5 py-2.5 bg-purple-950/80 border-b border-purple-500/30 text-xs font-semibold text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Studio Navigation Tabs */}
        <div className="px-5 pt-3 flex gap-2 border-b border-purple-900/30 bg-[#0E0B1A] overflow-x-auto">
          <button
            onClick={() => setActiveTab('stems')}
            className={`pb-2.5 px-3 text-xs md:text-sm font-bold flex items-center gap-1.5 relative whitespace-nowrap cursor-pointer ${
              activeTab === 'stems' ? 'text-purple-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Stems, BPM & Club Mastering</span>
            {activeTab === 'stems' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('arrangement')}
            className={`pb-2.5 px-3 text-xs md:text-sm font-bold flex items-center gap-1.5 relative whitespace-nowrap cursor-pointer ${
              activeTab === 'arrangement' ? 'text-purple-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. DJ Intro/Outro & Songstructuur ({totalBars} Bars)</span>
            {activeTab === 'arrangement' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('vocals')}
            className={`pb-2.5 px-3 text-xs md:text-sm font-bold flex items-center gap-1.5 relative whitespace-nowrap cursor-pointer ${
              activeTab === 'vocals' ? 'text-purple-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Meertalige Zang & Lyrics Editor</span>
            {activeTab === 'vocals' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Main Studio Workspace */}
        <div className="p-5 md:p-6 max-h-[62vh] overflow-y-auto space-y-6">
          {/* TAB 1: STEMS, BPM & KEY */}
          {activeTab === 'stems' && (
            <div className="space-y-6">
              {/* Top Row: BPM, Camelot Key & Mix Version */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Exact BPM Control */}
                <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Exacte Club BPM</span>
                    <span className="font-mono text-sm font-extrabold text-purple-300">{bpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min={90}
                    max={160}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {[120, 122, 124, 126, 128].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBpm(preset)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                          bpm === preset
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camelot Key Selector */}
                <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-2">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Camelot Key (Harmonic Mixing)
                  </span>
                  <select
                    value={camelotKey}
                    onChange={(e) => setCamelotKey(e.target.value as CamelotKey)}
                    className="w-full bg-[#0A0814] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  >
                    {CAMELOT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Gegarandeerde toonsoort-lock voor harmonisch mixen in Rekordbox & Traktor.
                  </p>
                </div>

                {/* Mix Edition Type */}
                <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-2">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Club Mix Uitvoering
                  </span>
                  <select
                    value={mixType}
                    onChange={(e) => setMixType(e.target.value as typeof mixType)}
                    className="w-full bg-[#0A0814] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-purple-400"
                  >
                    <option value="Extended DJ Mix">Extended DJ Mix (Club Intro/Outro)</option>
                    <option value="Original Club Mix">Original Club Mix</option>
                    <option value="VIP Dub Edit">VIP Dub Edit (Extra Sub & Sidechain)</option>
                    <option value="Radio Vocal Mix">Radio Vocal Mix</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Bepaalt de dynamische balans tussen drums, sub-bass en vocalen.
                  </p>
                </div>
              </div>

              {/* 4-Stem Mixer & Club DSP Sliders */}
              <div className="p-5 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      4-Stem Studio Mixer & Sidechain DSP
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pas het volume van afzonderlijke stems aan. Zet bijv. Vocals op 0% voor een directe Instrumental Dub Mix.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setStemMix({
                        kickSub: 92,
                        percussion: 90,
                        synthsChords: 85,
                        vocalsChants: 88,
                        sidechainPump: 85,
                        filterCutoff: 88,
                      })
                    }
                    className="text-xs text-purple-400 hover:underline cursor-pointer"
                  >
                    Reset naar Club Master
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'kickSub', label: 'Kick & Rolling Sub-Bass', desc: '4/4 Club Punch & Low-end' },
                    { key: 'percussion', label: 'Tribal / 909 Percussie', desc: 'Hats, Congas, Timbales & Claps' },
                    { key: 'synthsChords', label: 'Synths, Rhodes & Montuno', desc: 'Akkoorden, Leads & Stabs' },
                    { key: 'vocalsChants', label: 'Vocals & Afro/Latin Chants', desc: '0% = Volledig Instrumentaal' },
                    { key: 'sidechainPump', label: 'Sidechain Ducking Pump', desc: 'Club pomp-effect op de kick' },
                    { key: 'filterCutoff', label: 'Analog Low-Pass Filter', desc: 'Warmte vs. felle high-energy' },
                  ].map((item) => {
                    const val = stemMix[item.key as keyof StemMix];
                    return (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{item.label}</span>
                          <span className="font-mono font-bold text-purple-300">{val}%</span>
                        </div>
                        <input
                          type="range"
                          min={item.key === 'filterCutoff' ? 25 : 0}
                          max={100}
                          value={val}
                          onChange={(e) =>
                            setStemMix((prev) => ({
                              ...prev,
                              [item.key]: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-purple-500 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DJ INTRO / OUTRO & SONG ARRANGEMENT */}
          {activeTab === 'arrangement' && (
            <div className="space-y-6">
              {/* DJ Intro & Outro Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Disc className="w-4 h-4" /> DJ Mix-In Intro Stijl
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">CDJ Beatgrid Ready</span>
                  </div>
                  <div className="space-y-2">
                    {DJ_INTRO_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDjIntroStyle(opt.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          djIntroStyle === opt.id
                            ? 'bg-purple-900/40 border-purple-400 text-white'
                            : 'bg-black/30 border-white/[0.06] text-slate-300 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{opt.label}</span>
                          {djIntroStyle === opt.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Disc className="w-4 h-4" /> DJ Mix-Out Outro Stijl
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Naadloze Overgang</span>
                  </div>
                  <div className="space-y-2">
                    {DJ_OUTRO_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDjOutroStyle(opt.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          djOutroStyle === opt.id
                            ? 'bg-pink-900/30 border-pink-400 text-white'
                            : 'bg-black/30 border-white/[0.06] text-slate-300 hover:border-pink-500/30'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{opt.label}</span>
                          {djOutroStyle === opt.id && <Check className="w-3.5 h-3.5 text-pink-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Song Structure Timeline */}
              <div className="p-5 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Interactieve Club Songstructuur & Energie-curve
                    </h3>
                    <p className="text-xs text-slate-400">
                      Bepaal het aantal maten (8, 16 of 32 bars) en de energie-intensiteit per sectie.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddSection('breakdown', 'Extra Breakdown')}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Breakdown
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('main_drop', 'Peak Drop')}
                      className="px-2.5 py-1 rounded-lg bg-pink-950/60 border border-pink-500/30 text-[11px] text-pink-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Extra Drop
                    </button>
                  </div>
                </div>

                {/* Horizontal Energy Bar Preview */}
                <div className="flex items-end gap-1.5 h-24 p-3 rounded-xl bg-black/50 border border-white/[0.05] overflow-x-auto">
                  {arrangement.map((sec, idx) => (
                    <div
                      key={sec.id}
                      style={{ flex: sec.bars }}
                      className="flex flex-col items-center justify-end h-full min-w-[68px] group"
                    >
                      <div
                        style={{ height: `${Math.max(25, sec.energy)}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          sec.type.includes('drop')
                            ? 'bg-gradient-to-t from-purple-600 to-pink-500'
                            : sec.type.includes('dj_')
                            ? 'bg-gradient-to-t from-emerald-700 to-teal-400'
                            : 'bg-gradient-to-t from-indigo-800 to-purple-400'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-300 truncate max-w-full mt-1">
                        {idx + 1}. {sec.bars}B
                      </span>
                    </div>
                  ))}
                </div>

                {/* Section List Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {arrangement.map((sec, index) => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {index + 1}. {sec.label}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">Bars:</span>
                          {([8, 16, 32] as const).map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => handleSectionBarsChange(sec.id, b)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                sec.bars === b
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white/[0.05] text-slate-400 hover:text-white'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="block text-[10px] font-mono text-purple-300">
                            Energie {sec.energy}%
                          </span>
                          <input
                            type="range"
                            min={20}
                            max={100}
                            value={sec.energy}
                            onChange={(e) => handleSectionEnergyChange(sec.id, Number(e.target.value))}
                            className="w-20 accent-purple-500 cursor-pointer"
                          />
                        </div>
                        {arrangement.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sec.id)}
                            className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Verwijder sectie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTILINGUAL VOCALS & LYRICS */}
          {activeTab === 'vocals' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      Meertalige Zang & Club Chants Combineren
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selecteer één of meerdere talen voor tweetalige club-hooks (bijv. Spaans + Engels of Yoruba Afro Chants + Engels).
                    </p>
                  </div>
                  <span className="text-xs font-mono text-purple-300">
                    {vocalLanguages.join(' + ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {VOCAL_LANGUAGES.map((lang) => {
                    const selected = vocalLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          selected
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm'
                            : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-purple-300" />}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#130F24] border border-purple-500/25 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Songtekst, Vocal Chops & DJ Cue-Markers Bewerken
                </label>
                <textarea
                  rows={7}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="[16-Bar DJ Intro]&#10;[Verse - Español / English]&#10;[Main Club Drop]..."
                  className="w-full bg-[#090712] border border-purple-500/30 rounded-xl p-3.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Studio Modal Footer Actions */}
        <div className="p-4 md:px-6 md:py-4 bg-[#090712] border-t border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              Directe 4-stem her-synthese is <strong>gratis</strong>, of render als losstaande VIP Club Track.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleUpdateInPlace}
              disabled={isUpdating || isCreatingVip}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-purple-500/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Update Huidige Track (Gratis)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAsNewVipRemix}
              disabled={isUpdating || isCreatingVip}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {isCreatingVip ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
              )}
              <span>Render Nieuwe {mixType} (5 CR)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
