import {
  Song,
  Playlist,
  GenerateMusicRequest,
  GenerateLyricsRequest,
  GeneratedLyricsResponse,
  ApiSettingsConfig,
} from '../types';

function createUniqueUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const api = {
  // Fetch all songs (never cached)
  async getSongs(): Promise<Song[]> {
    const res = await fetch(`/api/songs?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch songs');
    const data = await res.json();
    return data.songs || [];
  },

  // Save / Update song
  async saveSong(song: Song): Promise<Song> {
    const res = await fetch('/api/songs', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
      body: JSON.stringify(song),
    });
    if (!res.ok) throw new Error('Failed to save song');
    const data = await res.json();
    return data.song;
  },

  // Update song partial
  async updateSong(id: string, updates: Partial<Song>): Promise<Song> {
    const res = await fetch(`/api/songs/${id}`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update song');
    const data = await res.json();
    return data.song;
  },

  // Delete song
  async deleteSong(id: string): Promise<void> {
    const res = await fetch(`/api/songs/${id}`, {
      method: 'DELETE',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to delete song');
  },

  // Poll asynchronous music generation job if status is queued/processing
  async pollGenerationJob(jobId: string, requestId: string): Promise<{ songs: Song[]; status: string }> {
    const maxPolls = 30;
    for (let attempt = 1; attempt <= maxPolls; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = await fetch(`/api/music/jobs/${encodeURIComponent(jobId)}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'X-Request-ID': requestId,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to poll generation job ${jobId}`);
      }
      const data = await res.json();
      const job = data.job;
      console.log('[SONIQ_API_POLL]', {
        attempt,
        requestId,
        jobId,
        status: job?.status,
        songsCount: job?.songs?.length || 0,
      });

      if (job?.status === 'succeeded' && Array.isArray(job.songs) && job.songs.length > 0) {
        return { songs: job.songs, status: 'succeeded' };
      }
      if (job?.status === 'failed') {
        throw new Error(job.error || 'Asynchronous music generation job failed');
      }
    }
    throw new Error(`Music generation job ${jobId} timed out while polling`);
  },

  // Generate music with guaranteed unique requestId & random seed
  async generateMusic(
    params: GenerateMusicRequest
  ): Promise<{
    requestId: string;
    jobId?: string;
    status: string;
    songs: Song[];
    message: string;
  }> {
    const requestId = params.requestId || `req-${createUniqueUUID()}`;
    const randomSeed =
      typeof params.seed === 'number' && params.seed > 0
        ? params.seed
        : Math.floor(Math.random() * 899999999) + 100000000;

    const payload: GenerateMusicRequest = {
      ...params,
      requestId,
      seed: randomSeed,
    };

    console.log('[SONIQ_API_REQUEST] Sending new music generation request:', {
      requestId,
      seed: randomSeed,
      title: payload.title,
      genre: payload.genre,
      bpm: payload.bpm,
      camelotKey: payload.camelotKey,
      provider: payload.provider,
      promptPreview: (payload.prompt || '').slice(0, 80),
      timestamp: new Date().toISOString(),
    });

    const res = await fetch(`/api/music/generate?_req=${encodeURIComponent(requestId)}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      const err = new Error(data.message || data.error || 'Music generation failed') as Error & {
        code?: string;
        provider?: string;
      };
      err.code = data.error;
      err.provider = data.provider;
      throw err;
    }

    let finalSongs: Song[] = data.songs || [];
    let finalStatus: string = data.status || 'succeeded';

    // Handle asynchronous generation jobs via polling if needed
    if ((finalStatus === 'queued' || finalStatus === 'processing') && data.jobId) {
      const polled = await this.pollGenerationJob(data.jobId, requestId);
      finalSongs = polled.songs;
      finalStatus = polled.status;
    }

    console.log('[SONIQ_API_RESPONSE] Music generation completed:', {
      requestId: data.requestId || requestId,
      jobId: data.jobId,
      status: finalStatus,
      generatedTracks: finalSongs.map((s) => ({
        songId: s.id,
        generationId: s.generationId,
        seed: s.seed,
        audioFingerprint: s.audioFingerprint,
        audioUrl: s.audioUrl,
        status: s.generationStatus,
      })),
    });

    return {
      requestId: data.requestId || requestId,
      jobId: data.jobId,
      status: finalStatus,
      songs: finalSongs,
      message: data.message,
    };
  },

  // Generate lyrics with Gemini
  async generateLyrics(params: GenerateLyricsRequest): Promise<GeneratedLyricsResponse> {
    const res = await fetch('/api/lyrics/generate', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || data.error || 'Lyrics generation failed');
    }
    return data.data;
  },

  // Enhance prompt with Gemini
  async enhancePrompt(params: {
    prompt: string;
    genre: string;
    mood: string;
    isInstrumental: boolean;
  }): Promise<{ enhancedPrompt: string; suggestedTitle: string; styleTags: string[] }> {
    const res = await fetch('/api/prompt/enhance', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || data.error || 'Failed to enhance prompt');
    }
    return data.data;
  },

  // Generate AI Album Artwork with Gemini 3.1 Flash Lite Image
  async generateArtwork(params: {
    title: string;
    genre: string;
    mood: string;
    prompt?: string;
  }): Promise<string | null> {
    try {
      const res = await fetch('/api/artwork/generate', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) return data.imageUrl;
      return null;
    } catch {
      return null;
    }
  },

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    const res = await fetch(`/api/playlists?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch playlists');
    const data = await res.json();
    return data.playlists || [];
  },

  async createPlaylist(name: string, description: string = ''): Promise<Playlist> {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create playlist');
    const data = await res.json();
    return data.playlist;
  },

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist> {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update playlist');
    const data = await res.json();
    return data.playlist;
  },

  async deletePlaylist(id: string): Promise<void> {
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'DELETE',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to delete playlist');
  },

  // Settings
  async getSettings(): Promise<Record<string, unknown>> {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return data.settings || {};
  },

  async updateSettings(settings: Partial<ApiSettingsConfig>): Promise<void> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
  },

  // Test Supabase
  async testSupabase(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/supabase/test', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, anonKey }),
    });
    const data = await res.json();
    return data;
  },

  // Credits & Billing System
  async getCredits(): Promise<{
    credits: number;
    plan: string;
    canClaimDaily: boolean;
    nextClaimMs: number;
    lastDailyBonusClaimed: string | null;
    transactions: import('../types').CreditTransaction[];
  }> {
    const res = await fetch(`/api/credits?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch credit balance');
    const data = await res.json();
    return data;
  },

  async claimDailyBonus(): Promise<{
    credits: number;
    bonusAmount: number;
    message: string;
    transaction: import('../types').CreditTransaction;
  }> {
    const res = await fetch('/api/credits/claim-daily', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kon dagelijkse bonus niet claimen');
    return data;
  },

  async purchaseCredits(params: {
    packageId: string;
    credits: number;
    price: number;
    name: string;
  }): Promise<{
    credits: number;
    message: string;
    transaction: import('../types').CreditTransaction;
  }> {
    const res = await fetch('/api/credits/purchase', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Opwaardering mislukt');
    return data;
  },

  async deductCredits(params: {
    amount: number;
    type: string;
    description: string;
  }): Promise<{
    credits: number;
    transaction: import('../types').CreditTransaction;
  }> {
    const res = await fetch('/api/credits/deduct', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Onvoldoende credits') as Error & { code?: string };
      err.code = data.error;
      throw err;
    }
    return data;
  },
};
