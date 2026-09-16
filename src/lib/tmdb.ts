const KEY = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const BASE = "https://api.themoviedb.org/3";

async function tmdb(path: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(BASE + path);
  const searchParams = { api_key: KEY, language: "en-IN", ...params };
  Object.entries(searchParams).forEach(
    ([k, v]) => url.searchParams.set(k, String(v))
  );
  
  try {
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`TMDb ${r.status}`);
    return await r.json();
  } catch (error) {
    console.error("TMDb fetch error:", error);
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

export const IMG = (path: string | null | undefined, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
