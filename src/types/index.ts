export type Genre =
  | 'Deep House'
  | 'Afro House'
  | 'Latin House'
  | 'Tech House'
  | 'Melodic Techno'
  | 'Progressive House'
  | 'EDM'
  | 'Pop'
  | 'Hip Hop'
  | 'Rock'
  | 'R&B'
  | 'Cyberpunk'
  | 'Lo-Fi'
  | 'Synthwave'
  | 'Reggaeton'
  | 'Ambient';

export type Mood =
  | 'Energetic'
  | 'Euphoric'
  | 'Melancholic'
  | 'Chill'
  | 'Dark & Gritty'
  | 'Romantic'
  | 'Uplifting'
  | 'Mysterious'
  | 'Aggressive'
  | 'Dreamy';

export type VocalMode = 'male' | 'female' | 'duet' | 'instrumental';

export type DJIntroStyle =
  | 'none'
  | '16-bar-percussive'
  | '32-bar-club-grid'
  | 'filtered-sub-roll';

export type DJOutroStyle =
  | 'none'
  | '16-bar-dj-loop'
  | '32-bar-extended'
  | 'dub-delay-strip';

export type CamelotKey =
  | '8A (A Minor)'
  | '9A (E Minor)'
  | '7A (D Minor)'
  | '6A (G Minor)'
  | '4A (F Minor)'
  | '5A (C Minor)'
  | '10A (B Minor)'
  | '8B (C Major)'
  | '11B (A Major)';

export interface SongSection {
  id: string;
  type:
    | 'dj_intro'
    | 'groove_verse'
    | 'breakdown'
    | 'buildup'
    | 'main_drop'
    | 'vocal_bridge'
    | 'second_drop'
    | 'dj_outro';
  label: string;
  bars: 8 | 16 | 32;
  energy: number; // 10 - 100
  description?: string;
}

export interface StemMix {
  kickSub: number; // 0 - 100
  percussion: number; // 0 - 100
  synthsChords: number; // 0 - 100
  vocalsChants: number; // 0 - 100
  sidechainPump: number; // 0 - 100
  filterCutoff: number; // 20 - 100
}

export type MusicProvider =
  | 'lyria-3.5'
  | 'lyria-3-pro-preview'
  | 'lyria-3-clip-preview'
  | 'suno-v4'
  | 'replicate-musicgen'
  | 'elevenlabs'
  | 'internal-synth'
  | 'gemini-lyria'
  | 'suno-api'
  | 'custom-api';

export interface Song {
  id: string;
  generationId?: string;
  requestId?: string;
  seed?: number;
  audioFingerprint?: string;
  generationStatus?: 'queued' | 'processing' | 'succeeded' | 'failed';
  title: string;
  prompt: string;
  lyrics?: string;
  genre: Genre;
  bpm: number;
  mood: Mood;
  vocalMode: VocalMode;
  language: string;
  vocalLanguages?: string[];
  vocalStyle?: string;
  isInstrumental: boolean;
  duration: number; // in seconds
  audioUrl: string;
  coverArtUrl: string;
  createdAt: string;
  version?: 'A' | 'B';
  provider: MusicProvider;
  isFavorite?: boolean;
  playlistIds?: string[];
  extendedFromId?: string;
  stemsAvailable?: boolean;
  camelotKey?: CamelotKey;
  djIntroStyle?: DJIntroStyle;
  djOutroStyle?: DJOutroStyle;
  arrangement?: SongSection[];
  stemMix?: StemMix;
  mixType?: 'Original Club Mix' | 'Extended DJ Mix' | 'VIP Dub Edit' | 'Radio Vocal Mix';
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArtUrl?: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateMusicRequest {
  requestId?: string;
  seed?: number;
  title: string;
  prompt: string;
  lyrics?: string;
  genre: Genre;
  bpm: number;
  mood: Mood;
  vocalMode: VocalMode;
  language: string;
  vocalLanguages?: string[];
  vocalStyle?: string;
  isInstrumental: boolean;
  provider: MusicProvider;
  generateDualVersions?: boolean;
  extendedFromId?: string;
  extendTimestamp?: number;
  camelotKey?: CamelotKey;
  djIntroStyle?: DJIntroStyle;
  djOutroStyle?: DJOutroStyle;
  arrangement?: SongSection[];
  stemMix?: StemMix;
  mixType?: 'Original Club Mix' | 'Extended DJ Mix' | 'VIP Dub Edit' | 'Radio Vocal Mix';
}

export interface GenerateLyricsRequest {
  genre: Genre;
  mood: Mood;
  theme: string;
  language: string;
  vocalPerspective: 'male' | 'female' | 'duet';
  title?: string;
}

export interface GeneratedLyricsResponse {
  title: string;
  structure: {
    verse1: string;
    chorus1: string;
    verse2: string;
    chorus2: string;
    bridge: string;
    outro: string;
  };
  fullLyrics: string;
  tags: string[];
}

export interface ApiSettingsConfig {
  replicateApiKey?: string;
  elevenlabsApiKey?: string;
  sunoApiKey?: string;
  customApiUrl?: string;
  customApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  defaultProvider: MusicProvider;
  audioQuality: 'standard' | 'high' | 'ultra';
}

export interface CreditTransaction {
  id: string;
  amount: number; // e.g. -10, +25, +250
  type: 'song_generation' | 'lyrics_generation' | 'prompt_enhancement' | 'daily_bonus' | 'purchase' | 'refund';
  description: string;
  createdAt: string;
  balanceAfter: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceEur: number;
  popular?: boolean;
  perks: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'Free Creator' | 'Pro Studio' | 'Ultra Unlimited';
  creditsRemaining: number;
  lastDailyBonusClaimed?: string;
}
