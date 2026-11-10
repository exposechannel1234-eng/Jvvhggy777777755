import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

// Disable caching on all API routes so browsers/proxies never reuse stale responses or audio
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Initialize Gemini Client safely so server boot never fails if key is empty
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'unconfigured',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Server-side persistent storage types
interface StoredSong {
  id: string;
  generationId: string;
  requestId: string;
  seed: number;
  audioFingerprint: string;
  generationStatus: 'queued' | 'processing' | 'succeeded' | 'failed';
  title: string;
  prompt: string;
  lyrics?: string;
  genre: string;
  bpm: number;
  mood: string;
  vocalMode: string;
  language: string;
  vocalLanguages?: string[];
  vocalStyle?: string;
  isInstrumental: boolean;
  duration: number;
  audioUrl: string;
  externalAudioDataUrl?: string;
  coverArtUrl: string;
  createdAt: string;
  version?: 'A' | 'B';
  provider: string;
  isFavorite?: boolean;
  playlistIds?: string[];
  extendedFromId?: string;
  camelotKey?: string;
  djIntroStyle?: string;
  djOutroStyle?: string;
  arrangement?: unknown[];
  stemMix?: Record<string, number>;
  mixType?: string;
}

interface StoredPlaylist {
  id: string;
  name: string;
  description: string;
  coverArtUrl?: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface StoredCreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  balanceAfter: number;
}

interface GenerationJobRecord {
  jobId: string;
  requestId: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  createdAt: string;
  updatedAt: string;
  songs: StoredSong[];
  error?: string;
}

interface ServerSettings {
  replicateApiKey?: string;
  elevenlabsApiKey?: string;
  sunoApiKey?: string;
  customApiUrl?: string;
  customApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  defaultProvider: string;
  audioQuality: string;
}

let serverSettings: ServerSettings = {
  replicateApiKey: process.env.REPLICATE_API_KEY || '',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  sunoApiKey: process.env.SUNO_API_KEY || '',
  customApiUrl: '',
  customApiKey: '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  defaultProvider: 'lyria-3.5',
  audioQuality: 'high',
};

// In-memory cache of rendered WAV buffers keyed by `${song.id}:${song.generationId}`
const audioBuffersMap = new Map<string, Buffer>();
// Track all processed requestIds and generationIds to guarantee uniqueness
const processedRequestIds = new Set<string>();
const issuedGenerationIds = new Set<string>();
const generationJobs = new Map<string, GenerationJobRecord>();

// Seed Songs showcasing Professional Electronic & Club Music
const INITIAL_SEED_SONGS: StoredSong[] = [
  {
    id: 'seed-afro-1',
    generationId: 'gen-seed-afro-101',
    requestId: 'req-seed-101',
    seed: 101849321,
    audioFingerprint: 'fp-seed-afro-101',
    generationStatus: 'succeeded',
    title: 'Kinshasa Sunset Groove (Extended DJ Mix)',
    prompt:
      'Afro House 122 BPM (9A Em) with 16-bar beatmatched DJ intro, hypnotic syncopated djembe polyrhythms, warm analogue Rhodes chords, and multilingual Yoruba/English vocal chants.',
    lyrics: `[16-Bar DJ Percussive Intro]\n(Syncopated shakers, djembe & rolling sub pulse)\n\n[Verse 1 - English & Yoruba]\nGolden dust across the street\nOya bale, feel the rising heat\nEvery drumbeat guides our feet\nWhere the river and ocean meet.\n\n[Main Drop & Afro Chant]\nOya oya, ile aye! (Dance till the morning light)\nFeel the spirit take flight\nIn our groove, everything's right!\n\n[16-Bar DJ Mix-Out Loop]\n(Clean tribal percussion & kick beatgrid)`,
    genre: 'Afro House',
    bpm: 122,
    mood: 'Euphoric',
    vocalMode: 'female',
    language: 'Yoruba & English',
    vocalLanguages: ['Yoruba / Swahili (Afro Chant)', 'English'],
    vocalStyle: 'Afro Tribal Chant & Call-Response',
    isInstrumental: false,
    duration: 28,
    audioUrl: '/api/music/stream/seed-afro-1?genId=gen-seed-afro-101&seed=101849321',
    coverArtUrl: '',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    version: 'A',
    provider: 'internal-synth',
    isFavorite: true,
    playlistIds: ['playlist-top-picks'],
    camelotKey: '9A (E Minor)',
    djIntroStyle: '16-bar-percussive',
    djOutroStyle: '16-bar-dj-loop',
    mixType: 'Extended DJ Mix',
    stemMix: { kickSub: 90, percussion: 95, synthsChords: 82, vocalsChants: 88, sidechainPump: 80, filterCutoff: 85 },
  },
  {
    id: 'seed-deep-2',
    generationId: 'gen-seed-deep-202',
    requestId: 'req-seed-202',
    seed: 202958412,
    audioFingerprint: 'fp-seed-deep-202',
    generationStatus: 'succeeded',
    title: 'Midnight Velvet (Club Dub Mix)',
    prompt:
      'Deep House 124 BPM (7A Dm) with 32-bar DJ club intro, lush minor 7th analog chords, deep rolling sub bassline, crisp 909 hats, and hypnotic French/English vocal whispers.',
    lyrics: `[32-Bar DJ Club Intro]\n(Tight 4/4 kick & sub-bass lock)\n\n[Breakdown - French & English]\nDans la nuit, sous les étoiles\nVelvet shadows on the floor\nClose your eyes and feel the bassline\nWe don't need nothing more.\n\n[Main Deep Drop]\n(Lush Dm7 chord stabs + sidechained sub groove)\n\n[16-Bar DJ Outro]\n(Stripped 909 hats & kick)`,
    genre: 'Deep House',
    bpm: 124,
    mood: 'Chill',
    vocalMode: 'female',
    language: 'French & English',
    vocalLanguages: ['French', 'English'],
    vocalStyle: 'Soulful Deep House Diva',
    isInstrumental: false,
    duration: 28,
    audioUrl: '/api/music/stream/seed-deep-2?genId=gen-seed-deep-202&seed=202958412',
    coverArtUrl: '',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    version: 'A',
    provider: 'internal-synth',
    isFavorite: true,
    playlistIds: ['playlist-top-picks'],
    camelotKey: '7A (D Minor)',
    djIntroStyle: '32-bar-club-grid',
    djOutroStyle: '16-bar-dj-loop',
    mixType: 'Extended DJ Mix',
    stemMix: { kickSub: 88, percussion: 80, synthsChords: 94, vocalsChants: 75, sidechainPump: 85, filterCutoff: 78 },
  },
  {
    id: 'seed-tech-3',
    generationId: 'gen-seed-tech-303',
    requestId: 'req-seed-303',
    seed: 303741956,
    audioFingerprint: 'fp-seed-tech-303',
    generationStatus: 'succeeded',
    title: 'La Máquina System (Peak-Time Tech)',
    prompt:
      'Tech House 126 BPM (4A Fm), punchy warehouse four-on-the-floor kick, rolling sub bass, Spanish & English robotic vocal chop hook, and tight snare build-ups.',
    lyrics: `[16-Bar DJ Beatgrid Intro]\n\n[Pre-Drop Vocal Hook - Spanish & English]\nSube la frecuencia, mueve el club\nCheck the bassline — Drop the pressure now!\n\n[Peak-Time Drop]\nLa máquina! System overload!\nDale duro hasta el amanecer!\n\n[16-Bar DJ Mix-Out]`,
    genre: 'Tech House',
    bpm: 126,
    mood: 'Energetic',
    vocalMode: 'male',
    language: 'Spanish & English',
    vocalLanguages: ['Spanish', 'English'],
    vocalStyle: 'Tech House Spoken Word & Chop',
    isInstrumental: false,
    duration: 28,
    audioUrl: '/api/music/stream/seed-tech-3?genId=gen-seed-tech-303&seed=303741956',
    coverArtUrl: '',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    version: 'A',
    provider: 'internal-synth',
    isFavorite: false,
    playlistIds: [],
    camelotKey: '4A (F Minor)',
    djIntroStyle: '16-bar-percussive',
    djOutroStyle: '16-bar-dj-loop',
    mixType: 'Original Club Mix',
    stemMix: { kickSub: 96, percussion: 90, synthsChords: 76, vocalsChants: 85, sidechainPump: 92, filterCutoff: 90 },
  },
  {
    id: 'seed-latin-4',
    generationId: 'gen-seed-latin-404',
    requestId: 'req-seed-404',
    seed: 404619283,
    audioFingerprint: 'fp-seed-latin-404',
    generationStatus: 'succeeded',
    title: 'Ibiza Fuego (Extended Club Mix)',
    prompt:
      'Latin House 128 BPM (8A Am) with energetic montuno piano hooks, syncopated timbales, brass stabs, 16-bar DJ intro/outro, and passionate Spanish & Portuguese club vocals.',
    lyrics: `[16-Bar Latin Percussion DJ Intro]\n(Timbales, congas & 4/4 club kick)\n\n[Verso 1 - Español]\nBajo las luces de Ibiza\nBailando sin pensar en nada más\nEl ritmo sube sin parar\nEsta noche vamos a quemar.\n\n[Coro - Español & Português]\nFuego en la pista, fogo no ar!\nQue nadie se siente, vamos dançar!\n¡Sabor, pasión y libertad!\n\n[32-Bar Extended DJ Outro]`,
    genre: 'Latin House',
    bpm: 128,
    mood: 'Euphoric',
    vocalMode: 'duet',
    language: 'Spanish & Portuguese',
    vocalLanguages: ['Spanish', 'Portuguese'],
    vocalStyle: 'Latin Fiesta / Montuno Vocal',
    isInstrumental: false,
    duration: 28,
    audioUrl: '/api/music/stream/seed-latin-4?genId=gen-seed-latin-404&seed=404619283',
    coverArtUrl: '',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    version: 'A',
    provider: 'internal-synth',
    isFavorite: true,
    playlistIds: ['playlist-top-picks'],
    camelotKey: '8A (A Minor)',
    djIntroStyle: '16-bar-percussive',
    djOutroStyle: '32-bar-extended',
    mixType: 'Extended DJ Mix',
    stemMix: { kickSub: 90, percussion: 96, synthsChords: 88, vocalsChants: 92, sidechainPump: 84, filterCutoff: 92 },
  },
];

