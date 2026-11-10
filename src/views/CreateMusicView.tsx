import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import {
  Genre,
  Mood,
  VocalMode,
  MusicProvider,
  Song,
  DJIntroStyle,
  DJOutroStyle,
  CamelotKey,
  SongSection,
} from '../types';
import { api } from '../services/api';
import { LyricsAssistantModal } from '../components/LyricsAssistantModal';
import { generateCoverArt } from '../utils/artworkGenerator';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Music,
  Sliders,
  Wand2,
  Mic,
  Disc,
  Play,
  RotateCw,
  Clock,
  Layers,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Split,
  Zap,
  Radio,
  Globe2,
  Plus,
  Trash2,
} from 'lucide-react';

const GENRES: {
  name: Genre;
  desc: string;
  icon: string;
  defaultBpm: number;
  defaultKey: CamelotKey;
  isFlagshipClub?: boolean;
}[] = [
  {
    name: 'Deep House',
    desc: 'Warm 4/4 groove, rolling sub-bass & lush minor-9th Rhodes chords',
    icon: '🎧',
    defaultBpm: 124,
    defaultKey: '9A (E Minor)',
    isFlagshipClub: true,
  },
  {
    name: 'Afro House',
    desc: 'Polyrhythmic djembe & shakers, log-drum sub & spiritual Afro chants',
    icon: '🥁',
    defaultBpm: 122,
    defaultKey: '8A (A Minor)',
    isFlagshipClub: true,
  },
  {
    name: 'Latin House',
    desc: 'Syncopated piano montunos, live timbales, brass & Spanish/Portuguese hooks',
    icon: '🎺',
    defaultBpm: 126,
    defaultKey: '7A (D Minor)',
    isFlagshipClub: true,
  },
  {
    name: 'Tech House',
    desc: 'Punchy warehouse kick, rolling bassline & hypnotic vocal chops',
    icon: '⚡',
    defaultBpm: 128,
    defaultKey: '4A (F Minor)',
    isFlagshipClub: true,
  },
  {
    name: 'Melodic Techno',
    desc: 'Hypnotic analog Moog arpeggios, cinematic breakdown & dark pulse',
    icon: '🌌',
    defaultBpm: 125,
    defaultKey: '6A (G Minor)',
    isFlagshipClub: true,
  },
  {
    name: 'Progressive House',
    desc: 'Euphoric plucked synth leads, long harmonic builds & wide stereo pads',
    icon: '🎚️',
    defaultBpm: 126,
    defaultKey: '10A (B Minor)',
    isFlagshipClub: true,
  },
  {
    name: 'EDM',
    desc: 'Mainstage festival drops & high-energy synth saws',
    icon: '🎆',
    defaultBpm: 128,
    defaultKey: '11B (A Major)',
  },
  {
    name: 'Cyberpunk',
    desc: 'Dark dystopian analog saws & mid-tempo industrial bass',
    icon: '🕶',
    defaultBpm: 118,
    defaultKey: '5A (C Minor)',
  },
  {
    name: 'Synthwave',
    desc: 'Retro 80s analog arps & gated reverb drums',
    icon: '🌆',
    defaultBpm: 115,
    defaultKey: '8A (A Minor)',
  },
  {
    name: 'Pop',
    desc: 'Modern electronic dance-pop crossover hooks',
    icon: '✨',
    defaultBpm: 120,
    defaultKey: '8B (C Major)',
  },
  {
    name: 'R&B',
    desc: 'Silky neo-soul Rhodes chords & warm sub-grooves',
    icon: '🌙',
    defaultBpm: 98,
    defaultKey: '7A (D Minor)',
  },
  {
    name: 'Hip Hop',
    desc: 'Heavy 808 sub slides & crisp rhythmic percussion',
    icon: '🎤',
    defaultBpm: 95,
    defaultKey: '5A (C Minor)',
  },
  {
    name: 'Reggaeton',
    desc: 'Club dembow rhythm & Latin urban bass',
    icon: '🌴',
    defaultBpm: 100,
    defaultKey: '7A (D Minor)',
  },
  {
    name: 'Lo-Fi',
    desc: 'Dusty late-night vinyl chords & relaxed beat',
    icon: '☕',
    defaultBpm: 86,
    defaultKey: '9A (E Minor)',
  },
];

const MOODS: Mood[] = [
  'Euphoric',
  'Energetic',
  'Dark & Gritty',
  'Mysterious',
  'Uplifting',
  'Chill',
  'Melancholic',
  'Dreamy',
  'Aggressive',
  'Romantic',
];

const CAMELOT_KEYS: { key: CamelotKey; label: string }[] = [
  { key: '8A (A Minor)', label: '8A (A Minor • Deep/Afro)' },
  { key: '9A (E Minor)', label: '9A (E Minor • Warm Club)' },
  { key: '7A (D Minor)', label: '7A (D Minor • Latin/Tribal)' },
  { key: '6A (G Minor)', label: '6A (G Minor • Melodic)' },
  { key: '5A (C Minor)', label: '5A (C Minor • Dark Tech)' },
  { key: '4A (F Minor)', label: '4A (F Minor • Warehouse)' },
  { key: '10A (B Minor)', label: '10A (B Minor • Euphoric)' },
  { key: '8B (C Major)', label: '8B (C Major • Uplifting)' },
  { key: '11B (A Major)', label: '11B (A Major • Peak)' },
];

