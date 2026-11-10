import { Genre, Mood } from '../types';

// Palette definitions per genre & mood
const GENRE_PALETTES: Record<string, { bg1: string; bg2: string; accent: string; secondary: string; symbol: string }> = {
  Pop: { bg1: '#3B0764', bg2: '#0F172A', accent: '#F43F5E', secondary: '#A855F7', symbol: '✦' },
  EDM: { bg1: '#09090B', bg2: '#2E1065', accent: '#06B6D4', secondary: '#8B5CF6', symbol: '▲' },
  'Deep House': { bg1: '#030712', bg2: '#1E1B4B', accent: '#6366F1', secondary: '#818CF8', symbol: '◎' },
  'Afro House': { bg1: '#1C1917', bg2: '#451A03', accent: '#F59E0B', secondary: '#D97706', symbol: '◈' },
  'Latin House': { bg1: '#18181B', bg2: '#4C0519', accent: '#E11D48', secondary: '#FB7185', symbol: '☼' },
  'Tech House': { bg1: '#09090B', bg2: '#18181B', accent: '#10B981', secondary: '#3B82F6', symbol: '⬡' },
  'Hip Hop': { bg1: '#0A0A0A', bg2: '#171717', accent: '#EAB308', secondary: '#9333EA', symbol: '⚡' },
  Rock: { bg1: '#111827', bg2: '#374151', accent: '#EF4444', secondary: '#F97316', symbol: '✦' },
  'R&B': { bg1: '#1E1B4B', bg2: '#311042', accent: '#EC4899', secondary: '#A855F7', symbol: '♥' },
  Cyberpunk: { bg1: '#020617', bg2: '#3B0764', accent: '#00F0FF', secondary: '#FF0055', symbol: '❖' },
  'Lo-Fi': { bg1: '#1C1917', bg2: '#292524', accent: '#FB923C', secondary: '#A78BFA', symbol: '☕' },
  Synthwave: { bg1: '#0F172A', bg2: '#311042', accent: '#F43F5E', secondary: '#06B6D4', symbol: '☀' },
  Reggaeton: { bg1: '#18181B', bg2: '#431407', accent: '#EA580C', secondary: '#FBBF24', symbol: '♫' },
  Ambient: { bg1: '#020617', bg2: '#0F172A', accent: '#38BDF8', secondary: '#818CF8', symbol: '≋' },
};

/**
 * Generates high quality stylized SVG square album artwork as a data URI
 */
export function generateCoverArt(title: string, genre: Genre, mood: Mood, seed: number = 1): string {
  const palette = GENRE_PALETTES[genre] || GENRE_PALETTES['Pop'];
  const sanitizedTitle = title.replace(/["&<>]/g, '').trim().slice(0, 24);
  const initials = sanitizedTitle
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Vary geometry by seed
  const rotation = (seed * 47) % 360;
  const ringCount = 4 + (seed % 3);

  const ringsSvg = Array.from({ length: ringCount }).map((_, i) => {
    const r = 50 + i * 26;
    const strokeDash = i % 2 === 0 ? '6 4' : 'none';
    const opacity = 0.25 + (i * 0.1);
    return `<circle cx="200" cy="200" r="${r}" fill="none" stroke="${palette.accent}" stroke-width="${1.5 + i * 0.5}" stroke-dasharray="${strokeDash}" opacity="${opacity}" />`;
  }).join('');

  // Frequency waves
  const wavePoints = Array.from({ length: 24 }).map((_, i) => {
    const x = 30 + i * 14.5;
    const heightMod = Math.sin((i + seed) * 0.6) * 45;
    const y = 280 + heightMod;
    return `${x},${y}`;
  }).join(' ');

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bg1}" />
          <stop offset="50%" stop-color="${palette.bg2}" />
          <stop offset="100%" stop-color="#050508" />
        </linearGradient>
        <radialGradient id="neonGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.55" />
          <stop offset="60%" stop-color="${palette.secondary}" stop-opacity="0.15" />
          <stop offset="100%" stop-color="${palette.bg1}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="${palette.accent}" />
        </linearGradient>
        <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background -->
      <rect width="400" height="400" fill="url(#bgGrad)" />

      <!-- Neon Sphere Glow -->
      <circle cx="200" cy="180" r="140" fill="url(#neonGlow)" filter="url(#glowFilter)" />

      <!-- Concentric Synth Rings -->
      <g transform="rotate(${rotation} 200 200)">
        ${ringsSvg}
      </g>

      <!-- Central Icon Symbol -->
      <g transform="translate(200, 175)">
        <circle cx="0" cy="0" r="38" fill="#12101F" stroke="${palette.accent}" stroke-width="2" />
        <text x="0" y="8" fill="#FFFFFF" font-size="24" font-weight="bold" font-family="'Plus Jakarta Sans', sans-serif" text-anchor="middle">${palette.symbol}</text>
      </g>

      <!-- Equalizer Wave Ribbon -->
      <polyline points="${wavePoints}" fill="none" stroke="${palette.accent}" stroke-width="2.5" opacity="0.75" />

      <!-- Dark Vignette and Bottom Overlay -->
      <rect y="260" width="400" height="140" fill="black" fill-opacity="0.65" />

      <!-- Genre & Mood Badges -->
      <rect x="24" y="280" width="70" height="18" rx="4" fill="${palette.accent}" fill-opacity="0.25" stroke="${palette.accent}" stroke-width="0.8" />
      <text x="59" y="293" fill="${palette.accent}" font-size="9.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" letter-spacing="1" text-anchor="middle">${genre.toUpperCase()}</text>

      <text x="105" y="293" fill="#9CA3AF" font-size="10" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500">${mood}</text>

      <!-- Title -->
      <text x="24" y="335" fill="url(#textGrad)" font-size="22" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif" letter-spacing="-0.5">${sanitizedTitle}</text>
      
      <!-- Soniq Watermark Tag -->
      <text x="24" y="365" fill="#6B7280" font-size="10" font-family="'JetBrains Mono', monospace" letter-spacing="2">SONIQ AI • STUDIO MASTER</text>

      <!-- Corner Accent -->
      <circle cx="370" cy="30" r="4" fill="${palette.accent}" />
      <circle cx="370" cy="45" r="2" fill="${palette.secondary}" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}