// Persistent JSON Database File
const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'soniq-db.json');

let songsStore: StoredSong[] = [...INITIAL_SEED_SONGS];
let playlistsStore: StoredPlaylist[] = [
  {
    id: 'playlist-top-picks',
    name: 'SONIQ Studio Masters',
    description: 'Featured high-energy club anthems and deep atmospheric creations generated with SONIQ AI.',
    songIds: ['seed-afro-1', 'seed-deep-2', 'seed-latin-4'],
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let userCredits = 450;
let userPlan = 'Pro Studio';
let lastDailyBonusClaimed: string | null = null;
let creditTransactions: StoredCreditTransaction[] = [
  {
    id: 'tx-init',
    amount: 450,
    type: 'purchase',
    description: 'Pro Studio Creator Allocation',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    balanceAfter: 450,
  },
];

function loadPersistentDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.songs) && parsed.songs.length > 0) {
        songsStore = parsed.songs.map((s: StoredSong, idx: number) => {
          const genId = s.generationId || `gen-restored-${s.id}-${idx}`;
          const seedVal = s.seed || (100000000 + idx * 9876543);
          issuedGenerationIds.add(genId);
          return {
            ...s,
            generationId: genId,
            requestId: s.requestId || `req-restored-${idx}`,
            seed: seedVal,
            audioFingerprint: s.audioFingerprint || `fp-restored-${s.id}`,
            generationStatus: s.generationStatus || 'succeeded',
            audioUrl:
              s.audioUrl && s.audioUrl.trim() !== ''
                ? s.audioUrl
                : `/api/music/stream/${encodeURIComponent(s.id)}?genId=${encodeURIComponent(genId)}&seed=${seedVal}`,
          };
        });
      }
      if (Array.isArray(parsed.playlists)) playlistsStore = parsed.playlists;
      if (typeof parsed.userCredits === 'number') userCredits = parsed.userCredits;
      if (Array.isArray(parsed.creditTransactions)) creditTransactions = parsed.creditTransactions;
      if (parsed.lastDailyBonusClaimed) lastDailyBonusClaimed = parsed.lastDailyBonusClaimed;
    } else {
      for (const s of songsStore) {
        issuedGenerationIds.add(s.generationId);
      }
      savePersistentDatabase();
    }
  } catch (err) {
    console.warn('Could not load persistent database, using default store:', err);
  }
}

function savePersistentDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // Strip large base64 externalAudioDataUrl if needed, or keep it
    const payload = {
      songs: songsStore,
      playlists: playlistsStore,
      userCredits,
      userPlan,
      lastDailyBonusClaimed,
      creditTransactions: creditTransactions.slice(0, 100),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to write persistent DB:', err);
  }
}

loadPersistentDatabase();

// ============================================================================
// Server-Side Multi-Stem 16-Bit Stereo WAV Synthesizer (Fast Lookup-Table DSP)
// Guarantees every generated song has a genuinely unique WAV binary & SHA-256 fingerprint
// ============================================================================
const SINE_TABLE_SIZE = 4096;
const SINE_TABLE_MASK = SINE_TABLE_SIZE - 1;
const SINE_SCALE = SINE_TABLE_SIZE / (2 * Math.PI);
const SINE_TABLE = new Float32Array(SINE_TABLE_SIZE);
for (let i = 0; i < SINE_TABLE_SIZE; i++) {
  SINE_TABLE[i] = Math.sin((2 * Math.PI * i) / SINE_TABLE_SIZE);
}
function fastSin(rad: number): number {
  return SINE_TABLE[((rad * SINE_SCALE) | 0) & SINE_TABLE_MASK];
}

