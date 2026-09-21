const BASE = "/api/tmdb";

export function getTmdbApiKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('tmdb_api_key');
    if (local && local.trim() && local !== 'YOUR_TMDB_API_KEY') return local.trim();
  }
  const envKey = (import.meta as any).env?.VITE_TMDB_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'YOUR_TMDB_API_KEY') return envKey.trim();
  return '';
}

export function setTmdbApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('tmdb_api_key', key.trim());
    } else {
      localStorage.removeItem('tmdb_api_key');
    }
  }
}

async function tmdb(path: string, params: Record<string, string | number | boolean> = {}) {
  const apiKey = getTmdbApiKey();

  // Create an abort controller with a 10s timeout to prevent UI from freezing indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  // If a client-side API key is available (either from localStorage or VITE_TMDB_API_KEY),
  // call the official TMDb v3/v4 API directly.
  if (apiKey) {
    const isV4Token = apiKey.startsWith('ey') || apiKey.length > 60;
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (isV4Token) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      url.searchParams.set('api_key', apiKey);
    }

    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v));
    });

    try {
      const r = await fetch(url.toString(), { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!r.ok) {
        const errJson = await r.json().catch(() => ({}));
        throw new Error(errJson.status_message || `TMDb API error (${r.status})`);
      }
      return await r.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Direct TMDb fetch error:", error);
      if (error.name === 'AbortError') {
        throw new Error("TMDb request timed out after 10 seconds. Check your network or VPN connection.");
      }
      if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
        throw new Error(
          "Network request to TMDb was blocked (Failed to fetch). Possible causes: 1) Ad-blocker or Brave Shields blocking TMDb, 2) ISP DNS blocking api.themoviedb.org, 3) Pasted v4 token instead of v3 key, or 4) No internet connection."
        );
      }
      throw error;
    }
  }

  // Otherwise, attempt the backend proxy /api/tmdb
  const url = new URL(window.location.origin + BASE + path);
  Object.entries(params).forEach(
    ([k, v]) => url.searchParams.set(k, String(v))
  );
  
  try {
    const r = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
    const contentType = r.headers.get("content-type") || "";

    // On static hosts (like Render Static Sites), unmatched routes return index.html
    if (contentType.includes("text/html")) {
      throw new Error("TMDb API Key required. On static hosting, please configure a free TMDb API key to search.");
    }

    if (!r.ok) {
      const errJson = await r.json().catch(() => ({}));
      throw new Error(errJson.error || `TMDb server responded with ${r.status}`);
    }
    return await r.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("TMDb fetch error:", error);
    if (error.name === 'AbortError') {
      throw new Error("TMDb proxy request timed out. Please configure a client TMDb API key.");
    }
    throw error;
  }
}

export const tmdbSearch = (q: string) => tmdb("/search/movie", { query: q, include_adult: false });
export const tmdbDetails = (id: string | number) => tmdb(`/movie/${id}`);
export const tmdbVideos = (id: string | number) => tmdb(`/movie/${id}/videos`);
export const tmdbProviders = (id: string | number) => tmdb(`/movie/${id}/watch/providers`, { watch_region: "IN" });
export const tmdbSimilar = (id: string | number) => tmdb(`/movie/${id}/similar`);
export const tmdbCredits = (id: string | number) => tmdb(`/movie/${id}/credits`);
export const tmdbDiscover = (params: Record<string, string | number | boolean>) => tmdb("/discover/movie", params);

export const IMG = (path: string | null | undefined, size = "w500") => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
