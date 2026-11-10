import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { Genre } from '../types';
import {
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  Compass,
  Disc,
  Heart,
  Wand2,
  Sliders,
  Radio,
  Globe2,
  Layers,
  Gauge,
  Music2,
  CheckCircle2,
} from 'lucide-react';

const CLUB_ENGINES: {
  genre: Genre;
  desc: string;
  bpm: number;
  camelot: string;
  subInfo: string;
  bg: string;
  icon: string;
  prompt: string;
}[] = [
  {
    genre: 'Afro House',
    desc: 'Polyrhythmische conga & djembe percussie, log-drum sub-bass en hypnotische Yoruba/Swahili & Spaanse chants.',
    bpm: 122,
    camelot: '8A',
    subInfo: '32-Bar Tribal DJ Intro • Warm Sub',
    bg: 'from-amber-900/50 via-[#151026] to-purple-950/60',
    icon: '🥁',
    prompt: 'Hypnotic sunset Afro House groove with polyrhythmic djembe & shakers, warm log-drum sub bass, marimba chords and spiritual Yoruba & Spanish vocal chants, 32-bar DJ intro',
  },
  {
    genre: 'Deep House',
    desc: 'Zijdezachte minor-9th Rhodes akkoorden, diepe rollende analoge sub-bass en soulvolle late-night vocalen.',
    bpm: 124,
    camelot: '9A',
    subInfo: '16-Bar Filtered Roll • Club Master',
    bg: 'from-indigo-950/70 via-[#121024] to-purple-950/60',
    icon: '🎧',
    prompt: 'Lush late-night Deep House club cut with warm minor 9th Rhodes chords, rolling sidechained sub bass, crisp 909 hats and bilingual English & French velvet vocals',
  },
  {
    genre: 'Latin House',
    desc: 'Energieke piano montuno riffs, live timbales, koperblazers en opzwepende Spaans/Portugese club hooks.',
    bpm: 126,
    camelot: '7A',
    subInfo: '16-Bar Percussive Mix-In • Ibiza Peak',
    bg: 'from-rose-950/60 via-[#171022] to-purple-950/60',
    icon: '🎺',
    prompt: 'Peak-time Ibiza Latin House anthem with syncopated piano montuno riffs, live timbales & congas, brass stabs, rolling tech-latin bassline and fiery Spanish/Portuguese club vocals',
  },
  {
    genre: 'Tech House',
    desc: 'Strakke warehouse kicks, rollende basslines, scherpe vocal chops en hoogspannings spanningsbogen voor de mainstage.',
    bpm: 128,
    camelot: '4A',
    subInfo: '32-Bar Club Grid • Heavy Sidechain',
    bg: 'from-emerald-950/60 via-[#0F1722] to-purple-950/60',
    icon: '⚡',
    prompt: 'Driving warehouse Tech House weapon with punchy transient kick, rolling sub-bass groove, laser synth stabs, crisp 909 open hi-hats and bilingual Spanish/English vocal chops',
  },
  {
    genre: 'Melodic Techno',
    desc: 'Hypnotiserende Moog arpeggio’s, filmische spanningsopbouw en diepe afterhours resonantie.',
    bpm: 125,
    camelot: '6A',
    subInfo: 'Extended Breakdown • Analog Arp',
    bg: 'from-cyan-950/60 via-[#101526] to-purple-950/60',
    icon: '🌌',
    prompt: 'Afterhours Melodic Techno journey with hypnotic analog Moog arpeggios, sweeping atmospheric pads, colossal breakdown and driving 125 BPM club groove',
  },
  {
    genre: 'Progressive House',
    desc: 'Euforische gelaagde synth-leads, lange harmonische reizen en strakke DJ-vriendelijke mix-outs.',
    bpm: 126,
    camelot: '10A',
    subInfo: '32-Bar Intro/Outro • Wide Stereo',
    bg: 'from-violet-950/60 via-[#151028] to-pink-950/50',
    icon: '🎚️',
    prompt: 'Euphoric Progressive House club journey with evolving plucked synth arpeggios, lush emotional breakdown, deep rolling bass and 32-bar beatmatched DJ intro and outro',
  },
];