function createSeededPRNG(seedInput: number): () => number {
  let a = (seedInput >>> 0) || 0x6d2b79f5;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashText32(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getServerCamelotScale(camelotKey?: string, mood?: string): { rootMidi: number; intervals: number[] } {
  const keyStr = camelotKey || '8A';
  let rootMidi = 45; // A2
  let isMajor = false;

  if (keyStr.startsWith('8A')) rootMidi = 45; // A minor
  else if (keyStr.startsWith('9A')) rootMidi = 40; // E minor
  else if (keyStr.startsWith('7A')) rootMidi = 38; // D minor
  else if (keyStr.startsWith('6A')) rootMidi = 43; // G minor
  else if (keyStr.startsWith('5A')) rootMidi = 36; // C minor
  else if (keyStr.startsWith('4A')) rootMidi = 41; // F minor
  else if (keyStr.startsWith('10A')) rootMidi = 47; // B minor
  else if (keyStr.startsWith('11A')) rootMidi = 42; // F# minor
  else if (keyStr.startsWith('8B')) {
    rootMidi = 36;
    isMajor = true;
  } else if (keyStr.startsWith('11B')) {
    rootMidi = 45;
    isMajor = true;
  }

  if (isMajor || mood === 'Uplifting') {
    return { rootMidi, intervals: [0, 2, 4, 5, 7, 9, 11, 12] };
  }
  if (mood === 'Dark & Gritty' || mood === 'Aggressive') {
    return { rootMidi, intervals: [0, 1, 3, 5, 7, 8, 10, 12] };
  }
  if (mood === 'Euphoric' || mood === 'Romantic') {
    return { rootMidi, intervals: [0, 2, 3, 5, 7, 9, 10, 12] };
  }
  return { rootMidi, intervals: [0, 2, 3, 5, 7, 8, 10, 12] };
}

const SERVER_PROGRESSIONS: number[][] = [
  [0, 5, 3, 6],
  [0, 3, 5, 4],
  [0, 6, 5, 6],
  [3, 4, 0, 5],
  [0, 2, 5, 3],
  [0, 4, 6, 3],
  [0, 1, 0, 6],
  [5, 6, 0, 4],
];

function synthesizeServerWavBuffer(song: StoredSong): { wavBuffer: Buffer; fingerprint: string } {
  const cacheKey = `${song.id}:${song.generationId}:${song.seed}:${song.bpm}:${song.genre}:${song.camelotKey || ''}:${JSON.stringify(song.stemMix || {})}`;
  const cached = audioBuffersMap.get(cacheKey);
  if (cached) {
    const fp = crypto.createHash('sha256').update(cached).digest('hex').slice(0, 16);
    return { wavBuffer: cached, fingerprint: `fp-${fp}` };
  }

  const sampleRate = 24000; // Fast high-clarity stereo synthesis
  const durationSec = Math.min(36, Math.max(18, song.duration || 26));
  const numChannels = 2;
  const totalSamples = Math.floor(sampleRate * durationSec);

  const leftChan = new Float32Array(totalSamples);
  const rightChan = new Float32Array(totalSamples);

  const contentSalt = hashText32(
    `${song.id}|${song.generationId}|${song.title}|${song.prompt}|${song.lyrics || ''}|${song.genre}|${song.bpm}|${song.mood}|${song.camelotKey || ''}|${song.vocalMode}|${song.version || 'A'}`
  );
  const combinedSeed = ((song.seed >>> 0) ^ contentSalt) >>> 0;
  const rand = createSeededPRNG(combinedSeed);

  const bpm = Math.max(60, Math.min(180, Number(song.bpm) || 124));
  const secPerBeat = 60 / bpm;
  const secPerStep = secPerBeat / 4; // 16th note
  const secPerMeasure = secPerBeat * 4;
  const totalMeasures = Math.ceil(durationSec / secPerMeasure);

  const stemMix = song.stemMix || {
    kickSub: 90,
    percussion: 88,
    synthsChords: 85,
    vocalsChants: song.isInstrumental ? 0 : 88,
    sidechainPump: 84,
    filterCutoff: 88,
  };
  const kickGain = (stemMix.kickSub ?? 90) / 85;
  const percGain = (stemMix.percussion ?? 88) / 85;
  const synthGain = (stemMix.synthsChords ?? 85) / 85;
  const vocalGain = song.isInstrumental ? 0 : (stemMix.vocalsChants ?? 88) / 85;

  const { rootMidi, intervals } = getServerCamelotScale(song.camelotKey, song.mood);
  const prog = SERVER_PROGRESSIONS[Math.floor(rand() * SERVER_PROGRESSIONS.length)];

  // Build unique 16-step bass & melody patterns from seed + lyrics + prompt
  const bassGate: boolean[] = [];
  const bassOctave: number[] = [];
  const melodyDeg: number[] = [];
  const melodyGate: boolean[] = [];
  const textSource = (song.lyrics || song.prompt || song.title || 'SONIQ').replace(/\s+/g, '');

  for (let s = 0; s < 16; s++) {
    if (song.genre === 'Afro House' || song.genre === 'Latin House') {
      bassGate.push(s === 0 || s === 3 || s === 6 || s === 8 || s === 11 || s === 14 || rand() > 0.55);
    } else if (song.genre === 'Tech House' || song.genre === 'Melodic Techno') {
      bassGate.push(s % 4 !== 0 && (s % 2 === 1 || rand() > 0.35));
    } else {
      bassGate.push(s % 2 === 0 || rand() > 0.5);
    }
    bassOctave.push(rand() > 0.7 ? 12 : 0);

    const ch = textSource.charCodeAt(s % Math.max(1, textSource.length)) || 68;
    melodyDeg.push((ch + Math.floor(rand() * 7)) % intervals.length);
    melodyGate.push(rand() > 0.28);
  }

  const kickStartHz = 132 + Math.floor(rand() * 38);
  const kickEndHz = 35 + Math.floor(rand() * 12);
  const introMeasures = song.djIntroStyle && song.djIntroStyle !== 'none' ? 2 : 0;
  const outroStartMeasure =
    song.djOutroStyle && song.djOutroStyle !== 'none'
      ? Math.max(totalMeasures - 2, introMeasures + 2)
      : totalMeasures;

  // Render measure by measure
  for (let m = 0; m < totalMeasures; m++) {
    const isIntro = m < introMeasures;
    const isOutro = m >= outroStartMeasure;
    const deg = prog[m % prog.length];
    const chordMidi = [
      rootMidi + 12 + intervals[deg % intervals.length],
      rootMidi + 12 + intervals[(deg + 2) % intervals.length],
      rootMidi + 12 + intervals[(deg + 4) % intervals.length],
      rootMidi + 12 + intervals[(deg + 6) % intervals.length],
    ];
    const subRootHz = midiToHz(chordMidi[0] - 12);

    // 1. Chords / Pads (outside pure percussive DJ Intro/Outro)
    if (!(isIntro && song.djIntroStyle === '16-bar-percussive') && !(isOutro && song.djOutroStyle === '16-bar-dj-loop')) {
      const mStartSample = Math.floor(m * secPerMeasure * sampleRate);
      const mEndSample = Math.min(totalSamples, Math.floor((m + 1) * secPerMeasure * sampleRate));
      const padAmp = (isIntro || isOutro ? 0.05 : 0.11) * synthGain;

      const freqs = chordMidi.map(midiToHz);
      for (let i = mStartSample; i < mEndSample; i++) {
        const t = (i - mStartSample) / sampleRate;
        const env = Math.min(1, t / 0.12) * Math.exp(-t * 0.45);
        // Sidechain pump on every beat
        const beatPhase = (t % secPerBeat) / secPerBeat;
        const pump = 0.35 + 0.65 * Math.min(1, beatPhase * 2.2);

        let sumL = 0;
        let sumR = 0;
        for (let c = 0; c < freqs.length; c++) {
          const sig = fastSin(2 * Math.PI * freqs[c] * t) + 0.35 * fastSin(4 * Math.PI * freqs[c] * t);
          if (c % 2 === 0) sumL += sig;
          else sumR += sig;
        }
        leftChan[i] += sumL * 0.25 * padAmp * env * pump;
        rightChan[i] += sumR * 0.25 * padAmp * env * pump;
      }
    }

    // 2. 16-Step Sequencer per measure (Drums, Sub-Bass, Lead Arpeggio, Vocal Formant)
    for (let s = 0; s < 16; s++) {
      const stepTime = m * secPerMeasure + s * secPerStep;
      const stepStartSample = Math.floor(stepTime * sampleRate);
      if (stepStartSample >= totalSamples) break;

      // Kick on quarter notes (s % 4 === 0)
      if (s % 4 === 0 && kickGain > 0.05) {
        const kickSamples = Math.min(totalSamples - stepStartSample, Math.floor(0.24 * sampleRate));
        let phase = 0;
        for (let i = 0; i < kickSamples; i++) {
          const t = i / sampleRate;
          const instHz = kickEndHz + (kickStartHz - kickEndHz) * Math.exp(-t * 28);
          phase += (2 * Math.PI * instHz) / sampleRate;
          const env = Math.exp(-t * 14);
          const sample = fastSin(phase) * env * 0.65 * kickGain;
          leftChan[stepStartSample + i] += sample;
          rightChan[stepStartSample + i] += sample;
        }
      }

      // Clap / Snare on beats 2 & 4 (s === 4 || s === 12)
      if ((s === 4 || s === 12) && percGain > 0.05) {
        const snareSamples = Math.min(totalSamples - stepStartSample, Math.floor(0.14 * sampleRate));
        for (let i = 0; i < snareSamples; i++) {
          const t = i / sampleRate;
          const noise = (rand() * 2 - 1) * Math.exp(-t * 24) * 0.28 * percGain;
          leftChan[stepStartSample + i] += noise;
          rightChan[stepStartSample + i] += noise * 0.95;
        }
      }

      // Hi-Hat / Shaker on every 16th step
      if (percGain > 0.05) {
        const isOpen = s % 4 === 2;
        const hatDur = isOpen ? 0.075 : 0.025;
        const hatSamples = Math.min(totalSamples - stepStartSample, Math.floor(hatDur * sampleRate));
        const hatAmp = (isOpen ? 0.16 : 0.07) * percGain;
        for (let i = 0; i < hatSamples; i++) {
          const t = i / sampleRate;
          const hSig = (rand() * 2 - 1) * Math.exp(-t * (isOpen ? 30 : 75)) * hatAmp;
          leftChan[stepStartSample + i] += hSig * 0.9;
          rightChan[stepStartSample + i] += hSig * 1.1;
        }
      }

      // Sub-Bassline
      if (bassGate[s] && kickGain > 0.05) {
        const bassHz = subRootHz * (bassOctave[s] > 0 && !isIntro && !isOutro ? 2 : 1);
        const bassDur = secPerStep * 0.92;
        const bassSamples = Math.min(totalSamples - stepStartSample, Math.floor(bassDur * sampleRate));
        const duck = s % 4 === 0 ? 0.45 : 1.0;
        for (let i = 0; i < bassSamples; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t / 0.01) * Math.exp(-t * 9);
          const raw = fastSin(2 * Math.PI * bassHz * t) + 0.4 * fastSin(4 * Math.PI * bassHz * t);
          const sig = Math.tanh(raw * 1.4) * env * 0.36 * kickGain * duck;
          leftChan[stepStartSample + i] += sig;
          rightChan[stepStartSample + i] += sig;
        }
      }

      // Melodic Hook / Lead (outside DJ Intro/Outro)
      if (!isIntro && !isOutro && melodyGate[(s + m) % 16] && synthGain > 0.05) {
        const mDeg = melodyDeg[(s + m * 3) % melodyDeg.length];
        const leadHz = midiToHz(rootMidi + 24 + intervals[mDeg % intervals.length]);
        const leadDur = secPerStep * 1.25;
        const leadSamples = Math.min(totalSamples - stepStartSample, Math.floor(leadDur * sampleRate));
        const panL = s % 2 === 0 ? 0.8 : 0.4;
        const panR = s % 2 === 0 ? 0.4 : 0.8;
        for (let i = 0; i < leadSamples; i++) {
          const t = i / sampleRate;
          const env = Math.min(1, t / 0.008) * Math.exp(-t * 12);
          const sig =
            (fastSin(2 * Math.PI * leadHz * t) + 0.5 * fastSin(6 * Math.PI * leadHz * t)) *
            env *
            0.14 *
            synthGain;
          leftChan[stepStartSample + i] += sig * panL;
          rightChan[stepStartSample + i] += sig * panR;
        }
      }

      // Lyrics-Driven Vocal Formant Hook (on 8th-note steps outside DJ Intro/Outro)
      if (!isIntro && !isOutro && !song.isInstrumental && vocalGain > 0.05 && s % 2 === 0 && (s + m + combinedSeed) % 4 === 0) {
        const vDeg = melodyDeg[(m * 4 + (s >> 1)) % melodyDeg.length];
        const vHz = midiToHz(
          rootMidi + (song.vocalMode === 'male' ? 12 : 24) + intervals[vDeg % intervals.length]
        );
        const formantHz = song.vocalMode === 'male' ? 540 : 780;
        const vDur = secPerStep * 2.2;
        const vSamples = Math.min(totalSamples - stepStartSample, Math.floor(vDur * sampleRate));
        for (let i = 0; i < vSamples; i++) {
          const t = i / sampleRate;
          const vibrato = 1 + 0.006 * fastSin(2 * Math.PI * 5.5 * t);
          const env = Math.min(1, t / 0.04) * Math.exp(-t * 4.5);
          const carrier = fastSin(2 * Math.PI * vHz * vibrato * t);
          const formant = fastSin(2 * Math.PI * formantHz * t);
          const vSig = (carrier * 0.7 + carrier * formant * 0.5) * env * 0.16 * vocalGain;
          leftChan[stepStartSample + i] += vSig;
          rightChan[stepStartSample + i] += vSig;
        }
      }
    }
  }

  // Encode stereo PCM WAV buffer
  const dataLength = totalSamples * numChannels * 2;
  const wavBuffer = Buffer.alloc(44 + dataLength);

  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + dataLength, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20); // PCM
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(sampleRate * numChannels * 2, 28);
  wavBuffer.writeUInt16LE(numChannels * 2, 32);
  wavBuffer.writeUInt16LE(16, 34);
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataLength, 40);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const sL = Math.max(-1, Math.min(1, leftChan[i]));
    const sR = Math.max(-1, Math.min(1, rightChan[i]));
    wavBuffer.writeInt16LE(sL < 0 ? (sL * 0x8000) | 0 : (sL * 0x7fff) | 0, offset);
    wavBuffer.writeInt16LE(sR < 0 ? (sR * 0x8000) | 0 : (sR * 0x7fff) | 0, offset + 2);
    offset += 4;
  }

  const fingerprintHash = crypto.createHash('sha256').update(wavBuffer).digest('hex').slice(0, 16);
  const fingerprint = `fp-${fingerprintHash}`;
  audioBuffersMap.set(cacheKey, wavBuffer);

  return { wavBuffer, fingerprint };
}

