import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Genre, Mood, GeneratedLyricsResponse } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  X,
  RefreshCw,
  Copy,
  Check,
  Send,
  Wand2,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react';

interface LyricsAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLyrics: (lyrics: string, title?: string) => void;
  initialGenre?: Genre;
  initialMood?: Mood;
}

const GENRES: Genre[] = [
  'Pop',
  'EDM',
  'Deep House',
  'Latin House',
  'Afro House',
  'Tech House',
  'Hip Hop',
  'Rock',
  'R&B',
  'Cyberpunk',
  'Lo-Fi',
  'Synthwave',
  'Reggaeton',
  'Ambient',
];

const MOODS: Mood[] = [
  'Energetic',
  'Euphoric',
  'Melancholic',
  'Chill',
  'Dark & Gritty',
  'Romantic',
  'Uplifting',
  'Mysterious',
  'Aggressive',
  'Dreamy',
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'German',
  'Japanese',
  'Korean',
  'Italian',
  'Arabic',
];

export const LyricsAssistantModal: React.FC<LyricsAssistantModalProps> = ({
  isOpen,
  onClose,
  onInsertLyrics,
  initialGenre = 'Deep House',
  initialMood = 'Euphoric',
}) => {
  const { credits, openCreditsModal, refreshCredits } = useMusic();

  const [genre, setGenre] = useState<Genre>(initialGenre);
  const [mood, setMood] = useState<Mood>(initialMood);
  const [theme, setTheme] = useState('');
  const [language, setLanguage] = useState('English');
  const [vocalPerspective, setVocalPerspective] = useState<'male' | 'female' | 'duet'>('female');
  const [titleIdea, setTitleIdea] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedLyricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Editable sections
  const [verse1, setVerse1] = useState('');
  const [chorus1, setChorus1] = useState('');
  const [verse2, setVerse2] = useState('');
  const [chorus2, setChorus2] = useState('');
  const [bridge, setBridge] = useState('');
  const [outro, setOutro] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!theme.trim()) {
      setError('Please provide a song theme or topic (e.g. "Dancing under city rain in Tokyo").');
      return;
    }

    if (credits < 2) {
      openCreditsModal();
      setError(`Onvoldoende credits: voor de AI Lyrics Assistant heb je 2 credits nodig (huidig saldo: ${credits}). Waardeer je credits op of claim de dagelijkse bonus.`);
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await api.generateLyrics({
        genre,
        mood,
        theme: theme.trim(),
        language,
        vocalPerspective,
        title: titleIdea.trim() || undefined,
      });

      setGeneratedResult(res);
      setVerse1(res.structure.verse1 || '');
      setChorus1(res.structure.chorus1 || '');
      setVerse2(res.structure.verse2 || '');
      setChorus2(res.structure.chorus2 || '');
      setBridge(res.structure.bridge || '');
      setOutro(res.structure.outro || '');
      await refreshCredits();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate lyrics. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const constructFullLyrics = () => {
    return `[Verse 1]\n${verse1}\n\n[Chorus]\n${chorus1}\n\n[Verse 2]\n${verse2}\n\n[Chorus]\n${chorus2}\n\n[Bridge]\n${bridge}\n\n[Outro]\n${outro}`;
  };

  const handleApply = () => {
    const full = constructFullLyrics();
    onInsertLyrics(full, generatedResult?.title || titleIdea);
    onClose();
  };

  const handleCopy = () => {
    const full = constructFullLyrics();
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#110E1C] border border-purple-500/30 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] h-[92vh] sm:h-auto safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-purple-900/30 bg-purple-950/20 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                AI Lyrics Assistant
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Craft structured verses & choruses with rhyming flow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-xl bg-purple-950/10 border border-purple-500/15">
            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as Genre)}
                className="w-full bg-[#181427] border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as Mood)}
                className="w-full bg-[#181427] border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {MOODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Vocal Perspective */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Vocal Perspective
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#181427] p-1 rounded-lg border border-purple-500/30">
                {(['female', 'male', 'duet'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVocalPerspective(v)}
                    className={`text-[11px] capitalize py-1 rounded font-medium transition-colors ${
                      vocalPerspective === v
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#181427] border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme & Title Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Song Theme / Story Concept <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Late night highway drive, moving past an old heartbreak, electric neon skies..."
                className="w-full bg-[#181427] border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Song Title (Optional)
              </label>
              <input
                type="text"
                value={titleIdea}
                onChange={(e) => setTitleIdea(e.target.value)}
                placeholder="e.g. Endless Frequencies"
                className="w-full bg-[#181427] border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Generate Button & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Composing Hit Lyrics...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Structured Lyrics (2 Credits)</span>
                  </>
                )}
              </button>
              {generatedResult && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-xs font-medium border border-purple-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate (2 CR)</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {generatedResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Lyrics'}
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Insert into Song</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  Saldo: <strong className="text-white">{credits} CR</strong>
                </span>
                <button
                  type="button"
                  onClick={openCreditsModal}
                  className="text-purple-400 hover:underline cursor-pointer"
                >
                  + Opwaarderen
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Structured Lyrics Sections Editor */}
          {generatedResult && (
            <div className="space-y-4 pt-4 border-t border-purple-900/30">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Generated Structure & Live Editor
                </h4>
                <div className="flex items-center gap-1.5">
                  {generatedResult.tags?.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Verse 1 */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-purple-900/30">
                  <span className="text-[11px] font-mono font-bold text-purple-400 block mb-1">
                    [Verse 1]
                  </span>
                  <textarea
                    rows={4}
                    value={verse1}
                    onChange={(e) => setVerse1(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                </div>

                {/* Chorus 1 */}
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <span className="text-[11px] font-mono font-bold text-pink-400 block mb-1">
                    [Chorus 1 - Hook]
                  </span>
                  <textarea
                    rows={4}
                    value={chorus1}
                    onChange={(e) => setChorus1(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                </div>

                {/* Verse 2 */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-purple-900/30">
                  <span className="text-[11px] font-mono font-bold text-purple-400 block mb-1">
                    [Verse 2]
                  </span>
                  <textarea
                    rows={4}
                    value={verse2}
                    onChange={(e) => setVerse2(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                </div>

                {/* Chorus 2 */}
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                  <span className="text-[11px] font-mono font-bold text-pink-400 block mb-1">
                    [Chorus 2]
                  </span>
                  <textarea
                    rows={4}
                    value={chorus2}
                    onChange={(e) => setChorus2(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                </div>

                {/* Bridge */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-purple-900/30">
                  <span className="text-[11px] font-mono font-bold text-amber-400 block mb-1">
                    [Bridge - Climax]
                  </span>
                  <textarea
                    rows={4}
                    value={bridge}
                    onChange={(e) => setBridge(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                </div>

                {/* Outro */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-purple-900/30">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 block mb-1">
                    [Outro - Fade]
                  </span>
                  <textarea
                    rows={4}
                    value={outro}
                    onChange={(e) => setOutro(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