const STUDIO_DIFFERENTIATORS = [
  {
    icon: Disc,
    badge: 'GEEN STANDAARD AI-GENERATOR',
    title: 'Professionele Elektronische & Club Architectuur',
    desc: 'Gebouwd voor producers en DJ’s: strakke 4/4 kick-sub fase-uitlijning, echte sidechain-compressie en club-ready 44.1 kHz WAV-masters in plaats van generieke pop-deuntjes.',
    accent: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
  },
  {
    icon: Music2,
    badge: '4 SPECIALISTISCHE GROOVE ENGINES',
    title: 'Deep, Latin, Afro & Tech House DNA',
    desc: 'Authentieke genre-engines met echte polyritmische djembe/conga patronen (Afro), piano montuno’s & timbales (Latin), minor-9th Rhodes (Deep) en rollende warehouse sub-bassen (Tech).',
    accent: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
  },
  {
    icon: Radio,
    badge: 'CDJ & REKORDBOX READY',
    title: 'Uitgebreide 16 & 32-Bar DJ Intro’s en Outro’s',
    desc: 'Kies voor 16- of 32-bar percussieve mix-ins en mix-outs zonder botsende melodieën, zodat je elk gegenereerd nummer naadloos kunt beatmatchen in je DJ-set.',
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
  },
  {
    icon: Globe2,
    badge: 'MULTI-LANGUAGE VOCAL ENGINE',
    title: 'Meertalige Zang & Club Chants',
    desc: 'Combineer moeiteloos Spaans, Engels, Yoruba/Swahili Afro-chants, Portugees, Frans of Nederlands binnen één track — van hypnotiserende tribal hooks tot rauwe Tech House vocal chops.',
    accent: 'text-pink-400 border-pink-500/30 bg-pink-950/20',
  },
  {
    icon: Gauge,
    badge: 'VOLLEDIGE REGIE',
    title: 'Exacte BPM, Camelot Key & Songstructuur',
    desc: 'Bepaal op de BPM nauwkeurig het tempo, kies je harmonische Camelot-toonsoort (8A, 9A, 4A) en bouw zelf de 8/16/32-bar blokken van DJ Intro tot Breakdown en Main Drop.',
    accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
  },
  {
    icon: Sliders,
    badge: 'POST-GENERATIE TRACK STUDIO',
    title: 'Nummers Achteraf Verder Bewerken & Remixen',
    desc: 'Open elk nummer in de Track Studio om de 4-stem balans (Kick/Sub, Percussie, Synths, Vocals), DJ-intro/outro, BPM en songstructuur achteraf aan te passen of als VIP Extended Edit te renderen.',
    accent: 'text-violet-400 border-violet-500/30 bg-violet-950/20',
  },
];

