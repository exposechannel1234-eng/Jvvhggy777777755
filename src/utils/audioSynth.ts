/**
 * High-fidelity Web Audio Synthesizer & WAV generator
 * Generates genuinely distinct musical compositions for every track using:
 * - Cryptographic / unique random seed PRNG (Mulberry32)
 * - Prompt, Title & Lyrics semantic/melodic hashing
 * - Camelot Key harmonic transposition
 * - Genre-specific drum grooves, bassline patterns, chord voicings & vocal formants
 * - DJ Intro / Outro beatmatching grids & 4-Stem Mixer levels
 */

import { Genre, Mood } from '../types';

// Deterministic PRNG from a 32-bit seed so the same song.seed + prompt + lyrics
// renders its own unique composition, while different seeds/prompts/lyrics never repeat.
function createSeededRandom(seedInput: number): () => number {
  let a = (seedInput >>> 0) || 0x6d2b79f5;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Convert MIDI note number to frequency (Hz)
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Map Camelot Key to Root MIDI note in Octave 2 (for sub-bass) & scale intervals
function getCamelotScale(camelotKey?: string, mood?: Mood): { rootMidi: number; intervals: number[] } {
  const keyStr = camelotKey || '8A';
  let rootMidi = 45; // A2 (55 Hz)
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
    rootMidi = 36; // C major
    isMajor = true;
  } else if (keyStr.startsWith('9B')) {
    rootMidi = 43; // G major
    isMajor = true;
  } else if (keyStr.startsWith('11B')) {
    rootMidi = 45; // A major
    isMajor = true;
  }

  // Scale intervals (semitones from root)
  if (isMajor || mood === 'Uplifting') {
    return { rootMidi, intervals: [0, 2, 4, 5, 7, 9, 11, 12] }; // Ionian / Major
  }
  if (mood === 'Dark & Gritty' || mood === 'Aggressive') {
    return { rootMidi, intervals: [0, 1, 3, 5, 7, 8, 10, 12] }; // Phrygian club scale
  }
  if (mood === 'Euphoric' || mood === 'Romantic') {
    return { rootMidi, intervals: [0, 2, 3, 5, 7, 9, 10, 12] }; // Dorian house scale
  }
  return { rootMidi, intervals: [0, 2, 3, 5, 7, 8, 10, 12] }; // Natural Minor (Aeolian)
}

// Multiple distinct chord degree progressions (scale indices 0..6)
const PROGRESSION_TEMPLATES: number[][] = [
  [0, 5, 3, 6], // i - VI - iv - VII
  [0, 3, 5, 4], // i - iv - VI - v
  [0, 6, 5, 6], // i - VII - VI - VII (Hypnotic Afro/Tech loop)
  [3, 4, 0, 5], // iv - v - i - VI (Deep House emotional)
  [0, 2, 5, 3], // i - III - VI - iv (Euphoric Mainstage)
  [0, 4, 6, 3], // i - v - VII - iv (Progressive / Melodic)
  [0, 1, 0, 6], // i - ii - i - VII (Dark Warehouse Tech)
  [5, 6, 0, 0], // VI - VII - i - i (Anthem cadence)
];

/**
 * Generate a complete multi-layered audio buffer using OfflineAudioContext
 * and export as a real downloadable WAV Blob, Object URL, and Audio Fingerprint.
 */
