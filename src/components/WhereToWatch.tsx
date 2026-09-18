import React from 'react';
import { useTmdb } from '../hooks/useTmdb';
import { tmdbProviders, IMG } from '../lib/tmdb';

const AFFILIATES: Record<string, { url: (t: string) => string, badge?: string }> = {
  "Prime Video":     { url: (t) => `https://www.primevideo.com/search?keyword=${encodeURIComponent(t)}&tag=moviewallah-21` },
  "Netflix":         { url: (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}` }, 
  "Disney+ Hotstar": { url: (t) => `https://www.hotstar.com/in/explore?searchQuery=${encodeURIComponent(t)}` },
  "JioCinema":       { url: (t) => `https://www.jiocinema.com/search?keyword=${encodeURIComponent(t)}` },
  "ZEE5":            { url: (t) => `https://www.zee5.com/search?q=${encodeURIComponent(t)}` },
  "Sony LIV":        { url: (t) => `https://www.sonyliv.com/search?text=${encodeURIComponent(t)}` },
  "MX Player":       { url: (t) => `https://www.mxplayer.in/?q=${encodeURIComponent(t)}`, badge: "FREE" },
  "YouTube":         { url: (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t + " full movie official")}` },
  "Apple TV":        { url: (t) => `https://tv.apple.com/search/${encodeURIComponent(t)}` },
};

export const WhereToWatch: React.FC<{ tmdbId: number; title: string }> = ({ tmdbId, title }) => {
  const data = useTmdb(`providers:${tmdbId}`, () => tmdbProviders(tmdbId), 12 * 3600e3);
  
  if (!data) return <div className="text-white/50 text-sm animate-pulse">Checking where it's streaming in India...</div>;
  if ('error' in data) return null;

  const res = data?.results?.IN;
  const groups = [
    { kind: "Free", list: res?.free || [], label: "FREE" },
    { kind: "Flat", list: res?.flatrate || [], label: "Subscribe" },
    { kind: "Rent", list: res?.rent || [], label: "Rent" },
    { kind: "Buy", list: res?.buy || [], label: "Buy" },
  ].filter(g => g.list && g.list.length > 0);

  if (!groups.length)
    return (
      <div className="bg-white/5 rounded-xl p-4 text-center">
        <p className="text-white/70 text-sm">Not currently streaming on Indian OTT platforms.</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ kind, list, label }, gIdx) => (
        <div key={`${kind}-${gIdx}`} className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
          <div className="flex flex-wrap gap-3">
            {list.map((p: any, pIdx: number) => {
              const a = AFFILIATES[p.provider_name];
              const outUrl = a ? a.url(title) : `https://www.google.com/search?q=${encodeURIComponent(p.provider_name + " " + title)}`;
              return (
                <a 
                  key={`${kind}-${p.provider_id || p.provider_name || 'prov'}-${pIdx}`}
                  href={outUrl}
                  target="_blank" 
                  rel="sponsored noopener noreferrer"
                  title={`Watch ${title} on ${p.provider_name}`}
                  className="group relative flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:border-white/30 group-hover:scale-105 transition-all">
                    <img src={IMG(p.logo_path, "w92")!} alt={p.provider_name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  {(a?.badge || kind === 'Free') && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      {a?.badge || 'FREE'}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