export const HomeView: React.FC = () => {
  const {
    songs,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    setActiveTab,
    toggleFavorite,
    openStudioModal,
    setPrefillStudio,
  } = useMusic();
  const [quickPrompt, setQuickPrompt] = useState('');

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPrompt.trim()) {
      setPrefillStudio(undefined, quickPrompt.trim());
    }
    setActiveTab('create');
  };

  const handleGenreClick = (genre: Genre, defaultPrompt: string) => {
    setPrefillStudio(genre, defaultPrompt);
    setActiveTab('create');
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-10 pb-36">
      {/* Club Producer Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-5 sm:p-8 md:p-11 border border-purple-500/30 bg-gradient-to-br from-[#16102B] via-[#0B0914] to-[#06050B] shadow-[0_0_60px_-12px_rgba(147,51,234,0.35)]">
        {/* Ambient Studio Glow */}
        <div className="absolute top-0 right-0 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 text-[11px] sm:text-xs font-bold tracking-wide">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>PRO ELECTRONIC & CLUB MUSIC PRODUCTION STUDIO</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                CDJ-READY
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
              Geen Generieke AI-Pop.{' '}
              <span className="neon-gradient-text">
                Pure Elektronische Club- & DJ-Producties.
              </span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl">
              Speciaal ontwikkeld voor <strong className="text-white">Deep House, Afro House, Latin House en Tech House</strong>.
              Genereer tracks met <strong className="text-purple-300">16/32-bar beatmatched DJ-intro’s & outro’s</strong>,{' '}
              <strong className="text-pink-300">meertalige vocalen</strong>, exacte <strong className="text-emerald-300">BPM & Camelot-key regie</strong> en bewerk elk nummer achteraf in de 4-Stem Track Studio.
            </p>

            {/* Quick Club Prompt Input Box */}
            <form onSubmit={handleQuickCreate} className="pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl bg-black/70 border border-purple-500/35 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3 px-3 flex-1 w-full">
                  <Wand2 className="w-5 h-5 text-purple-400 shrink-0" />
                  <input
                    type="text"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="Bijv. 124 BPM Deep House met 32-bar DJ intro, warme Rhodes en Spaans/Engelse zang..."
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none py-2.5"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition-all shrink-0 cursor-pointer"
                >
                  <span>Open Producer Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Club Spec Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                '16/32-Bar DJ Intro & Outro',
                'Deep • Afro • Latin • Tech House',
                'Meertalige Zang & Chants',
                'Camelot Key & BPM Lock',
                '4-Stem Post-Editor',
              ].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 font-medium"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Right Live DJ Deck / Arrangement Preview Card */}
          <div className="lg:col-span-5 bg-[#0E0B1A]/90 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                  SONIQ Club Architecture v3.0
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                44.1 kHz / 16-BIT WAV
              </span>
            </div>

            {/* Mini Visual DJ Arrangement */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>EXTENDED CLUB ARRANGEMENT</span>
                <span className="text-purple-300">122–128 BPM • CAMELOT LOCKED</span>
              </div>
              <div className="h-14 rounded-xl bg-black/60 border border-purple-500/20 p-2 flex items-end gap-1">
                {[
                  { label: 'DJ Intro 32B', h: '40%', color: 'bg-emerald-500/80' },
                  { label: 'Groove 16B', h: '68%', color: 'bg-purple-500/80' },
                  { label: 'Break 16B', h: '45%', color: 'bg-indigo-400/75' },
                  { label: 'Build 8B', h: '82%', color: 'bg-amber-400/85' },
                  { label: 'Main Drop 32B', h: '100%', color: 'bg-pink-500' },
                  { label: 'Bridge 16B', h: '55%', color: 'bg-purple-400/80' },
                  { label: 'Peak Drop 32B', h: '96%', color: 'bg-pink-500' },
                  { label: 'DJ Outro 32B', h: '38%', color: 'bg-emerald-500/80' },
                ].map((b, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <div
                      style={{ height: b.h }}
                      className={`w-full rounded-t ${b.color} transition-all`}
                      title={b.label}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span className="text-emerald-400">● 32-Bar Beatmatch In</span>
                <span className="text-pink-400">● Polyrhythm / Montuno Drop</span>
                <span className="text-emerald-400">● 32-Bar Mix-Out Loop</span>
              </div>
            </div>

            {/* 4-Stem Preview Bars */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { name: 'Kick & Sub-Bass', val: 'Phase-Locked 4/4', color: 'text-purple-300' },
                { name: 'Top Percussie', val: 'Congas, Timbales, 909', color: 'text-amber-300' },
                { name: 'Synths & Chords', val: 'Rhodes, Montuno, Arp', color: 'text-cyan-300' },
                { name: 'Meertalige Vocals', val: 'ES / EN / Afro / FR / NL', color: 'text-pink-300' },
              ].map((stem) => (
                <div
                  key={stem.name}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-purple-500/15"
                >
                  <div className="text-[10px] text-slate-400 font-medium">{stem.name}</div>
                  <div className={`text-xs font-bold font-mono mt-0.5 ${stem.color}`}>
                    {stem.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specialistische Electronic & House Engines */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-extrabold text-white">
                Specialistische Electronic & House Engines
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik op een stijl om direct een club-template met bijpassende BPM, Camelot-key en DJ-intro te laden.
            </p>
          </div>
          <span className="text-[11px] font-mono text-purple-300">
            Deep • Afro • Latin • Tech • Melodic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CLUB_ENGINES.map((g) => (
            <button
              key={g.genre}
              onClick={() => handleGenreClick(g.genre, g.prompt)}
              className={`p-5 rounded-2xl bg-gradient-to-br ${g.bg} border border-purple-500/25 text-left hover:scale-[1.01] transition-all hover:border-purple-400/60 group flex flex-col justify-between space-y-4 cursor-pointer shadow-lg`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{g.icon}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-[10px] font-mono text-emerald-300 font-bold">
                      Key {g.camelot}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-400/30 text-[10px] font-mono text-purple-200 font-bold">
                      {g.bpm} BPM
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
                  {g.genre}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {g.desc}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 pt-3 border-t border-white/10">
                <span>{g.subInfo}</span>
                <span className="inline-flex items-center gap-1 text-white font-sans font-bold text-xs group-hover:text-purple-300">
                  Laad Engine <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Waarom SONIQ AI géén Suno-kloon is: 6 Onderscheidende Pijlers */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-extrabold text-white">
                Waarom SONIQ AI géén standaard Suno-kloon is
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ontworpen voor club-producers, DJ’s en elektronische artiesten die volledige controle eisen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STUDIO_DIFFERENTIATORS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="glass-card p-5 rounded-2xl border border-purple-500/20 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.accent}`}
                    >
                      {item.badge}
                    </span>
                    <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Club & Extended DJ Mixes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Club & Extended DJ Releases</h2>
              <p className="text-xs text-slate-400">
                Beluister of open direct in de Track Studio om stems, BPM, DJ-intro/outro en meertalige zang te bewerken.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('library')}
            className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold shrink-0 cursor-pointer"
          >
            <span>Volledige Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {songs.slice(0, 6).map((song) => {
            const isCurrentPlaying = currentSong?.id === song.id && isPlaying;
            return (
              <div
                key={song.id}
                className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group border border-purple-500/20 hover:border-purple-400/40 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Artwork & Play overlay */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-md">
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
                          playSong(song, songs);
                        }
                      }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-purple-950/60 cursor-pointer"
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-6 h-6 fill-white text-white" />
                      ) : (
                        <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Track Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {song.title}
                      </h3>
                      {song.camelotKey && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {song.camelotKey}
                        </span>
                      )}
                      {song.mixType && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {song.mixType}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-purple-400 font-semibold">{song.genre}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-200">{song.bpm} BPM</span>
                      {song.vocalLanguages && song.vocalLanguages.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[11px] text-pink-300 truncate">
                            🌐 {song.vocalLanguages.join(' + ')}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">
                      {song.prompt}
                    </p>
                  </div>
                </div>

                {/* Studio Edit & Favorite Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-purple-900/30 pt-2.5 sm:pt-0">
                  <button
                    onClick={() => openStudioModal(song)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Open in Track Studio om stems, BPM, DJ-intro/outro en songstructuur te bewerken"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Bewerk in Studio</span>
                  </button>

                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className={`p-2 rounded-xl border border-purple-500/20 transition-colors cursor-pointer ${
                      song.isFavorite
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-slate-400 hover:text-white bg-white/[0.02]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-pink-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