export async function generateSynthesizedTrackAudio({
  genre,
  bpm,
  mood,
  durationSeconds = 32,
  seed,
  prompt = '',
  lyrics = '',
  title = '',
  camelotKey = '8A (A Minor)',
  vocalMode = 'female',
  isInstrumental = false,
  djIntroStyle = '16-bar-percussive',
  djOutroStyle = '16-bar-dj-loop',
  stemMix,
}: {
  genre: Genre;
  bpm: number;
  mood: Mood;
  durationSeconds?: number;
  seed?: number;
  prompt?: string;
  lyrics?: string;
  title?: string;
  camelotKey?: string;
  vocalMode?: string;
  isInstrumental?: boolean;
  djIntroStyle?: string;
  djOutroStyle?: string;
  stemMix?: {
    kickSub: number;
    percussion: number;
    synthsChords: number;
    vocalsChants: number;
    sidechainPump: number;
    filterCutoff: number;
  };
}): Promise<{ audioUrl: string; blob: Blob; audioFingerprint: string; usedSeed: number }> {
  // Combine explicit seed with content hash of prompt, lyrics, title, genre, bpm, camelotKey
  const baseSeed =
    typeof seed === 'number' && seed > 0
      ? seed
      : Math.floor(Math.random() * 899999999) + 100000000;
  const contentHash = hashStringToSeed(
    `${title}|${prompt}|${lyrics}|${genre}|${bpm}|${mood}|${camelotKey}|${vocalMode}|${djIntroStyle}|${djOutroStyle}`
  );
  const combinedSeed = (baseSeed ^ contentHash) >>> 0;
  const rand = createSeededRandom(combinedSeed);

  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const AudioContextClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  const ctx = new AudioContextClass(2, totalSamples, sampleRate);

  const secondsPerBeat = 60 / bpm;
  const secondsPerStep = secondsPerBeat / 4; // 16th note
  const secondsPerMeasure = secondsPerBeat * 4;
  const totalMeasures = Math.ceil(durationSeconds / secondsPerMeasure);

  // Stem Mix Multipliers
  const kickSubGainMult = stemMix ? stemMix.kickSub / 85 : 1.0;
  const percGainMult = stemMix ? stemMix.percussion / 85 : 1.0;
  const synthGainMult = stemMix ? stemMix.synthsChords / 85 : 1.0;
  const vocalGainMult = stemMix ? stemMix.vocalsChants / 85 : 1.0;
  const cutoffMult = stemMix ? Math.max(0.3, stemMix.filterCutoff / 85) : 1.0;

  // Determine DJ Intro & Outro Measure boundaries
  const hasDjIntro = djIntroStyle && djIntroStyle !== 'none';
  const hasDjOutro = djOutroStyle && djOutroStyle !== 'none';
  const introMeasures = hasDjIntro ? (djIntroStyle === '32-bar-club-grid' ? 3 : 2) : 0;
  const outroStartMeasure = hasDjOutro
    ? Math.max(totalMeasures - 2, introMeasures + 2)
    : totalMeasures;

  // Master bus
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);

  // Stereo Delay & Space
  const delay = ctx.createDelay();
  const delayRatio = rand() > 0.5 ? 0.75 : 0.5; // dotted 8th or 8th delay
  delay.delayTime.setValueAtTime(secondsPerBeat * delayRatio, 0);
  const delayGain = ctx.createGain();
  delayGain.gain.setValueAtTime(0.18 + rand() * 0.1, 0);
  delay.connect(delayGain);
  delayGain.connect(delay);
  delayGain.connect(masterGain);

  masterGain.connect(ctx.destination);

  // Harmonic Scale & Unique Chord Progression for this generation
  const { rootMidi, intervals } = getCamelotScale(camelotKey, mood);
  const progIdx = Math.floor(rand() * PROGRESSION_TEMPLATES.length);
  const progressionDegrees = PROGRESSION_TEMPLATES[progIdx];

  // Build 4 chords of MIDI notes (in Octave 3/4)
  const chordsMidi: number[][] = progressionDegrees.map((deg) => {
    const r = rootMidi + 12 + intervals[deg % intervals.length];
    const third = rootMidi + 12 + intervals[(deg + 2) % intervals.length];
    const fifth = rootMidi + 12 + intervals[(deg + 4) % intervals.length];
    const seventh =
      genre === 'Deep House' || genre === 'Afro House' || genre === 'R&B' || genre === 'Lo-Fi'
        ? rootMidi + 12 + intervals[(deg + 6) % intervals.length]
        : r + 12;
    return [r, third, fifth, seventh];
  });

  // Generate a unique 16-step Bassline Pattern for this track
  const bassStepGate: boolean[] = [];
  const bassOctaveJump: number[] = [];
  for (let s = 0; s < 16; s++) {
    if (genre === 'Tech House' || genre === 'Melodic Techno' || genre === 'Progressive House') {
      // Off-beat & rolling 16th groove
      bassStepGate.push(s % 4 !== 0 && (s % 2 === 1 || rand() > 0.35));
    } else if (genre === 'Afro House' || genre === 'Latin House') {
      // Syncopated 3-3-2 / tumbao groove
      bassStepGate.push(s === 0 || s === 3 || s === 6 || s === 8 || s === 11 || s === 14 || rand() > 0.6);
    } else {
      bassStepGate.push(s % 2 === 0 || rand() > 0.55);
    }
    bassOctaveJump.push(rand() > 0.72 ? 12 : 0);
  }

  // Generate a unique 16-step Melodic Hook from Seed + Lyrics + Prompt
  const lyricChars = (lyrics || prompt || title || 'SONIQ').replace(/\s+/g, '');
  const melodyDegrees: number[] = [];
  const melodyGate: boolean[] = [];
  for (let s = 0; s < 16; s++) {
    const charCode = lyricChars.charCodeAt(s % Math.max(1, lyricChars.length)) || 65;
    const deg = (charCode + Math.floor(rand() * 8)) % intervals.length;
    melodyDegrees.push(deg);
    melodyGate.push(rand() > 0.3);
  }

  // Kick pitch & character variation per track
  const kickStartFreq = 135 + Math.floor(rand() * 35);
  const kickEndFreq = 34 + Math.floor(rand() * 12);
  const bassWaveform: OscillatorType =
    genre === 'Hip Hop' || genre === 'Lo-Fi'
      ? 'sine'
      : genre === 'Afro House' || genre === 'Deep House'
      ? rand() > 0.4
        ? 'triangle'
        : 'sawtooth'
      : 'sawtooth';

  // 1. Synthesize Custom Bassline
  for (let m = 0; m < totalMeasures; m++) {
    const isIntro = m < introMeasures;
    const isOutro = m >= outroStartMeasure;
    const chordIdx = m % chordsMidi.length;
    const chordRootMidi = chordsMidi[chordIdx][0] - 12; // Sub-bass register

    for (let s = 0; s < 16; s++) {
      if (!bassStepGate[s]) continue;
      if ((isIntro || isOutro) && s % 4 !== 0 && s % 4 !== 2) continue;

      const startTime = m * secondsPerMeasure + s * secondsPerStep;
      if (startTime >= durationSeconds - 0.25) break;

      const noteMidi =
        chordRootMidi +
        (s === 14 && rand() > 0.5 ? intervals[4] : 0) +
        (isIntro || isOutro ? 0 : bassOctaveJump[s]);
      const freq = midiToFreq(noteMidi);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      const baseCutoff = (190 + (combinedSeed % 160)) * cutoffMult;
      filter.frequency.setValueAtTime(
        isIntro || isOutro ? baseCutoff * 0.55 : baseCutoff,
        startTime
      );
      filter.Q.setValueAtTime(2.2 + (rand() * 2.5), startTime);

      const envScalar = (isIntro || isOutro ? 0.55 : 1.0) * kickSubGainMult;
      // Sidechain ducking on quarter-note beats (s % 4 === 0)
      const sidechainDuck = s % 4 === 0 ? 0.55 : 1.0;

      osc.type = bassWaveform;
      osc.frequency.setValueAtTime(freq, startTime);

      const noteDur = secondsPerStep * (bassStepGate[(s + 1) % 16] ? 0.9 : 1.6);
      gain.gain.setValueAtTime(Math.max(0.001, 0.52 * envScalar * sidechainDuck), startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + noteDur + 0.02);
    }
  }

  // 2. Synthesize Chords, Montuno Stabs or Pads (Muted during Percussive DJ Intro/Outro)
  const chordRhythmMode = combinedSeed % 3; // 0 = sustained pad, 1 = house off-beat stabs, 2 = syncopated montuno/kalimba
  for (let m = 0; m < totalMeasures; m++) {
    const isIntro = m < introMeasures;
    const isOutro = m >= outroStartMeasure;
    if (isIntro && djIntroStyle === '16-bar-percussive') continue;
    if (isOutro && djOutroStyle === '16-bar-dj-loop') continue;

    const currentChord = chordsMidi[m % chordsMidi.length];
    const sectionGain = (isIntro || isOutro ? 0.32 : 1.0) * synthGainMult;

    const stabOffsets =
      chordRhythmMode === 0
        ? [0]
        : chordRhythmMode === 1
        ? [0.5, 1.5, 2.5, 3.5]
        : [0, 0.75, 1.5, 2.5, 3.25];

    for (const beatOffset of stabOffsets) {
      const startTime = m * secondsPerMeasure + beatOffset * secondsPerBeat;
      if (startTime >= durationSeconds - 0.3) break;
      const stabDuration =
        chordRhythmMode === 0 ? secondsPerMeasure - 0.05 : secondsPerBeat * 0.45;

      currentChord.forEach((midiNote, nIdx) => {
        const freq = midiToFreq(midiNote);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type =
          genre === 'Cyberpunk' || genre === 'EDM' || genre === 'Melodic Techno'
            ? 'sawtooth'
            : genre === 'Latin House'
            ? 'square'
            : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime((1200 + (combinedSeed % 1400)) * cutoffMult, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(
          Math.max(0.001, (0.19 / currentChord.length) * sectionGain),
          startTime + (chordRhythmMode === 0 ? 0.12 : 0.02)
        );
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + stabDuration);

        osc.connect(filter);
        filter.connect(gain);
        if (ctx.createStereoPanner) {
          const pan = ctx.createStereoPanner();
          pan.pan.setValueAtTime(nIdx % 2 === 0 ? -0.35 : 0.35, startTime);
          gain.connect(pan);
          pan.connect(masterGain);
          pan.connect(delay);
        } else {
          gain.connect(masterGain);
          gain.connect(delay);
        }

        osc.start(startTime);
        osc.stop(startTime + stabDuration + 0.02);
      });
    }
  }

  // 3. Synthesize Drums & Genre-Specific Percussion (Kick, Clap/Rim, 909 Hats, Conga/Djembe/Timbale)
  const congaSteps = [2, 3, 6, 7, 10, 11, 14, 15].filter(() => rand() > 0.25);
  for (let m = 0; m < totalMeasures; m++) {
    for (let b = 0; b < 4; b++) {
      const beatTime = m * secondsPerMeasure + b * secondsPerBeat;
      if (beatTime >= durationSeconds - 0.2) break;

      const playKick =
        genre.includes('House') || genre.includes('Techno') || genre === 'EDM' || genre === 'Pop'
          ? true
          : b === 0 || b === 2 || (b === 1 && m % 2 === 1);

      if (playKick && kickSubGainMult > 0.05) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(kickStartFreq, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(kickEndFreq, beatTime + 0.09);
        kickGain.gain.setValueAtTime(Math.min(1.0, 0.84 * kickSubGainMult), beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.24);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.25);
      }

      // Snare / Clap on beats 1 and 3
      if ((b === 1 || b === 3) && percGainMult > 0.05) {
        const bufferSize = Math.floor(sampleRate * 0.16);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.045));
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const snareFilter = ctx.createBiquadFilter();
        snareFilter.type = 'bandpass';
        snareFilter.frequency.setValueAtTime(1100 + (combinedSeed % 600), beatTime);

        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(0.38 * percGainMult, beatTime);
        snareGain.gain.exponentialRampToValueAtTime(0.005, beatTime + 0.15);

        whiteNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(masterGain);
        whiteNoise.start(beatTime);
        whiteNoise.stop(beatTime + 0.16);
      }

      // 16th-note Hi-Hats & Polyrhythmic Percussion
      if (percGainMult > 0.05) {
        for (let s = 0; s < 4; s++) {
          const stepIdx = b * 4 + s;
          const stepTime = beatTime + s * secondsPerStep;
          if (stepTime >= durationSeconds - 0.05) break;

          // Open 909 Hat on off-beat (s === 2)
          const isOpenHat = s === 2;
          const hatDur = isOpenHat ? 0.085 : 0.03;
          const hatBufferSize = Math.floor(sampleRate * hatDur);
          const hatBuffer = ctx.createBuffer(1, hatBufferSize, sampleRate);
          const hatData = hatBuffer.getChannelData(0);
          for (let i = 0; i < hatBufferSize; i++) {
            hatData[i] = Math.random() * 2 - 1;
          }

          const hatSource = ctx.createBufferSource();
          hatSource.buffer = hatBuffer;
          const hatFilter = ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.setValueAtTime(6800 + (combinedSeed % 1800), stepTime);

          const hatGain = ctx.createGain();
          const hatVolume = (isOpenHat ? 0.26 : 0.11) * percGainMult;
          hatGain.gain.setValueAtTime(hatVolume, stepTime);
          hatGain.gain.exponentialRampToValueAtTime(0.001, stepTime + hatDur);

          hatSource.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(masterGain);
          hatSource.start(stepTime);
          hatSource.stop(stepTime + hatDur + 0.005);

          // Afro Djembe / Latin Conga / Tech Toms on syncopated steps
          if (congaSteps.includes(stepIdx)) {
            const tomOsc = ctx.createOscillator();
            const tomGain = ctx.createGain();
            const isHighConga = stepIdx % 3 === 0;
            const congaFreq = isHighConga
              ? midiToFreq(rootMidi + 24)
              : midiToFreq(rootMidi + 19);
            tomOsc.type = 'triangle';
            tomOsc.frequency.setValueAtTime(congaFreq * 1.15, stepTime);
            tomOsc.frequency.exponentialRampToValueAtTime(congaFreq * 0.85, stepTime + 0.07);

            tomGain.gain.setValueAtTime(0.24 * percGainMult, stepTime);
            tomGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.08);

            tomOsc.connect(tomGain);
            tomGain.connect(masterGain);
            tomOsc.start(stepTime);
            tomOsc.stop(stepTime + 0.085);
          }
        }
      }
    }
  }

  // 4. Synthesize Custom Melodic Hook / Arpeggio (Unique per seed + prompt + lyrics)
  if (synthGainMult > 0.05) {
    const leadWave: OscillatorType =
      genre === 'Melodic Techno' || genre === 'Tech House' || genre === 'EDM'
        ? 'sawtooth'
        : genre === 'Afro House'
        ? 'sine'
        : 'triangle';

    for (let m = 0; m < totalMeasures; m++) {
      if (m < introMeasures || m >= outroStartMeasure) continue;
      for (let step = 0; step < 16; step++) {
        if (!melodyGate[(step + m) % 16]) continue;
        const stepTime = m * secondsPerMeasure + step * secondsPerStep;
        if (stepTime >= durationSeconds - 0.2) break;

        const deg = melodyDegrees[(step + m * 3) % melodyDegrees.length];
        const noteMidi = rootMidi + 24 + intervals[deg % intervals.length];
        const freq = midiToFreq(noteMidi);

        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        const leadFilter = ctx.createBiquadFilter();

        leadOsc.type = leadWave;
        leadOsc.frequency.setValueAtTime(freq, stepTime);

        leadFilter.type = 'bandpass';
        leadFilter.frequency.setValueAtTime(freq * 1.4 * cutoffMult, stepTime);
        leadFilter.Q.setValueAtTime(2.5, stepTime);

        leadGain.gain.setValueAtTime(0.13 * synthGainMult, stepTime);
        leadGain.gain.exponentialRampToValueAtTime(0.001, stepTime + secondsPerStep * 1.35);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(masterGain);
        leadGain.connect(delay);

        leadOsc.start(stepTime);
        leadOsc.stop(stepTime + secondsPerStep * 1.4);
      }
    }
  }

  // 5. Synthesize Lyrics-Driven Vocal Formant Phrases (if not instrumental)
  if (!isInstrumental && vocalGainMult > 0.05) {
    const baseFormant =
      vocalMode === 'male' ? 520 : vocalMode === 'duet' ? 680 : 820;

    for (let m = 0; m < totalMeasures; m++) {
      if (m < introMeasures || m >= outroStartMeasure) continue;
      // Phrase on active measures
      for (let phraseStep = 0; phraseStep < 4; phraseStep++) {
        if ((m + phraseStep + combinedSeed) % 2 !== 0) continue;
        const vTime = m * secondsPerMeasure + phraseStep * secondsPerBeat;
        const vDuration = secondsPerBeat * 0.85;
        if (vTime + vDuration >= durationSeconds - 0.1) break;

        const deg = melodyDegrees[(m * 4 + phraseStep) % melodyDegrees.length];
        const vocalMidi =
          rootMidi + (vocalMode === 'male' ? 12 : 24) + intervals[deg % intervals.length];
        const vPitch = midiToFreq(vocalMidi);

        const vOsc1 = ctx.createOscillator();
        const vOsc2 = ctx.createOscillator();
        const vGain = ctx.createGain();

        const formantFilter = ctx.createBiquadFilter();
        formantFilter.type = 'bandpass';
        formantFilter.frequency.setValueAtTime(
          baseFormant + ((m * 70 + phraseStep * 110) % 380),
          vTime
        );
        formantFilter.Q.setValueAtTime(4.8, vTime);

        vOsc1.type = 'sawtooth';
        vOsc1.frequency.setValueAtTime(vPitch, vTime);
        vOsc2.type = 'triangle';
        vOsc2.frequency.setValueAtTime(vPitch * 1.005, vTime);

        vGain.gain.setValueAtTime(0.001, vTime);
        vGain.gain.linearRampToValueAtTime(0.15 * vocalGainMult, vTime + 0.08);
        vGain.gain.exponentialRampToValueAtTime(0.001, vTime + vDuration);

        vOsc1.connect(formantFilter);
        vOsc2.connect(formantFilter);
        formantFilter.connect(vGain);
        vGain.connect(masterGain);
        vGain.connect(delay);

        vOsc1.start(vTime);
        vOsc2.start(vTime);
        vOsc1.stop(vTime + vDuration + 0.01);
        vOsc2.stop(vTime + vDuration + 0.01);
      }
    }
  }

  // Render complete buffer
  const renderedBuffer = await ctx.startRendering();

  // Convert AudioBuffer to WAV Blob & compute audio fingerprint
  const { blob: wavBlob, fingerprint } = audioBufferToWavBlobAndFingerprint(
    renderedBuffer,
    combinedSeed
  );
  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    audioUrl,
    blob: wavBlob,
    audioFingerprint: fingerprint,
    usedSeed: baseSeed,
  };
}

/**
 * Encodes an AudioBuffer into a standards-compliant 16-bit PCM WAV Blob
 * and computes a hexadecimal FNV-1a fingerprint over the audio samples.
 */
function audioBufferToWavBlobAndFingerprint(
  buffer: AudioBuffer,
  seedSalt: number
): { blob: Blob; fingerprint: string } {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let fnv = (2166136261 ^ seedSalt) >>> 0;
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? (sample * 0x8000) | 0 : (sample * 0x7fff) | 0;
      view.setInt16(offset, intSample, true);
      offset += 2;

      if (i % 64 === 0) {
        fnv ^= intSample & 0xffff;
        fnv = Math.imul(fnv, 16777619) >>> 0;
      }
    }
  }

  const fingerprint = `fp-${fnv.toString(16).padStart(8, '0')}-${buffer.length.toString(16)}`;
  return {
    blob: new Blob([arrayBuffer], { type: 'audio/wav' }),
    fingerprint,
  };
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