const DJ_INTRO_OPTIONS: { id: DJIntroStyle; label: string; desc: string; bars: 8 | 16 | 32 }[] = [
  {
    id: '16-bar-percussive',
    label: '16-Bar Percussive DJ Intro',
    desc: 'Strakke 4/4 kick & shakers zonder botsende akkoorden voor snel inmixen',
    bars: 16,
  },
  {
    id: '32-bar-club-grid',
    label: '32-Bar Extended Club Grid',
    desc: 'Volledige 32 maten CDJ beatmatch-intro met geleidelijke sub-bass opbouw',
    bars: 32,
  },
  {
    id: 'filtered-sub-roll',
    label: '16-Bar Low-Pass Sub Roll',
    desc: 'Diepe gefilterde sub-bass en rimshots die openfilteren naar de groove',
    bars: 16,
  },
  {
    id: 'none',
    label: '8-Bar Direct Intro (Radio)',
    desc: 'Korte intro direct in het muzikale thema',
    bars: 8,
  },
];

const DJ_OUTRO_OPTIONS: { id: DJOutroStyle; label: string; desc: string; bars: 8 | 16 | 32 }[] = [
  {
    id: '16-bar-dj-loop',
    label: '16-Bar DJ Mix-Out Loop',
    desc: 'Strakke percussieve mix-out zonder melodie voor naadloze overgangen',
    bars: 16,
  },
  {
    id: '32-bar-extended',
    label: '32-Bar Extended Club Outro',
    desc: 'Lange club-afbouw waarbij synths wegfilteren tot pure kick & hats',
    bars: 32,
  },
  {
    id: 'dub-delay-strip',
    label: '16-Bar Dub Delay Strip',
    desc: 'Hypnotiserende dub-echo staart met rollende sub-bass',
    bars: 16,
  },
  {
    id: 'none',
    label: '8-Bar Smooth Fade',
    desc: 'Klassieke studio fade-out',
    bars: 8,
  },
];

const VOCAL_LANGUAGES = [
  'Spanish',
  'English',
  'Yoruba / Swahili (Afro Chant)',
  'Portuguese',
  'French',
  'Dutch',
  'Italian',
  'Arabic',
];

const VOCAL_STYLES = [
  'Hypnotic Club Hook',
  'Afro Tribal Chant & Call-Response',
  'Latin Fiesta / Montuno Vocal',
  'Soulful Deep House Diva',
  'Tech House Spoken Word & Chop',
  'Bilingual Whisper & Melodic Chorus',
];

const ARRANGEMENT_PRESETS: { name: string; sections: SongSection[] }[] = [
  {
    name: 'Extended DJ Club Mix (Standaard)',
    sections: [
      { id: 'sec-1', type: 'dj_intro', label: 'DJ Beatmatch Intro', bars: 16, energy: 45, description: '4/4 Kick & Percussie' },
      { id: 'sec-2', type: 'groove_verse', label: 'Sub-Bass & Groove', bars: 16, energy: 70, description: 'Rollende sub & chords' },
      { id: 'sec-3', type: 'breakdown', label: 'Melodic Breakdown', bars: 16, energy: 50, description: 'Low-pass pads & vocals' },
      { id: 'sec-4', type: 'buildup', label: 'Snare & Riser Build', bars: 8, energy: 85, description: 'Filter sweep & snare roll' },
      { id: 'sec-5', type: 'main_drop', label: 'Main Club Drop', bars: 32, energy: 98, description: 'Volledige sub, kick & hook' },
      { id: 'sec-6', type: 'dj_outro', label: 'DJ Mix-Out Loop', bars: 16, energy: 40, description: 'Clean percussie loop' },
    ],
  },
  {
    name: 'Afro & Deep Hypnotic Journey (Lang)',
    sections: [
      { id: 'af-1', type: 'dj_intro', label: '32-Bar Tribal DJ Grid', bars: 32, energy: 42, description: 'Shakers, conga & kick' },
      { id: 'af-2', type: 'groove_verse', label: 'Log-Drum & Chants', bars: 16, energy: 72, description: 'Diepe Afro sub & zang' },
      { id: 'af-3', type: 'breakdown', label: 'Spiritual Vocal Break', bars: 16, energy: 48, description: 'Kalimba, pads & Yoruba/ES zang' },
      { id: 'af-4', type: 'buildup', label: 'Polyrhythm Tension', bars: 16, energy: 86, description: 'Djembe crescendo' },
      { id: 'af-5', type: 'main_drop', label: 'Sunset Peak Groove', bars: 32, energy: 95, description: 'Volle percussie & meertalige hook' },
      { id: 'af-6', type: 'dj_outro', label: '32-Bar DJ Outro', bars: 32, energy: 38, description: 'Uitgeklede percussie mix-out' },
    ],
  },
  {
    name: 'Peak-Time Tech & Latin Weapon',
    sections: [
      { id: 'pk-1', type: 'dj_intro', label: '16-Bar Warehouse Kick', bars: 16, energy: 55, description: 'Punchy kick & 909 hats' },
      { id: 'pk-2', type: 'buildup', label: 'Vocal Chop & Riser', bars: 8, energy: 84, description: 'Snelle spanningsboog' },
      { id: 'pk-3', type: 'main_drop', label: 'Drop 1 (Rolling Bass)', bars: 32, energy: 100, description: 'Maximale sub-impact' },
      { id: 'pk-4', type: 'vocal_bridge', label: 'Montuno / Synth Break', bars: 16, energy: 58, description: 'Spaanse hook / piano riff' },
      { id: 'pk-5', type: 'second_drop', label: 'Drop 2 (VIP Climax)', bars: 32, energy: 100, description: 'Extra percussie & stabs' },
      { id: 'pk-6', type: 'dj_outro', label: '16-Bar Clean Loop', bars: 16, energy: 45, description: 'Strakke DJ mix-out' },
    ],
  },
];

