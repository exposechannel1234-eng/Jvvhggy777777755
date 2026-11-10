import React, { useState, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { api } from '../services/api';
import { MusicProvider } from '../types';
import {
  Settings,
  Key,
  Database,
  Sliders,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  RefreshCw,
  Sparkles,
  Zap,
  Coins,
  Gift,
  ArrowUpRight,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { userProfile, credits, openCreditsModal, canClaimDaily, claimDailyBonus } = useMusic();
  const [bonusClaiming, setBonusClaiming] = useState(false);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);

  // Settings form state
  const [replicateKey, setReplicateKey] = useState('');
  const [sunoKey, setSunoKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [defaultProvider, setDefaultProvider] = useState<MusicProvider>('internal-synth');
  const [audioQuality, setAudioQuality] = useState<'standard' | 'high' | 'ultra'>('high');

  // Status indicators from server
  const [serverStatus, setServerStatus] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase test status
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);

  // Load current configuration from server
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getSettings();
        setServerStatus(data);
        if (data.defaultProvider) setDefaultProvider(data.defaultProvider as MusicProvider);
        if (data.audioQuality) setAudioQuality(data.audioQuality as 'standard' | 'high' | 'ultra');
        if (typeof data.supabaseUrl === 'string') setSupabaseUrl(data.supabaseUrl);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchStatus();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateSettings({
        replicateApiKey: replicateKey || undefined,
        sunoApiKey: sunoKey || undefined,
        elevenlabsApiKey: elevenlabsKey || undefined,
        supabaseUrl: supabaseUrl || undefined,
        supabaseAnonKey: supabaseAnonKey || undefined,
        defaultProvider,
        audioQuality,
      });

      const updated = await api.getSettings();
      setServerStatus(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseTestResult({
        success: false,
        message: 'Please enter both Supabase Project URL and Anon API Key.',
      });
      return;
    }

    setIsTestingSupabase(true);
    setSupabaseTestResult(null);

    try {
      const res = await api.testSupabase(supabaseUrl.trim(), supabaseAnonKey.trim());
      setSupabaseTestResult(res);
    } catch (err: unknown) {
      setSupabaseTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const copySupabaseSchema = () => {
    const schemaSql = `-- Supabase Schema for SONIQ AI
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'Free Creator',
  credits_remaining INT DEFAULT 450,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.songs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  lyrics TEXT,
  genre TEXT NOT NULL,
  bpm INT NOT NULL,
  mood TEXT NOT NULL,
  vocal_mode TEXT NOT NULL,
  language TEXT DEFAULT 'English',
  is_instrumental BOOLEAN DEFAULT false,
  duration INT DEFAULT 32,
  audio_url TEXT,
  cover_art_url TEXT,
  version TEXT DEFAULT 'A',
  provider TEXT DEFAULT 'internal-synth',
  is_favorite BOOLEAN DEFAULT false,
  playlist_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.playlists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  song_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
`;
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-36">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-purple-400" />
          <span>Studio Settings & API Configuration</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure external music generation providers, Supabase database integration, and audio rendering settings.
        </p>
      </div>

      {/* Studio Credits & Subscription Plan Overview */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-5 border border-purple-500/30 bg-gradient-to-br from-[#130E26] via-[#0E0B1B] to-[#0A0714] shadow-xl shadow-purple-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/30 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">Studio Credits & Abonnement</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {userProfile.plan}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gebruik credits voor het genereren van tracks, album artwork en lyrics.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreditsModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>Credits Opwaarderen / Pakketten</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Balance Grid & Daily Bonus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Balance */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-purple-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Huidig Saldo</span>
              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{credits}</span>
              <span className="text-xs text-purple-400 font-semibold">Credits</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              Goed voor ~{Math.floor(credits / 10)} Dual Mixes of {Math.floor(credits / 5)} Tracks
            </div>
          </div>

          {/* Daily Bonus Card */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-purple-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Dagelijkse Creator Bonus</span>
              <Gift className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-base font-bold text-white mb-1">
                {canClaimDaily ? '+25 Gratis Credits Klaar!' : 'Bonus Actief'}
              </div>
              <p className="text-[11px] text-slate-400">
                {canClaimDaily
                  ? 'Claim vandaag je gratis credits om direct verder te componeren.'
                  : 'Volgende gratis drop is beschikbaar over minder dan 24 uur.'}
              </p>
            </div>
            <div className="mt-3">
              {canClaimDaily ? (
                <button
                  type="button"
                  onClick={async () => {
                    setBonusClaiming(true);
                    setBonusMsg(null);
                    try {
                      const res = await claimDailyBonus();
                      setBonusMsg(res.message);
                    } finally {
                      setBonusClaiming(false);
                      setTimeout(() => setBonusMsg(null), 3000);
                    }
                  }}
                  disabled={bonusClaiming}
                  className="w-full py-1.5 px-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs flex items-center justify-center gap-1 shadow-md shadow-yellow-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>{bonusClaiming ? 'Claimen...' : 'Claim +25 Credits Nu'}</span>
                </button>
              ) : (
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Reeds geclaimd voor vandaag
                </div>
              )}
            </div>
          </div>

          {/* Usage Rates Quick Summary */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-purple-500/20 flex flex-col justify-between text-xs">
            <span className="text-slate-400 mb-2 font-medium">Standaard Tarieven</span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Song Generatie (Dual):</span>
                <span className="font-mono font-bold text-purple-300">10 CR</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Song Generatie (Single):</span>
                <span className="font-mono font-bold text-purple-300">5 CR</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>AI Lyrics Assistant:</span>
                <span className="font-mono font-bold text-pink-300">2 CR</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Playback & WAV Download:</span>
                <span className="font-mono font-bold text-emerald-400">0 CR (Gratis)</span>
              </div>
            </div>
          </div>
        </div>

        {bonusMsg && (
          <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>{bonusMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: AI Music Generation Providers */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-5 border border-purple-500/25">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">External AI Music Providers</h2>
                <p className="text-xs text-slate-400">
                  Connect Suno API, Replicate MusicGen, or ElevenLabs for external cloud rendering.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Keys Protected Server-Side</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Built-in Engine Status */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    SONIQ High-Fidelity Studio Engine (Built-in)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time polyphonic synth, multi-channel drum machines, stem arrangement & downloadable 16-bit WAV.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Active & Ready
              </span>
            </div>

            {/* Suno / GoAPI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <span>Suno API / GoAPI Key</span>
                  {serverStatus.hasSunoKey ? (
                    <span className="text-[10px] text-emerald-400 font-mono">● Configured</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono">○ Not set</span>
                  )}
                </label>
              </div>
              <input
                type="password"
                value={sunoKey}
                onChange={(e) => setSunoKey(e.target.value)}
                placeholder={serverStatus.hasSunoKey ? '••••••••••••••••••••••••' : 'Enter your Suno API token'}
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Replicate MusicGen */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <span>Replicate API Token (MusicGen / Meta Audio)</span>
                  {serverStatus.hasReplicateKey ? (
                    <span className="text-[10px] text-emerald-400 font-mono">● Configured</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono">○ Not set</span>
                  )}
                </label>
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>Get Replicate Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={replicateKey}
                onChange={(e) => setReplicateKey(e.target.value)}
                placeholder={serverStatus.hasReplicateKey ? '••••••••••••••••••••••••' : 'r8_...'}
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* ElevenLabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <span>ElevenLabs API Key (Music Generation)</span>
                  {serverStatus.hasElevenlabsKey ? (
                    <span className="text-[10px] text-emerald-400 font-mono">● Configured</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono">○ Not set</span>
                  )}
                </label>
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>ElevenLabs Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={elevenlabsKey}
                onChange={(e) => setElevenlabsKey(e.target.value)}
                placeholder={serverStatus.hasElevenlabsKey ? '••••••••••••••••••••••••' : 'Enter ElevenLabs API Key'}
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Supabase Database & Persistence */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-5 border border-purple-500/25">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Supabase Cloud Database</h2>
                <p className="text-xs text-slate-400">
                  Connect Supabase to persist user profiles, track metadata, lyrics, and playlists.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={copySupabaseSchema}
              className="text-xs text-purple-300 hover:text-white px-3 py-1.5 rounded-lg bg-purple-900/30 border border-purple-500/20 flex items-center gap-1.5 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder={serverStatus.hasSupabaseKey ? '••••••••••••••••••••••••' : 'eyJhbGciOiJIUzI1Ni...'}
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-semibold border border-purple-500/30 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isTestingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>Test Supabase Connection</span>
            </button>

            {supabaseTestResult && (
              <span
                className={`text-xs flex items-center gap-1.5 font-medium ${
                  supabaseTestResult.success ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {supabaseTestResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {supabaseTestResult.message}
              </span>
            )}
          </div>
        </div>

        {/* Section 3: Audio Preferences */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-5 border border-purple-500/25">
          <div className="flex items-center gap-3 border-b border-purple-900/30 pb-4">
            <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Audio Output & Studio Quality</h2>
              <p className="text-xs text-slate-400">
                Configure sample rates, download formats, and default creator presets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Download Format & Bitrate
              </label>
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value as 'standard' | 'high' | 'ultra')}
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                <option value="high">16-bit PCM WAV (44.1 kHz Studio Master - Recommended)</option>
                <option value="ultra">24-bit PCM WAV (48 kHz Broadcast Master)</option>
                <option value="standard">320kbps MP3 Compressed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Generator Engine
              </label>
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value as MusicProvider)}
                className="w-full bg-[#0E0C18] border border-purple-500/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                <option value="internal-synth">⚡ SONIQ Studio Real-time DSP Engine (Fast & Free)</option>
                <option value="lyria-3-pro-preview">🔥 Google Lyria 3 Pro Preview (Newest Google Music Model)</option>
                <option value="lyria-3-clip-preview">✨ Google Lyria 3 Clip Preview (Newest 30s Music Model)</option>
                <option value="suno-v4">☀️ Suno v4 Architecture (Cloud Music API)</option>
                <option value="replicate-musicgen">🧠 Meta MusicGen Large v2 (Replicate)</option>
                <option value="elevenlabs">🎙️ ElevenLabs Music Engine v2</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30">
          <div className="text-xs text-slate-400">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span>Changes take effect immediately on next song generation.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/40 disabled:opacity-50 transition-all"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
