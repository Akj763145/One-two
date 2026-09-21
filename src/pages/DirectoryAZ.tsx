import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';
import { SEED_MOVIES } from '../data/seedMovies';
import { Star, Film, ChevronRight } from 'lucide-react';

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export default function DirectoryAZ() {
  const [selectedLetter, setSelectedLetter] = useState<string>('All');

  // Sort movies alphabetically
  const allMovies = [...SEED_MOVIES].sort((a, b) => a.title.localeCompare(b.title));

  const filteredMovies = selectedLetter === 'All'
    ? allMovies
    : selectedLetter === '#'
    ? allMovies.filter(m => /^\d/.test(m.title))
    : allMovies.filter(m => m.title.toUpperCase().startsWith(selectedLetter));

  return (
    <LegalLayout
      title="A-Z Movie Directory"
      subtitle="Complete alphabetical index of movies, streaming availability guides, trailers, and reviews."
    >
      {/* Alphabet Bar */}
      <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-white/10">
        <button
          onClick={() => setSelectedLetter('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedLetter === 'All'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          All ({allMovies.length})
        </button>
        {ALPHABET.map((char) => {
          const count = char === '#'
            ? allMovies.filter(m => /^\d/.test(m.title)).length
            : allMovies.filter(m => m.title.toUpperCase().startsWith(char)).length;

          return (
            <button
              key={char}
              onClick={() => setSelectedLetter(char)}
              disabled={count === 0}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                selectedLetter === char
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : count > 0
                  ? 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                  : 'bg-white/[0.02] text-white/20 cursor-not-allowed'
              }`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Movie List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMovies.map((movie) => {
          const slug = movie.slug || `${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${movie.id}`;
          return (
            <Link
              key={movie.id}
              to={`/movie/${slug}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 transition-all group"
            >
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0">
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Film size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base truncate group-hover:text-red-400 transition-colors">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                  <span>{movie.release_year || 'Movie'}</span>
                  <span>•</span>
                  <span>{movie.category || 'Feature'}</span>
                  {movie.vote_average && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star size={12} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-white/20 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>

      {filteredMovies.length === 0 && (
        <div className="text-center py-16 text-white/40">
          <p>No titles currently listed under '{selectedLetter}'.</p>
        </div>
      )}
    </LegalLayout>
  );
}