export const CreateMusicView: React.FC = () => {
  const {
    playSong,
    refreshLibrary,
    songs,
    setActiveTab,
    credits,
    openCreditsModal,
    refreshCredits,
    openStudioModal,
    prefillGenre,
    prefillPrompt,
    setPrefillStudio,
  } = useMusic();

  // Mode: Club Producer Studio vs Compact
  const [creationMode, setCreationMode] = useState<'simple' | 'custom'>('custom');

  // Core Form State
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [genre, setGenre] = useState<Genre>('Deep House');
  const [bpm, setBpm] = useState<number>(124);
  const [camelotKey, setCamelotKey] = useState<CamelotKey>('9A (E Minor)');
  const [mood, setMood] = useState<Mood>('Euphoric');
  const [vocalMode, setVocalMode] = useState<VocalMode>('female');
  const [vocalLanguages, setVocalLanguages] = useState<string[]>(['Spanish', 'English']);
  const [vocalStyle, setVocalStyle] = useState<string>('Hypnotic Club Hook');
  const [isInstrumental, setIsInstrumental] = useState(false);

  // DJ Intro / Outro & Arrangement State
  const [djIntroStyle, setDjIntroStyle] = useState<DJIntroStyle>('16-bar-percussive');
  const [djOutroStyle, setDjOutroStyle] = useState<DJOutroStyle>('16-bar-dj-loop');
  const [mixType, setMixType] = useState<'Extended DJ Mix' | 'Original Club Mix' | 'VIP Dub Edit' | 'Radio Vocal Mix'>('Extended DJ Mix');
  const [arrangement, setArrangement] = useState<SongSection[]>(ARRANGEMENT_PRESETS[0].sections);

  const [provider, setProvider] = useState<MusicProvider>('lyria-3.5');
  const [generateDualVersions, setGenerateDualVersions] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    hasGeminiKey: boolean;
    hasReplicateKey: boolean;
    hasElevenlabsKey: boolean;
    lyriaFullModel: string;
    lyriaClipModel: string;
  }>({
    hasGeminiKey: true,
    hasReplicateKey: false,
    hasElevenlabsKey: false,
    lyriaFullModel: 'lyria-3-pro-preview',
    lyriaClipModel: 'lyria-3-clip-preview',
  });

  // Song extension
  const [isExtensionMode, setIsExtensionMode] = useState(false);
  const [extendFromSongId, setExtendFromSongId] = useState<string>('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    provider?: string;
    code?: string;
    isCreditIssue?: boolean;
  } | null>(null);
  const [lastGeneratedSongs, setLastGeneratedSongs] = useState<Song[]>([]);
  const [isLyricsAssistantOpen, setIsLyricsAssistantOpen] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setApiStatus({
          hasGeminiKey: Boolean(s.hasGeminiKey),
          hasReplicateKey: Boolean(s.hasReplicateKey),
          hasElevenlabsKey: Boolean(s.hasElevenlabsKey),
          lyriaFullModel: String(s.lyriaFullModel || 'lyria-3-pro-preview'),
          lyriaClipModel: String(s.lyriaClipModel || 'lyria-3-clip-preview'),
        });
      })
      .catch(() => {});
  }, []);

  // Apply prefill from HomeView if present
  useEffect(() => {
    if (prefillGenre) {
      setGenre(prefillGenre);
      const found = GENRES.find((g) => g.name === prefillGenre);
      if (found) {
        setBpm(found.defaultBpm);
        setCamelotKey(found.defaultKey);
      }
    }
    if (prefillPrompt) {
      setPrompt(prefillPrompt);
    }
    if (prefillGenre || prefillPrompt) {
      setPrefillStudio(undefined, undefined);
    }
  }, [prefillGenre, prefillPrompt, setPrefillStudio]);

  const PROMPT_INSPIRATIONS = [
    {
      label: 'Afro House Sunset (122 BPM • 8A)',
      genre: 'Afro House' as Genre,
      bpm: 122,
      key: '8A (A Minor)' as CamelotKey,
      langs: ['Yoruba / Swahili (Afro Chant)', 'Spanish'],
      text: 'Hypnotic Afro House club journey with polyrhythmic djembe & shakers, warm log-drum sub bass, marimba chords and spiritual Yoruba & Spanish vocal chants, 32-bar DJ intro',
    },
    {
      label: 'Deep House Velvet (124 BPM • 9A)',
      genre: 'Deep House' as Genre,
      bpm: 124,
      key: '9A (E Minor)' as CamelotKey,
      langs: ['English', 'French'],
      text: 'Late-night Deep House groover with lush minor-9th Rhodes chords, sidechained sub-bass, crisp 909 hats and bilingual English & French soulful vocals',
    },
    {
      label: 'Latin House Montuno (126 BPM • 7A)',
      genre: 'Latin House' as Genre,
      bpm: 126,
      key: '7A (D Minor)' as CamelotKey,
      langs: ['Spanish', 'Portuguese'],
      text: 'Peak-time Ibiza Latin House weapon with syncopated piano montuno riffs, live timbales, brass stabs, rolling tech-latin bassline and fiery Spanish/Portuguese hooks',
    },
    {
      label: 'Tech House Warehouse (128 BPM • 4A)',
      genre: 'Tech House' as Genre,
      bpm: 128,
      key: '4A (F Minor)' as CamelotKey,
      langs: ['Spanish', 'English'],
      text: 'Driving warehouse Tech House roller with punchy transient kick, sub-bass groove, laser synth stabs, crisp 909 open hi-hats and hypnotic Spanish/English vocal chops',
    },
  ];

  const toggleLanguage = (lang: string) => {
    setVocalLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.length > 1 ? prev.filter((l) => l !== lang) : prev;
      }
      return [...prev, lang];
    });
  };

  const handleUpdateSectionBars = (id: string, bars: 8 | 16 | 32) => {
    setArrangement((prev) => prev.map((s) => (s.id === id ? { ...s, bars } : s)));
  };

  const handleUpdateSectionEnergy = (id: string, energy: number) => {
    setArrangement((prev) => prev.map((s) => (s.id === id ? { ...s, energy } : s)));
  };

  const handleAddSection = () => {
    setArrangement((prev) => [
      ...prev.slice(0, Math.max(1, prev.length - 1)),
      {
        id: `sec-${Date.now()}`,
        type: 'second_drop',
        label: 'Extra VIP Drop / Bridge',
        bars: 16,
        energy: 92,
        description: 'Extra club climax sectie',
      },
      ...prev.slice(Math.max(1, prev.length - 1)),
    ]);
  };

  const handleRemoveSection = (id: string) => {
    if (arrangement.length <= 3) return;
    setArrangement((prev) => prev.filter((s) => s.id !== id));
  };

  const totalBars = arrangement.reduce((acc, s) => acc + s.bars, 0);

  // AI Prompt Enhancer (Costs 1 credit)
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() && !genre) return;

    if (credits < 1) {
      openCreditsModal();
      setErrorDetails({
        message: 'Je hebt minimaal 1 credit nodig voor de AI Prompt Enhancer. Claim je dagelijkse bonus of waardeer op.',
        isCreditIssue: true,
      });
      return;
    }

    setIsEnhancingPrompt(true);
    try {
      const res = await api.enhancePrompt({
        prompt:
          prompt ||
          `${genre} club track at ${bpm} BPM in key ${camelotKey} with ${djIntroStyle} DJ intro and ${vocalLanguages.join(' + ')} vocals`,
        genre,
        mood,
        isInstrumental,
      });
      setPrompt(res.enhancedPrompt);
      if (!title && res.suggestedTitle) {
        setTitle(res.suggestedTitle);
      }
      await refreshCredits();
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      if (e.code === 'INSUFFICIENT_CREDITS') {
        openCreditsModal();
      }
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Generate Music (Costs 10 credits for dual mix, 5 for single mix)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !lyrics.trim() && !title.trim()) {
      setErrorDetails({ message: 'Voer een club-beschrijving, songtekst of titel in om een track te produceren.' });
      return;
    }

    const creditCost = generateDualVersions ? 10 : 5;
    if (credits < creditCost) {
      openCreditsModal();
      setErrorDetails({
        message: `Onvoldoende credits: voor deze productie heb je ${creditCost} credits nodig (huidig saldo: ${credits}). Waardeer je credits op of claim de dagelijkse bonus (+25 gratis).`,
        isCreditIssue: true,
      });
      return;
    }

    setErrorDetails(null);
    setIsGenerating(true);
    // Clear stale React state immediately so previous generated tracks are not shown
    setLastGeneratedSongs([]);

    // Snapshot existing generationIds, songIds, and audioUrls to detect any stale/duplicate response
    const existingGenerationIds = new Set(songs.map((s) => s.generationId).filter(Boolean));
    const existingSongIds = new Set(songs.map((s) => s.id));
    const existingAudioUrls = new Set(songs.map((s) => s.audioUrl).filter(Boolean));

    const requestId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `req-${crypto.randomUUID()}`
        : `req-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const randomSeed = Math.floor(Math.random() * 899999999) + 100000000;

    const steps = [
      `[${requestId.slice(0, 12)}] Locking ${bpm} BPM clock, Key ${camelotKey} & Seed ${randomSeed}...`,
      `Synthesizing ${genre} kick/sub phase & polyrhythmic percussion stems...`,
      isInstrumental
        ? 'Arranging analog leads, chords & filter automation across sections...'
        : `Rendering ${vocalLanguages.join(' + ')} (${vocalStyle}) vocal stems...`,
      `Mastering 44.1 kHz ${mixType} & verifying unique audio fingerprint...`,
    ];

    let currentStepIdx = 0;
    setGenerationStep(steps[0]);
    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setGenerationStep(steps[currentStepIdx]);
      }
    }, 1100);

    try {
      const songTitle =
        title.trim() ||
        (prompt ? `${prompt.slice(0, 24)} (${mixType})` : `${genre} ${camelotKey} Club Mix`);

      const res = await api.generateMusic({
        requestId,
        seed: randomSeed,
        title: songTitle,
        prompt: prompt.trim(),
        lyrics: isInstrumental ? '' : lyrics.trim(),
        genre,
        bpm,
        mood,
        vocalMode: isInstrumental ? 'instrumental' : vocalMode,
        language: vocalLanguages.join(' + '),
        vocalLanguages: isInstrumental ? [] : vocalLanguages,
        vocalStyle: isInstrumental ? 'Instrumental Club Dub' : vocalStyle,
        camelotKey,
        djIntroStyle,
        djOutroStyle,
        arrangement,
        mixType,
        isInstrumental,
        provider,
        generateDualVersions,
        extendedFromId: isExtensionMode ? extendFromSongId : undefined,
      });

      clearInterval(interval);
      setGenerationStep('Verifying unique generation ID & audio stream...');

      if (!Array.isArray(res.songs) || res.songs.length === 0) {
        throw new Error(
          'Ongeldige API-respons: Er zijn geen nieuwe tracks teruggegeven door de generatie-service.'
        );
      }

      // Strictly verify every returned song has a brand-new generationId, songId, and audioUrl
      const batchGenIds = new Set<string>();
      for (const s of res.songs) {
        if (!s.generationId || !s.id || !s.audioUrl) {
          throw new Error(
            `Generatie Validatiefout: API gaf een onvolledige track terug (generationId=${s.generationId || 'missing'}, audioUrl=${s.audioUrl || 'missing'}).`
          );
        }
        if (
          existingGenerationIds.has(s.generationId) ||
          existingSongIds.has(s.id) ||
          existingAudioUrls.has(s.audioUrl) ||
          batchGenIds.has(s.generationId)
        ) {
          throw new Error(
            `Generatie Validatiefout: De API gaf een reeds bestaand generatie-ID (${s.generationId}) of bestaande audio-URL terug. Afspelen van oude audio is geblokkeerd.`
          );
        }
        batchGenIds.add(s.generationId);
      }

      const enriched = res.songs.map((song, i) => ({
        ...song,
        coverArtUrl: generateCoverArt(
          song.title,
          song.genre,
          song.mood,
          (song.seed || randomSeed) + i
        ),
      }));

      await Promise.all(enriched.map((s) => api.saveSong(s)));
      await refreshLibrary();
      await refreshCredits();

      setLastGeneratedSongs(enriched);

      // Immediately load and play the newly generated track in the player
      await playSong(enriched[0], enriched);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#A855F7', '#EC4899', '#10B981', '#F59E0B'],
      });
    } catch (err: unknown) {
      clearInterval(interval);
      const e = err as Error & { code?: string; provider?: string };
      setErrorDetails({
        message: e.message || 'Music generation failed. Check your configuration.',
        provider: e.provider,
        code: e.code,
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      {/* Top Studio Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Electronic & Club Producer Studio
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              CDJ / 4-Stem Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Produceer Deep, Afro, Latin & Tech House met 16/32-bar DJ-intro’s, meertalige zang, exacte BPM/Camelot-regie en bewerk elk nummer achteraf.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#141022] p-1 rounded-xl border border-purple-500/25 shrink-0">
          <button
            type="button"
            onClick={() => setCreationMode('simple')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              creationMode === 'simple'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Club Mode
          </button>
          <button
            type="button"
            onClick={() => setCreationMode('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              creationMode === 'custom'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Full Producer & DJ Regie</span>
          </button>
        </div>
      </div>

      {/* Newly Generated Songs Showcase */}
      {lastGeneratedSongs.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-[#120E24] to-purple-950/30 border border-emerald-500/35 space-y-4 animate-fade-in shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>
                  {lastGeneratedSongs[0]?.provider === 'internal-synth'
                    ? `Demo DSP Synthesizer Render Gereed (${lastGeneratedSongs.length} Track${lastGeneratedSongs.length > 1 ? 's' : ''})`
                    : `AI Music Generation Gereed via ${lastGeneratedSongs[0]?.provider} (${lastGeneratedSongs.length} Track${lastGeneratedSongs.length > 1 ? 's' : ''})`}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {lastGeneratedSongs[0]?.provider === 'internal-synth'
                  ? 'Gegenereerd met de optionele interne procedurele demo-synthesizer (geen neurale AI-compositie). Elke render heeft een uniek Generation ID & Seed.'
                  : 'Echte AI-audiostream ontvangen van de geconfigureerde AI-provider met uniek Generation ID, Seed en geverifieerde Audio Fingerprint.'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('library')}
              className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-bold shrink-0 cursor-pointer"
            >
              <span>Open in Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lastGeneratedSongs.map((song) => (
              <div
                key={`${song.id}-${song.generationId}`}
                className="glass-panel-glow p-4 rounded-xl flex flex-col justify-between gap-3 border border-purple-500/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.coverArtUrl}
                      alt={song.title}
                      className="w-16 h-16 rounded-xl object-cover border border-purple-500/30 shadow-md shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">{song.title}</h3>
                        {song.version && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                            Mix {song.version}
                          </span>
                        )}
                        {song.camelotKey && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {song.camelotKey}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">
                        {song.genre} • <span className="font-mono">{song.bpm} BPM</span> • {song.mixType || 'Extended DJ Mix'}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-mono mt-1 inline-block">
                        ✓ {song.djIntroStyle || '16-bar-percussive'} → {song.djOutroStyle || '16-bar-dj-loop'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => playSong(song, lastGeneratedSongs)}
                    className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0 transition-transform cursor-pointer"
                    title="Afspelen"
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </button>
                </div>

                {/* Generation Verification Metadata Row */}
                <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 border border-emerald-500/20 text-[10px] font-mono text-slate-300">
                  <span className="text-emerald-400 font-bold">
                    GenID: {(song.generationId || song.id).slice(0, 16)}
                  </span>
                  <span>•</span>
                  <span className="text-purple-300">Seed: {song.seed}</span>
                  {song.audioFingerprint && (
                    <>
                      <span>•</span>
                      <span className="text-cyan-300">Audio: {song.audioFingerprint}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-900/30">
                  <span className="text-[11px] text-slate-400 truncate">
                    {song.vocalLanguages && song.vocalLanguages.length > 0
                      ? `🌐 Zang: ${song.vocalLanguages.join(' + ')}`
                      : '🎛️ Instrumental Club Track'}
                  </span>
                  <button
                    type="button"
                    onClick={() => openStudioModal(song)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Verder Bewerken in Track Studio</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Producer Creation Form */}
      <form onSubmit={handleGenerate} className="glass-panel rounded-2xl p-5 sm:p-6 md:p-8 space-y-7">
        {/* Section 1: Specialistische Electronic & House Genres */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Disc className="w-4 h-4 text-purple-400" />
              <span>1. Kies Electronic / House Engine ({genre})</span>
            </label>
            <span className="text-[11px] text-emerald-400 font-mono">
              Selectie stelt automatisch optimale Club BPM & Camelot Key in
            </span>
          </div>

          {/* Primary 6 Club Engines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {GENRES.filter((g) => g.isFlagshipClub).map((g) => {
              const isSelected = genre === g.name;
              return (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => {
                    setGenre(g.name);
                    setBpm(g.defaultBpm);
                    setCamelotKey(g.defaultKey);
                  }}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-purple-900/50 via-[#191230] to-emerald-950/30 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-white'
                      : 'bg-[#0E0C18] border-purple-500/20 text-slate-300 hover:border-purple-500/45'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.icon}</span>
                      <span className="text-xs sm:text-sm font-extrabold text-white">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        {g.defaultKey}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                        {g.defaultBpm} BPM
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{g.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Secondary / Crossover Electronic Genres */}
          <div className="pt-1">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">
              Overige Elektronische & Crossover Genres:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {GENRES.filter((g) => !g.isFlagshipClub).map((g) => {
                const isSelected = genre === g.name;
                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => {
                      setGenre(g.name);
                      setBpm(g.defaultBpm);
                      setCamelotKey(g.defaultKey);
                    }}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-900/40 border-purple-400 text-white'
                        : 'bg-[#0E0C18] border-purple-500/15 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{g.icon}</span>
                      <span className="text-[9px] font-mono text-purple-300">{g.defaultBpm}</span>
                    </div>
                    <div className="text-[11px] font-bold truncate mt-0.5">{g.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Track Prompt & Club Templates */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>2. Sound Design, Groove & Instrumentatie Prompt</span>
            </label>
            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={isEnhancingPrompt}
              className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-900/30 border border-purple-500/20 hover:bg-purple-900/50 transition-colors cursor-pointer"
            >
              <Wand2 className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
              <span>{isEnhancingPrompt ? 'Verrijken...' : 'Verrijk tot Pro Club Prompt'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono border border-purple-500/30">
                1 CR
              </span>
            </button>
          </div>

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschrijf je baslijn, percussie, synths en sfeer: bijv. Hypnotische Afro House met diepe log-drum sub, conga & shaker polyritmes, warme Rhodes akkoorden en meertalige Spaanse & Yoruba vocal chants..."
            className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none transition-colors"
          />

          {/* Quick Club Templates */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">Club Presets:</span>
            {PROMPT_INSPIRATIONS.map((insp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setGenre(insp.genre);
                  setBpm(insp.bpm);
                  setCamelotKey(insp.key);
                  setVocalLanguages(insp.langs);
                  setPrompt(insp.text);
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/25 text-purple-200 hover:text-white shrink-0 transition-colors text-[11px] font-medium cursor-pointer"
              >
                {insp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Title, Mix Edition & Vocal vs Club Dub */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Track Titel (Optioneel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Savanna Mirage (Extended Club Mix)"
              className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Club Mix Editie
            </label>
            <select
              value={mixType}
              onChange={(e) => setMixType(e.target.value as typeof mixType)}
              className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
            >
              <option value="Extended DJ Mix">Extended DJ Mix (16/32-Bar Intro & Outro)</option>
              <option value="Original Club Mix">Original Club Mix (Volledige Club Arrangement)</option>
              <option value="VIP Dub Edit">VIP Dub Edit (Focus op Sub, Groove & Peak Drop)</option>
              <option value="Radio Vocal Mix">Radio Vocal Mix (Compacte Vocal Edit)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Vocal / Dub Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-[#0E0C18] p-1 rounded-xl border border-purple-500/25">
              <button
                type="button"
                onClick={() => setIsInstrumental(false)}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  !isInstrumental
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Vocal Mix</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInstrumental(true)}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isInstrumental
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Disc className="w-3.5 h-3.5" />
                <span>Club Dub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Exact BPM, Camelot Key & Mood */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 rounded-2xl bg-[#0E0C18] border border-purple-500/25">
          {/* Exact BPM Control */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Exacte Club BPM:</span>
                <span className="text-emerald-400 font-mono text-sm">{bpm} BPM</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBpm((b) => Math.max(60, b - 1))}
                  className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-200 hover:text-white cursor-pointer"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => setBpm((b) => Math.min(180, b + 1))}
                  className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-200 hover:text-white cursor-pointer"
                >
                  +1
                </button>
              </div>
            </div>

            <input
              type="range"
              min={90}
              max={150}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {[
                { label: 'Afro 120', val: 120 },
                { label: 'Afro 122', val: 122 },
                { label: 'Deep 124', val: 124 },
                { label: 'Latin 126', val: 126 },
                { label: 'Tech 128', val: 128 },
                { label: 'Peak 130', val: 130 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setBpm(p.val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                    bpm === p.val
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-purple-950/30 text-slate-400 border-purple-500/20 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Harmonic Camelot Key */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
              Harmonische Toonsoort (Camelot)
            </label>
            <select
              value={camelotKey}
              onChange={(e) => setCamelotKey(e.target.value as CamelotKey)}
              className="w-full bg-[#151126] border border-emerald-500/35 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
            >
              {CAMELOT_KEYS.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Zorgt voor harmonische compatibiliteit bij het mixen in Rekordbox, Serato of Traktor.
            </p>
          </div>

          {/* Mood & Club Atmosphere */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider block">
              Club Sfeer ({mood})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    mood === m
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow'
                      : 'bg-purple-950/20 border-purple-500/20 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Uitgebreide DJ-Intro's, Outro's & Songstructuur (Shown in Custom Producer Mode) */}
        {creationMode === 'custom' && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#120F24] to-[#0B0915] border border-emerald-500/25 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>3. Uitgebreide DJ-Intro’s, Outro’s & Songstructuur ({totalBars} Bars Totaal)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  De audio-engine houdt tijdens de DJ-Intro en DJ-Outro de melodische synths weg voor strakke beatmatching op CDJ’s.
                </p>
              </div>

              {/* Arrangement Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {ARRANGEMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setArrangement(preset.sections)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {preset.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* DJ Intro & DJ Outro Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  DJ Mix-In Intro Stijl
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DJ_INTRO_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDjIntroStyle(opt.id);
                        setArrangement((prev) =>
                          prev.map((s, idx) =>
                            idx === 0 ? { ...s, bars: opt.bars, label: opt.label } : s
                          )
                        );
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        djIntroStyle === opt.id
                          ? 'bg-emerald-950/40 border-emerald-400 text-white shadow'
                          : 'bg-black/40 border-purple-500/20 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  DJ Mix-Out Outro Stijl
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DJ_OUTRO_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDjOutroStyle(opt.id);
                        setArrangement((prev) =>
                          prev.map((s, idx) =>
                            idx === prev.length - 1 ? { ...s, bars: opt.bars, label: opt.label } : s
                          )
                        );
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        djOutroStyle === opt.id
                          ? 'bg-purple-950/50 border-purple-400 text-white shadow'
                          : 'bg-black/40 border-purple-500/20 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-purple-300">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Song Structure / Arrangement Blocks */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                  Interactieve Songstructuur & Energie-Curve (Pas 8 / 16 / 32 maten per sectie aan):
                </span>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sectie Toevoegen</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {arrangement.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-3 rounded-xl bg-black/50 border border-purple-500/25 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-purple-400 font-bold">
                          #{idx + 1}
                        </span>
                        {arrangement.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sec.id)}
                            className="text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Verwijder sectie"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5">{sec.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{sec.description}</div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      {/* Bar Length Selector */}
                      <div className="grid grid-cols-3 gap-1">
                        {([8, 16, 32] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => handleUpdateSectionBars(sec.id, b)}
                            className={`py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                              sec.bars === b
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {b}B
                          </button>
                        ))}
                      </div>

                      {/* Energy Slider */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-400">E:{sec.energy}%</span>
                        <input
                          type="range"
                          min={25}
                          max={100}
                          value={sec.energy}
                          onChange={(e) => handleUpdateSectionEnergy(sec.id, parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 h-1 bg-slate-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Meertalige Zang, Club Chants & Lyrics */}
        {!isInstrumental && (
          <div className="p-5 rounded-2xl bg-purple-950/15 border border-purple-500/25 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-pink-400" />
                  <span>4. Meertalige Zang, Afro/Latin Chants & Lyrics</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Combineer meerdere talen in één clubtrack (bijv. Spaans + Engels of Yoruba/Swahili Afro-chants + Frans).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLyricsAssistantOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/30 hover:opacity-95 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Lyrics & Chant Schrijver</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 text-purple-200 font-mono">
                  2 CR
                </span>
              </button>
            </div>

            {/* Multi-select Languages */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-pink-300">
                Selecteer 1 of meerdere talen ({vocalLanguages.join(' + ')}):
              </span>
              <div className="flex flex-wrap gap-2">
                {VOCAL_LANGUAGES.map((lang) => {
                  const active = vocalLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? 'bg-pink-600/30 border-pink-400 text-white shadow'
                          : 'bg-[#0E0C18] border-purple-500/20 text-slate-400 hover:text-white'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vocal Mode & Vocal Delivery Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-purple-300 mb-1">
                  Stemtype (Vocal Perspective)
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-[#0E0C18] p-1 rounded-xl border border-purple-500/25">
                  {(['female', 'male', 'duet'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setVocalMode(mode)}
                      className={`py-1.5 rounded-lg text-xs capitalize font-bold transition-all cursor-pointer ${
                        vocalMode === mode
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'duet' ? 'Duet / Call-Response' : mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-purple-300 mb-1">
                  Vocal Delivery & Club Stijl
                </span>
                <select
                  value={vocalStyle}
                  onChange={(e) => setVocalStyle(e.target.value)}
                  className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
                >
                  {VOCAL_STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lyrics Textarea */}
            <textarea
              rows={4}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={`[DJ Intro - 16 Bars Percussive]\n(Instrumental 4/4 kick & shakers)\n\n[Breakdown - ${vocalLanguages.join(' & ')}]\nSiente el tambor en la madrugada...\nFeel the sub bass rising through the night...\n\n[Main Drop - Club Hook]\nBaila conmigo en la oscuridad!`}
              className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Section 7: AI Engine & Dual A/B Mix Variations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-purple-400" /> Primaire AI Music Engine
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="text-[11px] text-purple-400 hover:underline cursor-pointer"
              >
                API Sleutels Configureren
              </button>
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as MusicProvider)}
              className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-medium"
            >
              <option value="lyria-3.5">
                🔥 Google Lyria 3.5 / Lyria 3 Pro (`lyria-3-pro-preview`) — Volledige AI Song Generatie (Standaard)
              </option>
              <option value="lyria-3-clip-preview">
                ✨ Google Lyria 3 Clip (`lyria-3-clip-preview`) — 30-Seconden AI Preview Clip
              </option>
              <option value="replicate-musicgen">
                🧠 Meta MusicGen Stereo Large (Externe AI via Replicate API)
              </option>
              <option value="elevenlabs">
                🎙️ ElevenLabs Audio Engine (Externe AI via ElevenLabs API)
              </option>
              <option value="internal-synth">
                🎛️ Optionele Interne Demo DSP Synthesizer (Procedurele Browser/Server Oscillator — Geen AI)
              </option>
            </select>

            {/* Active Engine & API Configuration Validity Banner */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-[11px] space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-300 font-semibold">
                  Actieve Engine:{' '}
                  <strong className="text-purple-300 font-mono">
                    {provider === 'lyria-3.5' || provider === 'lyria-3-pro-preview'
                      ? `Google Lyria 3.5 (${apiStatus.lyriaFullModel})`
                      : provider === 'lyria-3-clip-preview'
                        ? `Google Lyria 3 Clip (${apiStatus.lyriaClipModel})`
                        : provider === 'internal-synth'
                          ? 'Internal Procedural Demo Synth (Non-AI)'
                          : provider}
                  </strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    (provider.startsWith('lyria') && apiStatus.hasGeminiKey) ||
                    (provider === 'replicate-musicgen' && apiStatus.hasReplicateKey) ||
                    (provider === 'elevenlabs' && apiStatus.hasElevenlabsKey) ||
                    provider === 'internal-synth'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {provider.startsWith('lyria')
                    ? apiStatus.hasGeminiKey
                      ? 'Gemini API Key Geconfigureerd (Vereist Betaalde Tier voor Lyria)'
                      : 'Geen Gemini API Key'
                    : provider === 'replicate-musicgen'
                      ? apiStatus.hasReplicateKey
                        ? 'Replicate Key Actief'
                        : 'Replicate Key Ontbreekt'
                      : provider === 'elevenlabs'
                        ? apiStatus.hasElevenlabsKey
                          ? 'ElevenLabs Key Actief'
                          : 'ElevenLabs Key Ontbreekt'
                        : 'Lokale Demo Oscillator (Geen AI)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {provider === 'internal-synth'
                  ? 'Let op: De interne DSP-synthesizer gebruikt wiskundige sinus/zaagtand-oscillatoren voor snelle demo-testen en genereert géén echte AI-muziek of echte zang.'
                  : 'Opmerking: Exacte BPM, Camelot-toonsoort en 16/32-bar DJ-arrangementen worden als prompt-instructies meegegeven aan het neurale audiomodel, maar zijn niet strikt gegarandeerd. Bij een API- of quotafout wordt nooit stilzwijgend teruggevallen op de demo-synthesizer.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E0C18] border border-purple-500/20">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Render 2 Club Mix Variaties (Mix A & VIP Dub B)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono border border-purple-500/30">
                      {generateDualVersions ? '10 Credits' : '5 Credits'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {generateDualVersions
                      ? 'Levert zowel de Extended Vocal/Club Mix (A) als een alternatieve Dub/Bassline versie (B)'
                      : 'Genereert 1 enkele studio master (5 CR)'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={generateDualVersions}
                onChange={(e) => setGenerateDualVersions(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Extension Mode Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExtensionMode(!isExtensionMode)}
            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {isExtensionMode
                ? 'Sluit Track Extensie'
                : '+ Bestaand nummer uit je Library verlengen of vervolgen'}
            </span>
          </button>

          {isExtensionMode && (
            <div className="mt-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
              <span className="block text-xs font-semibold text-white mb-1.5">
                Kies een bron-track om op voort te bouwen:
              </span>
              <select
                value={extendFromSongId}
                onChange={(e) => setExtendFromSongId(e.target.value)}
                className="w-full bg-[#0E0C18] border border-purple-500/30 rounded-lg p-2 text-xs text-white"
              >
                <option value="">Selecteer een track...</option>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.genre} • {s.bpm} BPM • {s.camelotKey || '8A'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorDetails && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-100 leading-relaxed">{errorDetails.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(errorDetails.code === 'LYRIA_QUOTA_OR_BILLING_REQUIRED' ||
                errorDetails.code === 'AI_PROVIDER_ERROR' ||
                errorDetails.code === 'CONFIG_REQUIRED') &&
                provider !== 'internal-synth' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProvider('internal-synth');
                      setErrorDetails(null);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Kies Interne Demo DSP Synthesizer</span>
                  </button>
                )}
              {errorDetails.isCreditIssue && (
                <button
                  type="button"
                  onClick={openCreditsModal}
                  className="px-3.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-yellow-500/20 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Waardeer Credits Op</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submit Button & Credit Indicator */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:via-violet-500 hover:to-pink-500 text-white font-extrabold text-base shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                <span>Rendering Club Master: {generationStep}</span>
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                <span>
                  Produceer {genre} Track ({bpm} BPM • {camelotKey} • {generateDualVersions ? '10 Credits' : '5 Credits'})
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between px-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              Studio Saldo: <strong className="text-white font-mono">{credits} Credits</strong>
            </span>
            <button
              type="button"
              onClick={openCreditsModal}
              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 cursor-pointer"
            >
              + Credits Opwaarderen of Dagelijkse Bonus Claimen
            </button>
          </div>
        </div>
      </form>

      {/* Lyrics Assistant Modal */}
      <LyricsAssistantModal
        isOpen={isLyricsAssistantOpen}
        onClose={() => setIsLyricsAssistantOpen(false)}
        initialGenre={genre}
        initialMood={mood}
        onInsertLyrics={(newLyrics, suggestedTitle) => {
          setLyrics(newLyrics);
          if (suggestedTitle && !title) {
            setTitle(suggestedTitle);
          }
        }}
      />
    </div>
  );
};