// Helper to record credit transaction
function recordCreditTx(amount: number, type: string, description: string): StoredCreditTransaction {
  userCredits += amount;
  const tx: StoredCreditTransaction = {
    id: `tx-${Date.now()}-${crypto.randomInt(1000, 9999)}`,
    amount,
    type,
    description,
    createdAt: new Date().toISOString(),
    balanceAfter: userCredits,
  };
  creditTransactions.unshift(tx);
  savePersistentDatabase();
  return tx;
}

// Audio buffers are pre-warmed non-blockingly after port 3000 is listening

// Helper to stream audio buffer with full HTTP Range (206 Partial Content) support for instant browser playback & seeking
function sendAudioBufferWithRange(req: Request, res: Response, buffer: Buffer, mimeType: string, fingerprint: string) {
  const total = buffer.length;
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Audio-Fingerprint', fingerprint);

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
    if (!isNaN(start) && !isNaN(end) && start >= 0 && end < total && start <= end) {
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', String(chunkSize));
      res.end(buffer.subarray(start, end + 1));
      return;
    }
  }

  res.status(200);
  res.setHeader('Content-Length', String(total));
  res.end(buffer);
}

// API: Stream Unique Audio for a Song (Supports HTTP Range for Instant Playback, Unique per Generation ID)
app.get('/api/music/stream/:songId', (req: Request, res: Response) => {
  const { songId } = req.params;
  const song = songsStore.find((s) => s.id === songId);

  if (!song) {
    res.status(404).json({ error: 'Audio track not found', songId });
    return;
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Generation-ID', song.generationId);
  res.setHeader('X-Request-ID', song.requestId);
  res.setHeader('X-Audio-Seed', String(song.seed));

  // If external provider (e.g. Lyria) returned a base64 audio data URL, stream those exact bytes
  if (song.externalAudioDataUrl && song.externalAudioDataUrl.startsWith('data:')) {
    const match = song.externalAudioDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      sendAudioBufferWithRange(req, res, buffer, mimeType, song.audioFingerprint);
      return;
    }
  }

  // Only allow procedural WAV synthesis if the track was created with internal-synth (or is a seed demo track)
  if (song.provider && song.provider !== 'internal-synth') {
    res.status(404).json({
      error: 'AI_AUDIO_NOT_AVAILABLE',
      message: `No AI audio stream is stored for song ${song.id} (provider: ${song.provider}). Refusing to substitute internal oscillator synthesis.`,
    });
    return;
  }

  // Synthesize or retrieve pre-warmed unique WAV binary for internal-synth demo tracks
  const { wavBuffer, fingerprint } = synthesizeServerWavBuffer(song);
  song.audioFingerprint = fingerprint;
  sendAudioBufferWithRange(req, res, wavBuffer, 'audio/wav', fingerprint);
});

// API: Poll Generation Job Status
app.get('/api/music/jobs/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = generationJobs.get(jobId);
  if (!job) {
    res.status(404).json({ error: 'Generation job not found', jobId });
    return;
  }
  console.log(`[SONIQ_GEN_POLL] jobId=${job.jobId} requestId=${job.requestId} status=${job.status}`);
  res.json({
    success: true,
    job,
  });
});

// API: Get Credit Balance & History
app.get('/api/credits', (_req: Request, res: Response) => {
  let canClaimDaily = true;
  let nextClaimMs = 0;
  if (lastDailyBonusClaimed) {
    const elapsed = Date.now() - new Date(lastDailyBonusClaimed).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (elapsed < twentyFourHours) {
      canClaimDaily = false;
      nextClaimMs = twentyFourHours - elapsed;
    }
  }

  res.json({
    success: true,
    credits: userCredits,
    plan: userPlan,
    canClaimDaily,
    nextClaimMs,
    lastDailyBonusClaimed,
    transactions: creditTransactions.slice(0, 50),
  });
});

// API: Claim Free Daily Bonus (+25 Credits)
app.post('/api/credits/claim-daily', (_req: Request, res: Response) => {
  if (lastDailyBonusClaimed) {
    const elapsed = Date.now() - new Date(lastDailyBonusClaimed).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (elapsed < twentyFourHours) {
      const hoursLeft = Math.ceil((twentyFourHours - elapsed) / 3600000);
      res.status(400).json({
        success: false,
        message: `Daily bonus already claimed! Next bonus ready in ~${hoursLeft} hour(s).`,
      });
      return;
    }
  }

  lastDailyBonusClaimed = new Date().toISOString();
  const tx = recordCreditTx(25, 'daily_bonus', 'Daily Creator Bonus Drop');

  res.json({
    success: true,
    credits: userCredits,
    bonusAmount: 25,
    message: 'Added +25 Free Credits to your studio balance!',
    transaction: tx,
  });
});

// API: Purchase / Top-up Credits
app.post('/api/credits/purchase', (req: Request, res: Response) => {
  const { credits, name } = req.body;
  if (!credits || credits <= 0) {
    res.status(400).json({ error: 'Valid credit amount is required' });
    return;
  }

  const tx = recordCreditTx(credits, 'purchase', `${name || 'Credit Pack'} (+${credits} credits)`);

  res.json({
    success: true,
    credits: userCredits,
    message: `Successfully topped up +${credits} credits!`,
    transaction: tx,
  });
});

