import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Film, X, Loader2 } from 'lucide-react';
import { tmdbSearch, tmdbDetails, tmdbVideos, IMG } from '../lib/tmdb';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

export const TmdbImporter: React.FC<{
  onClose: () => void,
  onImported: (movie: any) => void
}> = ({ onClose, onImported }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await tmdbSearch(query);
      setResults(data.results || []);
    } catch (err) {
      toast.error("Failed to search TMDb");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (tmdbMovie: any) => {
    setImportingId(tmdbMovie.id);
    try {
      const d = await tmdbDetails(tmdbMovie.id);
      const vids = await tmdbVideos(tmdbMovie.id);
      
      const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = slugify(d.title) + "-" + (d.release_date || "").slice(0, 4);
      
      const trailer = vids.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");

      const newMovie: any = {
        tmdb_id: d.id,
        imdb_id: d.imdb_id,
        title: d.title,
        slug: slug,
        release_year: (d.release_date || "").slice(0, 4),
        release_date: d.release_date,
        tagline: d.tagline || "",
        overview: d.overview || "",
        description: d.overview || d.tagline || "", // Critical fix for database NOT NULL constraints
        runtime_min: d.runtime || 0,
        duration: d.runtime ? `${d.runtime} min` : "",
        vote_average: d.vote_average || 0,
        vote_count: d.vote_count || 0,
        genres: (d.genres || []).map((g: any) => g.name),
        poster_path: d.poster_path || "",
        backdrop_path: d.backdrop_path || "",
        homepage: d.homepage || "",
        category: (d.genres && d.genres.length > 0) ? d.genres[0].name : "Other",
        director: "",
        cast: "",
        trailerUrl: trailer ? trailer.key : "",
        is_published: false,
        created_at: new Date().toISOString()
      };

      if (supabase) {
        const { data, error } = await supabase.from('movies').insert([newMovie]).select().single();
        if (error) throw error;
        toast.success(`Tracked ${d.title}!`);
        onImported(data || newMovie);
      } else {
        newMovie.id = Date.now().toString();
        toast.success(`Tracked ${d.title} (Local)`);
        onImported(newMovie);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to track movie");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Film className="text-blue-500" />
              Track from TMDb
            </h2>
            <p className="text-sm text-white/50 mt-1">Search the official movie database to import metadata</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X />
          </button>
        </div>
        
        <div className="p-6 border-b border-white/10">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movie title (e.g., Inception, Jawan)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {results.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <Search size={48} className="mb-4 opacity-50" />
              <p>Search results will appear here.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(r => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-4 hover:bg-white/10 transition-colors">
                <div className="w-16 h-24 bg-zinc-800 rounded-lg shrink-0 overflow-hidden">
                  {r.poster_path ? (
                    <img src={IMG(r.poster_path, 'w185')} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/20">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1 flex flex-col">
                  <h4 className="font-bold text-sm truncate text-white" title={r.title}>{r.title}</h4>
                  <p className="text-xs text-white/50">{r.release_date?.slice(0,4)} • ★ {r.vote_average}</p>
                  
                  <div className="mt-auto">
                    <button
                      onClick={() => handleTrack(r)}
                      disabled={importingId === r.id}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white/10 hover:bg-white/20 disabled:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {importingId === r.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Tracking...</>
                      ) : (
                        <><Plus size={14} /> Track Movie</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
