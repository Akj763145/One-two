const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add missing imports
if (!code.includes('WhereToWatch')) {
  code = code.replace("import { TmdbImporter } from './components/TmdbImporter';", "import { TmdbImporter } from './components/TmdbImporter';\nimport { WhereToWatch } from './components/WhereToWatch';");
}

// 2. Replace the action buttons in the Modal
const actionsRegex = /<motion\.div\s*variants=\{\{\s*hidden:\s*\{\s*opacity:\s*0,\s*y:\s*10\s*\},\s*visible:\s*\{\s*opacity:\s*1,\s*y:\s*0\s*\}\s*\}\}\s*className="flex\s*flex-wrap\s*items-center\s*gap-4\s*mt-8"\s*>([\s\S]*?)<\/motion\.div>/;
const newActions = `<motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="flex flex-wrap items-center gap-4 mt-8"
                >
                  {movie.trailerUrl && (
                    <a 
                      href={movie.trailerUrl.startsWith('http') ? movie.trailerUrl : \`https://www.youtube.com/watch?v=\${movie.trailerUrl}\`}
                      target="_blank" rel="noopener noreferrer"
                      className="bg-white text-black px-8 md:px-10 py-2.5 rounded font-black flex items-center justify-center gap-2 md:gap-3 hover:bg-white/90 transition-all text-sm md:text-lg active:scale-95 shadow-lg"
                    >
                      <Play size={20} className="fill-current" /> Watch Trailer
                    </a>
                  )}
                  
                  <button 
                    onClick={handleShare}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#141414]/80 hover:bg-white/10 text-white rounded-full transition-all border-2 border-white/40 active:scale-95 group ml-auto md:ml-0"
                    title="Share"
                  >
                    <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </motion.div>`;
code = code.replace(actionsRegex, newActions);

// 3. Update the content section (add overview, tagline, runtime, WhereToWatch)
const contentRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-12">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* Trailer Section \*\/\}/;
const newContent = `<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                <span className="text-[#46d369]">★ {movie.vote_average || 'New'}</span>
                <span className="text-white/60">{movie.release_year || '2026'}</span>
                <span className="border border-white/40 px-1.5 py-0.5 text-[10px] rounded text-white/90">{movie.runtime_min ? \`\${movie.runtime_min}m\` : '120m'}</span>
                <span className="border border-white/30 px-1 py-0.5 text-[9px] rounded-sm text-white/50 uppercase leading-none">HD</span>
              </div>
              
              {(movie.tagline) && (
                <p className="text-xl md:text-2xl text-white/60 font-light italic">"{movie.tagline}"</p>
              )}
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light">
                {movie.overview || movie.description}
              </p>

              {movie.notes && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Why Watch It?</h4>
                  <p className="text-white/80 leading-relaxed text-sm">{movie.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-8 text-xs md:text-sm">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Where to Watch</h4>
                {movie.tmdb_id ? (
                  <WhereToWatch tmdbId={movie.tmdb_id} title={movie.title} />
                ) : (
                  <div className="text-white/50">Tracking data not available.</div>
                )}
              </div>
              
              <div className="space-y-4">
                {movie.cast && (
                  <div className="leading-relaxed">
                    <span className="text-white/40 font-medium block mb-1">Cast</span>
                    <span className="text-white/80">{movie.cast}</span>
                  </div>
                )}
                {movie.director && (
                  <div className="leading-relaxed">
                    <span className="text-white/40 font-medium block mb-1">Director</span>
                    <span className="text-white/80">{movie.director}</span>
                  </div>
                )}
                <div className="leading-relaxed">
                  <span className="text-white/40 font-medium block mb-1">Genres</span>
                  <span className="text-white/80">{movie.genres?.join(', ') || movie.category}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Trailer Section */}`;
code = code.replace(contentRegex, newContent);

// Remove the old trailer section if it exists, or just keep it since it adds a nice visual play button for trailer
// Wait, the new content replacement kept {/* Trailer Section */}.
// Let's remove the "Download" old button that was mapped to movie.url
// We already removed it from the actionsRegex!

// Finally, fix the unique key warning: "Encountered two children with the same key"
// This usually happens in the lists: <MovieCard key={movie.id} ... />
// We can change it to <MovieCard key={movie.id + '-' + index} ... />
code = code.replace(/key=\{movie\.id\}/g, "key={`${movie.id}-${index}`}");

fs.writeFileSync('src/App.tsx', code);