// API: Manual Deduct Endpoint
app.post('/api/credits/deduct', (req: Request, res: Response) => {
  const { amount = 5, type = 'usage', description = 'Studio Action' } = req.body;
  if (userCredits < amount) {
    res.status(402).json({
      error: 'INSUFFICIENT_CREDITS',
      message: `You need ${amount} credits for this action, but currently have ${userCredits}.`,
      required: amount,
      available: userCredits,
    });
    return;
  }

  const tx = recordCreditTx(-Math.abs(amount), type, description);
  res.json({
    success: true,
    credits: userCredits,
    transaction: tx,
  });
});

// API: Generate structured lyrics with Gemini 3.8 Flash
app.post('/api/lyrics/generate', async (req: Request, res: Response) => {
  try {
    const { genre, mood, theme, language = 'English', vocalPerspective = 'duet', title } = req.body;

    if (!theme && !genre) {
      res.status(400).json({ error: 'Theme or genre is required to generate lyrics.' });
      return;
    }

    const systemInstruction = `You are a world-class electronic & club music songwriter specializing in Deep House, Afro House, Latin House, Tech House, Melodic Techno, EDM, and Pop.
Generate fully structured, memorable song lyrics with club hooks, vivid imagery, and rhythmic flow matched to the genre tempo and mood.
Language for the lyrics must be: ${language}.
Always return your response as JSON matching the requested schema.`;

    const promptText = `Write complete song lyrics with the following specifications:
- Title Idea: ${title || 'Club Anthem'}
- Genre: ${genre}
- Mood: ${mood}
- Song Theme/Topic: ${theme}
- Vocal Perspective: ${vocalPerspective} (indicate vocal tags like [Lead], [Chant], [Drop Hook] where fitting)
- Language: ${language}

Provide a full structure with Verse 1, Chorus 1, Verse 2, Chorus 2, Bridge, Outro, and musical cues in brackets.`;

    if (userCredits < 2) {
      res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: `You need 2 credits for the AI Lyrics Assistant, but have ${userCredits}.`,
        required: 2,
        available: userCredits,
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        seed: crypto.randomInt(1, 2000000000),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Catchy song title' },
            structure: {
              type: Type.OBJECT,
              properties: {
                verse1: { type: Type.STRING, description: 'First verse lyrics' },
                chorus1: { type: Type.STRING, description: 'Catchy main chorus lyrics' },
                verse2: { type: Type.STRING, description: 'Second verse lyrics' },
                chorus2: { type: Type.STRING, description: 'Second chorus lyrics' },
                bridge: { type: Type.STRING, description: 'Emotional or dynamic bridge' },
                outro: { type: Type.STRING, description: 'Fading or climax outro' },
              },
              required: ['verse1', 'chorus1', 'verse2', 'chorus2', 'bridge', 'outro'],
            },
            fullLyrics: { type: Type.STRING, description: 'The complete formatted song lyrics text' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Style and vibe tags',
            },
          },
          required: ['title', 'structure', 'fullLyrics', 'tags'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    recordCreditTx(-2, 'lyrics_generation', `AI Lyrics Assistant for "${title || genre}"`);

    res.json({ success: true, data: parsedData, creditsRemaining: userCredits });
  } catch (error: unknown) {
    console.log('[SONIQ_LYRICS_NOTICE] Lyrics generation notice');
    res.status(200).json({
      success: false,
      error: 'LYRICS_GENERATION_FAILED',
      message: error instanceof Error ? error.message.slice(0, 200) : 'Could not generate lyrics with Gemini',
    });
  }
});

// API: Enhance music prompt using Gemini 3.8 Flash
app.post('/api/prompt/enhance', async (req: Request, res: Response) => {
  try {
    const { prompt, genre, mood, isInstrumental } = req.body;

    if (userCredits < 1) {
      res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        message: 'You need 1 credit to enhance your prompt.',
        required: 1,
        available: userCredits,
      });
      return;
    }

    const systemInstruction = `You are an elite electronic & club music producer and sound designer.
Given a simple user prompt, enhance it into a rich, detailed club production prompt specifying percussion textures, bassline synthesis, chord voicings, DJ intro/outro arrangement, tempo pacing, and vocal style.
Keep the enhanced prompt under 180 words, punchy and highly descriptive. Return JSON with enhancedPrompt, suggestedTitle, and styleTags.`;

    const userQuery = `Enhance this music creation prompt:
User idea: "${prompt || genre}"
Target Genre: ${genre || 'Deep House'}
Target Mood: ${mood || 'Euphoric'}
Is Instrumental: ${isInstrumental ? 'Yes (no vocals)' : 'No (includes vocals)'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userQuery,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        seed: crypto.randomInt(1, 2000000000),
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedPrompt: { type: Type.STRING, description: 'The rich studio prompt' },
            suggestedTitle: { type: Type.STRING, description: 'Creative suggested song title' },
            styleTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Recommended tags',
            },
          },
          required: ['enhancedPrompt', 'suggestedTitle', 'styleTags'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    recordCreditTx(-1, 'prompt_enhancement', `AI Prompt Enhancer for ${genre}`);

    res.json({ success: true, data: result, creditsRemaining: userCredits });
  } catch (error: unknown) {
    console.log('[SONIQ_PROMPT_NOTICE] Prompt enhancer notice');
    res.status(200).json({
      success: false,
      error: 'PROMPT_ENHANCE_FAILED',
      message: error instanceof Error ? error.message.slice(0, 200) : 'Could not enhance prompt',
    });
  }
});

// Server-side fallback SVG artwork generator
function generateServerCoverArt(title: string, genre: string, mood: string): string {
  const sanitizedTitle = (title || 'Studio Master').replace(/["&<>]/g, '').slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2E1065" />
        <stop offset="50%" stop-color="#0F0C1E" />
        <stop offset="100%" stop-color="#050508" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#A855F7" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#2E1065" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)" />
    <circle cx="200" cy="180" r="130" fill="url(#glow)" />
    <circle cx="200" cy="180" r="85" fill="none" stroke="#C084FC" stroke-width="2" stroke-dasharray="4 6" opacity="0.6" />
    <circle cx="200" cy="180" r="40" fill="#151028" stroke="#A855F7" stroke-width="2.5" />
    <text x="200" y="188" fill="#FFF" font-size="22" font-weight="bold" font-family="sans-serif" text-anchor="middle">✦</text>
    <rect y="270" width="400" height="130" fill="black" fill-opacity="0.7" />
    <rect x="24" y="290" width="80" height="20" rx="4" fill="#A855F7" fill-opacity="0.3" stroke="#A855F7" stroke-width="0.8" />
    <text x="64" y="304" fill="#C084FC" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">${(genre || 'POP').toUpperCase()}</text>
    <text x="115" y="304" fill="#9CA3AF" font-size="10" font-family="sans-serif">${mood || 'Energetic'}</text>
    <text x="24" y="345" fill="#FFF" font-size="22" font-weight="bold" font-family="sans-serif">${sanitizedTitle}</text>
    <text x="24" y="375" fill="#6B7280" font-size="10" font-family="monospace" letter-spacing="2">SONIQ AI • STUDIO MASTER</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// API: Generate Album Cover Artwork with Gemini Image or High-Res Synth Fallback
app.post('/api/artwork/generate', async (req: Request, res: Response) => {
  const { title = 'Studio Master', genre = 'Pop', mood = 'Energetic', prompt = '' } = req.body;

  try {
    const imgPrompt = `Square vinyl album cover artwork for modern music track "${title}". Style: ${genre}, Mood: ${mood}. ${prompt}. Cyberpunk neon violet aesthetic, ultra high resolution typography, studio vinyl cover art.`;

    const imgRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: imgPrompt,
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    for (const part of imgRes.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        const base64 = part.inlineData.data;
        res.json({ success: true, imageUrl: `data:${mime};base64,${base64}` });
        return;
      }
    }
  } catch {
    // Fallback smoothly to SVG artwork
  }

  const fallbackUrl = generateServerCoverArt(title, genre, mood);
  res.json({ success: true, imageUrl: fallbackUrl, isFallback: true });
});

// Helper: Poll Replicate Prediction until completion
async function pollReplicatePrediction(predictionUrl: string, apiKey: string, requestId: string): Promise<string> {
  const maxAttempts = 25;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(predictionUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const pollData = await pollRes.json();
    console.log(
      `[SONIQ_GEN_POLL] Replicate prediction poll attempt=${attempt} requestId=${requestId} status=${pollData.status}`
    );
    if (pollData.status === 'succeeded') {
      const outputUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
      if (typeof outputUrl === 'string' && outputUrl.length > 0) {
        return outputUrl;
      }
      throw new Error('Replicate job succeeded but returned empty audio output');
    }
    if (pollData.status === 'failed' || pollData.status === 'canceled') {
      throw new Error(pollData.error || `Replicate prediction ${pollData.status}`);
    }
  }
  throw new Error('Replicate prediction timed out');
}

// API: Music Generation Endpoint
app.post('/api/music/generate', async (req: Request, res: Response) => {
  try {
    const {
      requestId: clientRequestId,
      seed: clientSeed,
      title,
      prompt,
      lyrics,
      genre = 'Deep House',
      bpm = 124,
      mood = 'Euphoric',
      vocalMode = 'female',
      language = 'English',
      vocalLanguages = ['English'],
      vocalStyle = 'Soulful House Diva',
      isInstrumental = false,
      provider = 'lyria-3.5',
      generateDualVersions = false,
      extendedFromId,
      camelotKey = '8A (A Minor)',
      djIntroStyle = '16-bar-percussive',
      djOutroStyle = '16-bar-dj-loop',
      arrangement,
      stemMix,
      mixType = 'Extended DJ Mix',
    } = req.body;

    // 1. Generate or validate unique Request UUID
    const requestId =
      typeof clientRequestId === 'string' && clientRequestId.trim().length > 8 && !processedRequestIds.has(clientRequestId)
        ? clientRequestId.trim()
        : `req-${crypto.randomUUID()}`;
    processedRequestIds.add(requestId);

    const jobId = `job-${crypto.randomUUID()}`;
    // 2. Generate non-fixed cryptographic seed for Version A and Version B
    const seedA =
      typeof clientSeed === 'number' && clientSeed > 0
        ? (clientSeed ^ crypto.randomInt(1000, 99999999)) >>> 0
        : crypto.randomInt(100000000, 999999999);
    const seedB = crypto.randomInt(100000000, 999999999);

    console.log(
      `[SONIQ_GEN_REQUEST] requestId=${requestId} jobId=${jobId} provider=${provider} genre="${genre}" bpm=${bpm} key="${camelotKey}" seedA=${seedA} seedB=${seedB} title="${title || ''}" prompt="${(prompt || '').slice(0, 60)}"`
    );

    // Validation
    if (!prompt && !lyrics && !title) {
      res.status(400).json({ error: 'Song prompt, lyrics, or title is required.' });
      return;
    }

    const creditCost = generateDualVersions ? 10 : 5;
    if (userCredits < creditCost) {
      res.status(402).json({
        error: 'INSUFFICIENT_CREDITS',
        required: creditCost,
        available: userCredits,
        message: `Je hebt ${creditCost} credits nodig voor deze generatie, maar je saldo is ${userCredits}. Waardeer je credits op of claim de dagelijkse bonus.`,
      });
      return;
    }

    const isLyriaProvider =
      provider === 'lyria-3.5' ||
      provider === 'lyria-3-pro-preview' ||
      provider === 'lyria-3-clip-preview' ||
      provider === 'gemini-lyria';

    if (isLyriaProvider && !process.env.GEMINI_API_KEY) {
      res.status(400).json({
        error: 'CONFIG_REQUIRED',
        provider,
        message:
          'GEMINI_API_KEY is not configured on the server. Configure a valid paid Gemini API key to generate AI music with Google Lyria.',
      });
      return;
    }

    // Check external provider configuration
    if (provider === 'replicate-musicgen' && !serverSettings.replicateApiKey) {
      res.status(400).json({
        error: 'CONFIG_REQUIRED',
        provider: 'replicate-musicgen',
        message:
          'Replicate API token is not configured. Please add your token in Settings > API Configuration.',
      });
      return;
    }

    if ((provider === 'suno-api' || provider === 'suno-v4') && !serverSettings.sunoApiKey) {
      res.status(400).json({
        error: 'CONFIG_REQUIRED',
        provider,
        message:
          'Suno API key is not configured. Please add your Suno key in Settings > API Configuration.',
      });
      return;
    }

    if (provider === 'elevenlabs' && !serverSettings.elevenlabsApiKey) {
      res.status(400).json({
        error: 'CONFIG_REQUIRED',
        provider: 'elevenlabs',
        message:
          'ElevenLabs API key is not configured. Please add your ElevenLabs API key in Settings > API Configuration.',
      });
      return;
    }

    // Register asynchronous job tracking record
    generationJobs.set(jobId, {
      jobId,
      requestId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: [],
    });

    let externalAudioUrlA = '';
    let externalAudioUrlB = '';
    let resolvedMimeTypeA = 'audio/mpeg';
    let resolvedMimeTypeB = 'audio/mpeg';

    // Helper function to call Google Lyria and extract real generated audio bytes
    const invokeLyriaModel = async (
      targetModel: string,
      variationLabel: string,
      variationSeed: number
    ): Promise<{ dataUrl: string; mimeType: string; byteLength: number }> => {
      const vocalDesc = isInstrumental
        ? 'Instrumental club mix only, no vocals.'
        : `Vocals: ${vocalMode} vocals in ${(vocalLanguages || [language]).join(' and ')} (${vocalStyle}). ${lyrics ? `Lyrics:\n${lyrics}` : ''}`;

      const conditioningPrompt = [
        `Create an original ${genre} electronic track (${variationLabel}, request ${requestId}, variation seed ${variationSeed}).`,
        `Target tempo guideline: ${bpm} BPM. Target harmonic key guideline: ${camelotKey}. Mood: ${mood}.`,
        `Arrangement guideline: ${mixType}, DJ Intro (${djIntroStyle}), DJ Outro (${djOutroStyle}).`,
        `Title: ${title || 'Untitled Club Track'}.`,
        `Sound & groove description: ${prompt || `${genre} electronic music track`}.`,
        vocalDesc,
      ].join('\n');

      console.log(
        `[SONIQ_LYRIA_CALL] requestId=${requestId} model=${targetModel} variation=${variationLabel} seed=${variationSeed}`
      );

      const responseStream = await ai.models.generateContentStream({
        model: targetModel,
        contents: conditioningPrompt,
      });

      const audioChunks: Buffer[] = [];
      let detectedMime = 'audio/mpeg';
      const textNotes: string[] = [];

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (audioChunks.length === 0 && part.inlineData.mimeType) {
              detectedMime = part.inlineData.mimeType;
            }
            audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
          } else if (part.text) {
            textNotes.push(part.text);
          }
        }
      }

      if (audioChunks.length === 0) {
        throw new Error(
          `Google Lyria (${targetModel}) returned 0 audio bytes.${textNotes.length > 0 ? ` Model response: ${textNotes.join(' ').slice(0, 200)}` : ''}`
        );
      }

      const fullBuffer = Buffer.concat(audioChunks);
      const audioBase64 = fullBuffer.toString('base64');
      console.log(
        `[SONIQ_LYRIA_SUCCESS] requestId=${requestId} model=${targetModel} variation=${variationLabel} mimeType=${detectedMime} bytes=${fullBuffer.length}`
      );
      return {
        dataUrl: `data:${detectedMime};base64,${audioBase64}`,
        mimeType: detectedMime,
        byteLength: fullBuffer.length,
      };
    };

    // External provider dispatch: Google Lyria 3.5 / Lyria 3 Pro / Lyria 3 Clip
    if (isLyriaProvider) {
      // Map 'lyria-3.5' or 'lyria-3-pro-preview' to official full-song model 'lyria-3-pro-preview', and 'lyria-3-clip-preview' to 30s clip model
      const primaryLyriaModel =
        provider === 'lyria-3-clip-preview' ? 'lyria-3-clip-preview' : 'lyria-3-pro-preview';

      try {
        const resultA = await invokeLyriaModel(primaryLyriaModel, 'Mix A', seedA);
        externalAudioUrlA = resultA.dataUrl;
        resolvedMimeTypeA = resultA.mimeType;

        if (generateDualVersions) {
          const resultB = await invokeLyriaModel(primaryLyriaModel, 'VIP Dub Mix B', seedB);
          externalAudioUrlB = resultB.dataUrl;
          resolvedMimeTypeB = resultB.mimeType;
        }
      } catch (lyriaErr: unknown) {
        const rawErrMessage = lyriaErr instanceof Error ? lyriaErr.message : String(lyriaErr);
        const isQuotaOrBilling =
          rawErrMessage.includes('429') ||
          rawErrMessage.includes('RESOURCE_EXHAUSTED') ||
          rawErrMessage.includes('Quota exceeded') ||
          rawErrMessage.includes('free_tier');

        console.log(
          `[SONIQ_LYRIA_STATUS] requestId=${requestId} requestedProvider=${provider} officialModel=${primaryLyriaModel} status=${isQuotaOrBilling ? 'QUOTA_OR_BILLING_REQUIRED' : 'PROVIDER_ERROR'}`
        );

        generationJobs.set(jobId, {
          jobId,
          requestId,
          status: 'failed',
          createdAt: generationJobs.get(jobId)?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          songs: [],
          error: isQuotaOrBilling
            ? `Google Lyria (${primaryLyriaModel}) requires a paid Gemini API key with billing enabled (Free Tier limit is 0).`
            : rawErrMessage.slice(0, 240),
        });

        const cleanExplanation = isQuotaOrBilling
          ? `Google Lyria AI (${provider} → ${primaryLyriaModel}) vereist een betaalde Gemini API-sleutel met ingeschakelde facturering (het gratis tier-limiet voor Lyria audio is 0 requests). Er is géén stille fallback naar de interne demo-synthesizer uitgevoerd. Kies hieronder 'Optionele Interne Demo DSP Synthesizer' als je lokaal zonder betaalde sleutel wilt testen.`
          : `Google Lyria AI (${provider} → ${primaryLyriaModel}) kon geen audio genereren. Er is géén stille fallback naar de interne demo-synthesizer uitgevoerd.`;

        res.status(200).json({
          success: false,
          error: isQuotaOrBilling ? 'LYRIA_QUOTA_OR_BILLING_REQUIRED' : 'AI_PROVIDER_ERROR',
          provider,
          officialModel: primaryLyriaModel,
          requestId,
          jobId,
          message: cleanExplanation,
        });
        return;
      }
    }

    // External provider dispatch: Replicate MusicGen with proper async polling & random seed (NO silent fallback)
    if (provider === 'replicate-musicgen') {
      try {
        const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serverSettings.replicateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'b05b1dff1d8c2374d62b0d4b15b6e3b93495a5260a66f1406f9c4029d3d3ff65',
            input: {
              prompt: `${prompt}, ${genre}, ${bpm} BPM, ${camelotKey}, ${mood}`,
              duration: 25,
              seed: seedA,
            },
          }),
        });
        const repData = await replicateRes.json();
        if (!replicateRes.ok) {
          throw new Error(repData?.detail || 'Replicate API error');
        }
        if (repData?.urls?.get) {
          externalAudioUrlA = await pollReplicatePrediction(
            repData.urls.get,
            serverSettings.replicateApiKey!,
            requestId
          );
        }
        if (!externalAudioUrlA) {
          throw new Error('Replicate MusicGen did not return a valid audio URL.');
        }
      } catch (repErr: unknown) {
        const msg = repErr instanceof Error ? repErr.message : String(repErr);
        console.log(`[SONIQ_REPLICATE_STATUS] requestId=${requestId} status=PROVIDER_ERROR`);
        generationJobs.set(jobId, {
          jobId,
          requestId,
          status: 'failed',
          createdAt: generationJobs.get(jobId)?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          songs: [],
          error: msg,
        });
        res.status(200).json({
          success: false,
          error: 'AI_PROVIDER_ERROR',
          provider: 'replicate-musicgen',
          requestId,
          jobId,
          message: `Replicate MusicGen API failed: ${msg}. Internal synth fallback was NOT used.`,
        });
        return;
      }
    }

    // Calculate duration
    let baseDuration = provider === 'lyria-3-clip-preview' ? 30 : 28;
    if (provider === 'internal-synth') {
      if (djIntroStyle && djIntroStyle !== 'none') baseDuration += djIntroStyle.includes('32') ? 6 : 4;
      if (djOutroStyle && djOutroStyle !== 'none') baseDuration += djOutroStyle.includes('32') ? 6 : 4;
    } else if (provider === 'lyria-3.5' || provider === 'lyria-3-pro-preview') {
      baseDuration = 120;
    }

    // Generate guaranteed unique UUIDs for song records and generationIds
    const songIdA = `song-${crypto.randomUUID()}`;
    const generationIdA = `gen-${crypto.randomUUID()}`;
    issuedGenerationIds.add(generationIdA);

    const cleanTitle = title || (prompt ? prompt.slice(0, 28) : `${genre} ${mood} Club Mix`);

    const defaultStemMix = stemMix || {
      kickSub: 90,
      percussion: 88,
      synthsChords: 85,
      vocalsChants: isInstrumental ? 0 : 88,
      sidechainPump: 84,
      filterCutoff: 88,
    };

    const versionA: StoredSong = {
      id: songIdA,
      generationId: generationIdA,
      requestId,
      seed: seedA,
      audioFingerprint: '',
      generationStatus: 'succeeded',
      title: cleanTitle,
      prompt: prompt || `${genre} song with ${mood} vibe`,
      lyrics: lyrics || '',
      genre,
      bpm: Number(bpm) || 124,
      mood,
      vocalMode,
      language,
      vocalLanguages: Array.isArray(vocalLanguages) && vocalLanguages.length > 0 ? vocalLanguages : [language],
      vocalStyle,
      isInstrumental: Boolean(isInstrumental),
      duration: baseDuration,
      audioUrl:
        externalAudioUrlA && externalAudioUrlA.startsWith('http')
          ? externalAudioUrlA
          : `/api/music/stream/${encodeURIComponent(songIdA)}?genId=${encodeURIComponent(generationIdA)}&seed=${seedA}&reqId=${encodeURIComponent(requestId)}&mime=${encodeURIComponent(resolvedMimeTypeA)}`,
      externalAudioDataUrl: externalAudioUrlA.startsWith('data:') ? externalAudioUrlA : undefined,
      coverArtUrl: '',
      createdAt: new Date().toISOString(),
      version: 'A',
      provider,
      extendedFromId,
      playlistIds: [],
      camelotKey,
      djIntroStyle,
      djOutroStyle,
      arrangement,
      stemMix: defaultStemMix,
      mixType: mixType || 'Extended DJ Mix',
    };

    if (externalAudioUrlA) {
      versionA.audioFingerprint = `fp-${crypto.createHash('sha256').update(externalAudioUrlA).digest('hex').slice(0, 16)}`;
    } else if (provider === 'internal-synth') {
      const synthResultA = synthesizeServerWavBuffer(versionA);
      versionA.audioFingerprint = synthResultA.fingerprint;
    } else {
      res.status(502).json({
        error: 'EMPTY_AI_AUDIO',
        provider,
        requestId,
        message: `Provider ${provider} did not return audio bytes. Refusing to fall back to internal synthesizer.`,
      });
      return;
    }

    const songsCreated: StoredSong[] = [versionA];

    if (generateDualVersions) {
      const songIdB = `song-${crypto.randomUUID()}`;
      const generationIdB = `gen-${crypto.randomUUID()}`;
      issuedGenerationIds.add(generationIdB);

      const versionB: StoredSong = {
        id: songIdB,
        generationId: generationIdB,
        requestId,
        seed: seedB,
        audioFingerprint: '',
        generationStatus: 'succeeded',
        title: `${cleanTitle} (VIP Dub Mix)`,
        prompt: `${prompt || `${genre} song with ${mood} vibe`} [VIP Dub Mix Variation B]`,
        lyrics: lyrics || '',
        genre,
        bpm: Number(bpm) || 124,
        mood,
        vocalMode,
        language,
        vocalLanguages: Array.isArray(vocalLanguages) && vocalLanguages.length > 0 ? vocalLanguages : [language],
        vocalStyle,
        isInstrumental: Boolean(isInstrumental),
        duration: baseDuration,
        audioUrl:
          externalAudioUrlB && externalAudioUrlB.startsWith('http')
            ? externalAudioUrlB
            : `/api/music/stream/${encodeURIComponent(songIdB)}?genId=${encodeURIComponent(generationIdB)}&seed=${seedB}&reqId=${encodeURIComponent(requestId)}&mime=${encodeURIComponent(resolvedMimeTypeB)}`,
        externalAudioDataUrl: externalAudioUrlB.startsWith('data:') ? externalAudioUrlB : undefined,
        coverArtUrl: '',
        createdAt: new Date(Date.now() + 500).toISOString(),
        version: 'B',
        provider,
        extendedFromId,
        playlistIds: [],
        camelotKey,
        djIntroStyle,
        djOutroStyle,
        arrangement,
        stemMix: {
          ...defaultStemMix,
          kickSub: Math.min(100, defaultStemMix.kickSub + 6),
          percussion: Math.min(100, defaultStemMix.percussion + 4),
          sidechainPump: Math.min(100, defaultStemMix.sidechainPump + 8),
        },
        mixType: 'VIP Dub Edit',
      };

      if (externalAudioUrlB) {
        versionB.audioFingerprint = `fp-${crypto.createHash('sha256').update(externalAudioUrlB).digest('hex').slice(0, 16)}`;
        songsCreated.push(versionB);
      } else if (provider === 'internal-synth') {
        const synthResultB = synthesizeServerWavBuffer(versionB);
        versionB.audioFingerprint = synthResultB.fingerprint;
        songsCreated.push(versionB);
      }
    }

    // Verify no duplicate generationId or audioUrl exists in songsStore
    for (const created of songsCreated) {
      const duplicate = songsStore.find(
        (existing) =>
          existing.id === created.id ||
          existing.generationId === created.generationId ||
          (existing.audioUrl === created.audioUrl && created.audioUrl !== '')
      );
      if (duplicate) {
        throw new Error(
          `Duplicate generation detected (generationId=${created.generationId}). Aborting to prevent playing stale audio.`
        );
      }
    }

    // Persist each new generation as a separate database record
    songsStore.unshift(...songsCreated);
    savePersistentDatabase();

    generationJobs.set(jobId, {
      jobId,
      requestId,
      status: 'succeeded',
      createdAt: generationJobs.get(jobId)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: songsCreated,
    });

    recordCreditTx(
      -creditCost,
      'song_generation',
      `Muziek creatie (${provider}): "${cleanTitle}" (${generateDualVersions ? 'Dual Mix A/B' : 'Single Mix'}) [${requestId.slice(0, 12)}]`
    );

    for (const s of songsCreated) {
      console.log(
        `[SONIQ_GEN_COMPLETED] requestId=${s.requestId} jobId=${jobId} provider=${s.provider} songId=${s.id} generationId=${s.generationId} seed=${s.seed} fp=${s.audioFingerprint} status=${s.generationStatus} audioUrl="${s.audioUrl}"`
      );
    }

    res.json({
      success: true,
      requestId,
      jobId,
      status: 'succeeded',
      songs: songsCreated,
      creditsRemaining: userCredits,
      message: `Generated ${songsCreated.length} unique song variation(s) via ${provider}!`,
    });
  } catch (error: unknown) {
    console.log('[SONIQ_GEN_STATUS] Music generation notice');
    res.status(200).json({
      success: false,
      error: 'GENERATION_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API: Songs CRUD
app.get('/api/songs', (_req: Request, res: Response) => {
  res.json({ success: true, songs: songsStore });
});

app.post('/api/songs', (req: Request, res: Response) => {
  const song: StoredSong = req.body;
  if (!song.id || !song.title) {
    res.status(400).json({ error: 'Song id and title are required' });
    return;
  }
  const existingIndex = songsStore.findIndex((s) => s.id === song.id);
  if (existingIndex >= 0) {
    // Preserve server-generated audioUrl, generationId, seed, and audioFingerprint if client sends empty string
    const prev = songsStore[existingIndex];
    songsStore[existingIndex] = {
      ...prev,
      ...song,
      generationId: song.generationId || prev.generationId,
      requestId: song.requestId || prev.requestId,
      seed: song.seed || prev.seed,
      audioFingerprint: song.audioFingerprint || prev.audioFingerprint,
      audioUrl: song.audioUrl && song.audioUrl.trim() !== '' ? song.audioUrl : prev.audioUrl,
    };
    savePersistentDatabase();
    res.json({ success: true, song: songsStore[existingIndex] });
  } else {
    songsStore.unshift(song);
    savePersistentDatabase();
    res.json({ success: true, song });
  }
});

app.patch('/api/songs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const index = songsStore.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }
  const prev = songsStore[index];
  // If studio parameters (BPM, DJ intro/outro, stemMix, lyrics) changed, assign a fresh revision generationId & seed
  const studioChanged =
    updates.bpm !== undefined ||
    updates.djIntroStyle !== undefined ||
    updates.djOutroStyle !== undefined ||
    updates.stemMix !== undefined ||
    updates.camelotKey !== undefined ||
    updates.lyrics !== undefined;

  const nextGenerationId = studioChanged ? `gen-${crypto.randomUUID()}` : prev.generationId;
  const nextSeed = studioChanged ? crypto.randomInt(100000000, 999999999) : prev.seed;

  const updatedSong: StoredSong = {
    ...prev,
    ...updates,
    generationId: nextGenerationId,
    seed: nextSeed,
    audioUrl: studioChanged
      ? `/api/music/stream/${encodeURIComponent(id)}?genId=${encodeURIComponent(nextGenerationId)}&seed=${nextSeed}`
      : updates.audioUrl || prev.audioUrl,
  };

  if (studioChanged) {
    const { fingerprint } = synthesizeServerWavBuffer(updatedSong);
    updatedSong.audioFingerprint = fingerprint;
  }

  songsStore[index] = updatedSong;
  savePersistentDatabase();
  res.json({ success: true, song: songsStore[index] });
});

app.delete('/api/songs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  songsStore = songsStore.filter((s) => s.id !== id);
  playlistsStore = playlistsStore.map((pl) => ({
    ...pl,
    songIds: pl.songIds.filter((sId) => sId !== id),
  }));
  savePersistentDatabase();
  res.json({ success: true, id });
});

// API: Playlists CRUD
app.get('/api/playlists', (_req: Request, res: Response) => {
  res.json({ success: true, playlists: playlistsStore });
});

app.post('/api/playlists', (req: Request, res: Response) => {
  const { name, description = '', songIds = [] } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Playlist name is required' });
    return;
  }
  const newPlaylist: StoredPlaylist = {
    id: `playlist-${crypto.randomUUID()}`,
    name,
    description,
    songIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  playlistsStore.unshift(newPlaylist);
  savePersistentDatabase();
  res.json({ success: true, playlist: newPlaylist });
});

app.patch('/api/playlists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const index = playlistsStore.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Playlist not found' });
    return;
  }
  playlistsStore[index] = {
    ...playlistsStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  savePersistentDatabase();
  res.json({ success: true, playlist: playlistsStore[index] });
});

app.delete('/api/playlists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  playlistsStore = playlistsStore.filter((p) => p.id !== id);
  savePersistentDatabase();
  res.json({ success: true, id });
});

// API: Settings & External API config
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({
    success: true,
    settings: {
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      lyriaFullModel: 'lyria-3-pro-preview',
      lyriaClipModel: 'lyria-3-clip-preview',
      hasReplicateKey: Boolean(serverSettings.replicateApiKey),
      hasElevenlabsKey: Boolean(serverSettings.elevenlabsApiKey),
      hasSunoKey: Boolean(serverSettings.sunoApiKey),
      hasSupabaseUrl: Boolean(serverSettings.supabaseUrl),
      hasSupabaseKey: Boolean(serverSettings.supabaseAnonKey),
      defaultProvider: serverSettings.defaultProvider,
      audioQuality: serverSettings.audioQuality,
      customApiUrl: serverSettings.customApiUrl,
      supabaseUrl: serverSettings.supabaseUrl,
    },
  });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updates: Partial<ServerSettings> = req.body;
  serverSettings = {
    ...serverSettings,
    ...updates,
  };
  res.json({
    success: true,
    message: 'Server settings updated securely',
  });
});

// API: Test Supabase connection
app.post('/api/supabase/test', async (req: Request, res: Response) => {
  const { url, anonKey } = req.body;
  if (!url || !anonKey) {
    res.status(400).json({ error: 'Both Supabase URL and Anon Key are required.' });
    return;
  }
  try {
    const pingRes = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
      },
    });
    if (pingRes.ok) {
      res.json({ success: true, message: 'Successfully connected to Supabase project!' });
    } else {
      res.status(pingRes.status).json({
        success: false,
        message: `Supabase returned status ${pingRes.status}. Verify your project URL and Anon key.`,
      });
    }
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to reach Supabase endpoint',
    });
  }
});

// Serve frontend with Vite in dev, or static in production
const startServer = async () => {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 SONIQ AI Music Generator listening on http://localhost:${port}`);
    // Non-blocking background pre-warm of initial seed tracks after port 3000 is ready
    const toWarm = songsStore.filter((s) => !s.provider || s.provider === 'internal-synth').slice(0, 6);
    toWarm.forEach((s, idx) => {
      setTimeout(() => {
        try {
          const { fingerprint } = synthesizeServerWavBuffer(s);
          s.audioFingerprint = fingerprint;
        } catch {
          // Ignore pre-warm errors
        }
      }, 250 * (idx + 1));
    });
  });
};

startServer();
