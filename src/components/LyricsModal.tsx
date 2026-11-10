import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { X, Copy, Check, Music, Sparkles } from 'lucide-react';

export const LyricsModal: React.FC = () => {
  const { lyricsModalSong, closeLyricsModal } = useMusic();
  const [copied, setCopied] = useState(false);

  if (!lyricsModalSong) return null;

  const copyLyrics = () => {
    if (lyricsModalSong.lyrics) {
      navigator.clipboard.writeText(lyricsModalSong.lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#110E1C] border border-purple-500/20 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-900/30 bg-purple-950/20 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img
              src={lyricsModalSong.coverArtUrl}
              alt={lyricsModalSong.title}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-lg border border-purple-500/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  {lyricsModalSong.genre}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  {lyricsModalSong.bpm} BPM
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white mt-0.5 sm:mt-1 truncate">
                {lyricsModalSong.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lyricsModalSong.lyrics && (
              <button
                onClick={copyLyrics}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-medium transition-colors"
                title="Copy Lyrics"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button
              onClick={closeLyricsModal}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lyrics Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-sm md:text-base leading-relaxed text-slate-200">
          {lyricsModalSong.lyrics ? (
            <div className="whitespace-pre-line font-mono text-xs md:text-sm text-slate-300 bg-purple-950/20 p-5 rounded-xl border border-purple-500/10">
              {lyricsModalSong.lyrics}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Music className="w-10 h-10 mx-auto mb-3 text-purple-400 opacity-50" />
              <p className="font-medium text-slate-300">Instrumental Track</p>
              <p className="text-xs text-slate-500 mt-1">
                This track was composed as an instrumental piece without vocal lyrics.
              </p>
            </div>
          )}

          {/* Song Generation Prompt Detail */}
          <div className="mt-6 pt-4 border-t border-purple-900/20">
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Creation Prompt
            </h4>
            <p className="text-xs text-slate-400 bg-black/30 p-3 rounded-lg border border-purple-900/20 font-sans">
              "{lyricsModalSong.prompt}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
