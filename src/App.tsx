import React, { useState, useEffect } from 'react';
import { Search, Shield, Plus, X, Edit, Trash2, Download, Play, Star, Film, LogOut, ChevronRight, Eye, MoreVertical, Moon, Sun, Settings } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/free-mode';

interface Movie {
  id: string;
  title: string;
  url: string;
  viewUrl?: string;
  posterUrl: string;
  description: string;
  created_at?: string;
}

const INITIAL_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The raja Saab',
    url: '#',
    viewUrl: '#',
    posterUrl: 'https://picsum.photos/seed/raja/600/900',
    description: 'Download now'
  }
];

const WelcomeAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 1, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-black transition-colors duration-500"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <Logo className="scale-150" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-black/50 dark:text-white/50 tracking-[0.2em] uppercase text-sm mt-12 font-medium"
        >
          Movie Wallah Originals
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

const Logo: React.FC<{ className?: string, showText?: boolean }> = ({ className = "", showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
        {/* Circular borders */}
        <div className="absolute inset-0 border-2 border-current rounded-full" />
        <div className="absolute inset-[3px] border border-red-600 rounded-full" />
        {/* MW Text */}
        <div className="relative flex flex-col items-center leading-none">
          <span className="text-current font-serif text-lg md:text-xl font-bold -mb-1">M</span>
          <span className="text-current font-serif text-lg md:text-xl font-bold">W</span>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-red-600 font-bold text-xl md:text-2xl tracking-tight uppercase">Movie</span>
            <span className="text-current font-bold text-xl md:text-2xl tracking-tight uppercase">Wallah</span>
          </div>
          <div className="flex flex-col mt-0.5 leading-tight">
            <span className="text-[7px] md:text-[9px] text-current opacity-40 tracking-[0.15em] uppercase font-medium">
              Proudly made by Bihari
            </span>
            <span className="text-[6px] md:text-[8px] text-red-600 dark:text-red-500 tracking-[0.2em] uppercase font-bold">
              Developed by AYUSH
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar: React.FC<{ 
  isAdmin: boolean, 
  onAdminClick: () => void, 
  onLogout: () => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  onAddClick: () => void,
  isDark: boolean,
  toggleTheme: () => void,
  isSearchActive: boolean,
  setIsSearchActive: (active: boolean) => void
}> = ({ isAdmin, onAdminClick, onLogout, searchQuery, setSearchQuery, onAddClick, isDark, toggleTheme, isSearchActive, setIsSearchActive }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 md:px-16 py-4 flex items-center justify-between ${
      isScrolled 
        ? 'bg-white/80 dark:bg-black/90 backdrop-blur-2xl border-b border-black/5 dark:border-white/10 py-3' 
        : 'bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-black/5 dark:border-white/5'
    }`}>
      <div className={`flex items-center gap-12 flex-shrink-0 transition-all duration-300 ${isSearchActive ? 'opacity-0 -translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        <div className="cursor-pointer" onClick={() => { setSearchQuery(''); setIsSearchActive(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Logo />
        </div>
      </div>

      {/* Search Bar - Centered */}
      <div className={`absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 transition-all duration-500 ${isSearchActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-current opacity-30 group-focus-within:opacity-100 transition-opacity" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            autoFocus={isSearchActive}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies, series, originals..." 
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full pl-12 pr-12 py-3 text-sm focus:bg-black/10 dark:focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/20 transition-all placeholder-current/20 shadow-xl"
          />
          <button 
            onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} className="opacity-50" />
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-4 md:gap-8 transition-all duration-300 ${isSearchActive ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        {/* Search Toggle */}
        <button 
          onClick={() => setIsSearchActive(true)}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Search size={22} className="opacity-60 hover:opacity-100 transition-opacity" />
        </button>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="relative">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-all shadow-lg border border-white/10"
                title="Admin Options"
              >
                <MoreVertical size={20} />
              </button>

              <AnimatePresence>
                {showAdminMenu && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowAdminMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-56 bg-zinc-900 text-white rounded-2xl p-2 shadow-2xl border border-white/10 overflow-hidden"
                    >
                      <div className="px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Admin Control</div>
                      <button 
                        onClick={() => { onAddClick(); setShowAdminMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
                      >
                        <Plus size={18} className="text-emerald-400" /> Add New Movie
                      </button>
                      <button 
                        onClick={() => setShowAdminMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        <Shield size={18} className="text-blue-400" /> Admin Dashboard
                      </button>
                      <button 
                        onClick={() => setShowAdminMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium opacity-50 cursor-not-allowed"
                      >
                        <Star size={18} className="text-yellow-400" /> Featured Content
                      </button>
                      
                      <div className="h-px bg-white/10 my-1" />
                      
                      <button 
                        onClick={() => { onLogout(); setShowAdminMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors text-sm font-medium"
                      >
                        <LogOut size={18} /> Logout Admin
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-current opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            >
              {isAdmin ? <Settings size={20} /> : <MoreVertical size={20} />}
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl p-2 shadow-2xl overflow-hidden"
                  >
                  <div className="px-4 py-2 text-[10px] font-bold text-current opacity-30 uppercase tracking-widest">Settings</div>
                    <button 
                      onClick={() => { toggleTheme(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      {isDark ? <Sun size={18} /> : <Moon size={18} />}
                      {isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    
                    {!isAdmin && (
                      <>
                        <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                        <div className="px-4 py-2 text-[10px] font-bold text-current opacity-30 uppercase tracking-widest">Account</div>
                        <button 
                          onClick={() => { onAdminClick(); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                          <Shield size={18} /> Admin Login
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '', url: '', viewUrl: '', posterUrl: '', description: ''
  });

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('movieWallah_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    fetchMovies();
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('movieWallah_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('movieWallah_theme', 'light');
    }
  };

  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('movieWallah_movies', JSON.stringify(movies));
    }
  }, [movies]);

  const fetchMovies = async () => {
    if (!supabase) {
      const savedMovies = localStorage.getItem('movieWallah_movies');
      setMovies(savedMovies ? JSON.parse(savedMovies) : INITIAL_MOVIES);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.from('movies').select('id, title, url, viewUrl, posterUrl, description, created_at').order('created_at', { ascending: false });
    if (!error && data) setMovies(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % Math.min(movies.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [movies.length]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (adminPassword === 'qqq') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      setErrorMsg('Incorrect password');
    }
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const movieData = { ...formData };

    if (!supabase) {
      if (editingMovie) {
        setMovies(movies.map(m => m.id === editingMovie.id ? { ...m, ...movieData } : m));
      } else {
        setMovies([{ ...movieData, id: Date.now().toString() }, ...movies]);
      }
    } else {
      if (editingMovie) {
        const { error } = await supabase.from('movies').update(movieData).eq('id', editingMovie.id);
        if (error) return setErrorMsg('Error updating movie: ' + error.message);
        setMovies(movies.map(m => m.id === editingMovie.id ? { ...m, ...movieData } : m));
      } else {
        const { data, error } = await supabase.from('movies').insert([movieData]).select('id, title, url, viewUrl, posterUrl, description, created_at');
        if (error) return setErrorMsg('Error adding movie: ' + error.message);
        if (data && data.length > 0) setMovies([...data, ...movies]);
        else {
          setMovies([{ ...movieData, id: Date.now().toString() }, ...movies]);
          fetchMovies();
        }
      }
    }
    
    setShowAddEditModal(false);
    setFormData({ title: '', url: '', viewUrl: '', posterUrl: '', description: '' });
    setEditingMovie(null);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title, url: movie.url, viewUrl: movie.viewUrl || '',
      posterUrl: movie.posterUrl, description: movie.description
    });
    setShowAddEditModal(true);
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;
    if (supabase) await supabase.from('movies').delete().eq('id', movieToDelete);
    setMovies(movies.filter(m => m.id !== movieToDelete));
    setMovieToDelete(null);
  };

  const handleDownload = async (movieId: string) => {
    // Download tracking removed
  };

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const featuredMovies = movies.slice(0, 5);
  const featuredMovie = featuredMovies[currentHeroIndex] || null;
  const trendingMovies = movies.slice(0, 10);

  return (
    <div className={`min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-red-500/30 transition-colors duration-500 overflow-x-hidden ${isDark ? 'dark' : ''}`}>
      <AnimatePresence>
        {/* Welcome animation removed */}
      </AnimatePresence>

      {/* Main Content */}
      <Navbar 
        isAdmin={isAdmin} 
        onAdminClick={() => setShowAdminLogin(true)} 
        onLogout={() => setIsAdmin(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddClick={() => { setEditingMovie(null); setFormData({ title: '', url: '', viewUrl: '', posterUrl: '', description: '' }); setShowAddEditModal(true); }}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isSearchActive={isSearchActive}
        setIsSearchActive={setIsSearchActive}
      />
      
      <main className="pt-20 md:pt-24 pb-24">
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            {featuredMovie && !searchQuery && !isSearchActive && (
              <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featuredMovie.id}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <img 
                      src={featuredMovie.posterUrl} 
                      alt={featuredMovie.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent" />
                    
                    <div className="absolute inset-0 flex items-end pb-20 md:pb-32 px-6 md:px-16">
                      <div className="max-w-3xl">
                        <motion.h1 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                          className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter text-shadow-xl"
                        >
                          {featuredMovie.title}
                        </motion.h1>
                        
                        <motion.p 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                          className="text-base md:text-lg text-white/90 mb-8 line-clamp-3 max-w-2xl font-medium text-shadow-lg leading-relaxed"
                        >
                          {featuredMovie.description}
                        </motion.p>
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                          className="flex flex-wrap items-center gap-5"
                        >
                          {featuredMovie.viewUrl && (
                            <a href={featuredMovie.viewUrl} target="_blank" rel="noopener noreferrer" className="apple-btn-primary !bg-white !text-black !px-10 !py-4 !text-lg">
                              <Play size={24} className="fill-current" /> Play Now
                            </a>
                          )}
                          <a 
                            href={featuredMovie.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={() => handleDownload(featuredMovie.id)}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all group" 
                            title="Download"
                          >
                            <Download size={20} className="group-hover:scale-110 transition-transform" />
                          </a>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Hero Indicators */}
                {featuredMovies.length > 1 && (
                  <div className="absolute bottom-10 right-16 z-30 flex gap-3">
                    {featuredMovies.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroIndex(idx)}
                        className={`h-1.5 transition-all duration-500 rounded-full ${
                          idx === currentHeroIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search Results or Rows */}
            <div className={`px-6 md:px-16 ${searchQuery || !featuredMovie ? 'pt-12' : 'mt-12 relative z-20'}`}>
              {searchQuery ? (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    Search Results <span className="text-black/50 dark:text-white/50 font-normal text-lg">for "{searchQuery}"</span>
                  </h2>
                  {filteredMovies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                      {filteredMovies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
                      <Search size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
                      <h3 className="text-xl font-bold mb-2">No results found</h3>
                      <p className="text-black/50 dark:text-white/50">Try adjusting your search query.</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Trending Row */}
                  {trendingMovies.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Trending Now</h2>
                        <button className="text-sm font-medium text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white flex items-center transition-colors">
                          See All <ChevronRight size={16} />
                        </button>
                      </div>
                      <Swiper
                        slidesPerView="auto"
                        spaceBetween={24}
                        freeMode={true}
                        mousewheel={{ forceToAxis: true }}
                        modules={[FreeMode, Mousewheel]}
                        className="w-full !overflow-visible"
                      >
                        {trendingMovies.map((movie) => (
                          <SwiperSlide key={movie.id} className="!w-[160px] md:!w-[220px]">
                            <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  )}

                  {/* All Movies Grid */}
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">Watch Next</h2>
                    </div>
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8"
                    >
                      {movies.map((movie) => (
                        <motion.div
                          key={movie.id}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 border-t border-black/5 dark:border-white/10 bg-white dark:bg-black transition-colors duration-500">
        <div className="flex flex-col items-center gap-8">
          <Logo className="scale-125" />
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-black/40 dark:text-white/40 text-sm font-medium uppercase tracking-[0.2em]">Proudly made by Bihari</p>
            <p className="text-red-600 dark:text-red-500 text-xs font-bold uppercase tracking-[0.3em]">Developed by AYUSH</p>
          </div>
          
          <div className="flex items-center gap-6 text-black/30 dark:text-white/30 text-xs uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-red-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-red-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-red-600 transition-colors">Contact Us</a>
          </div>
          
          <p className="text-black/10 dark:text-white/10 text-[10px] uppercase tracking-[0.3em] mt-4">
            © 2026 Movie Wallah. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div key="admin-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 dark:bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-sm glass-panel rounded-3xl p-8 relative bg-white dark:bg-white/10">
              <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 text-current opacity-50 hover:opacity-100 bg-current/10 rounded-full p-1 transition-colors"><X size={20} /></button>
              <div className="flex justify-center mb-6"><div className="w-16 h-16 rounded-full bg-current/10 flex items-center justify-center"><Shield size={32} className="text-current" /></div></div>
              <h3 className="text-2xl font-bold text-center mb-2">Admin Access</h3>
              <p className="text-current opacity-50 text-center text-sm mb-6">Enter your password to manage movies.</p>
              <form onSubmit={handleAdminLogin}>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Password" className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-current placeholder-current/30 focus:outline-none focus:ring-2 focus:ring-current/50 transition-all mb-4" autoFocus />
                {errorMsg && <p className="text-red-400 text-xs mb-4 text-center">{errorMsg}</p>}
                <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl py-3 hover:opacity-90 transition-opacity">Unlock</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddEditModal && (
          <motion.div key="add-edit-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 dark:bg-black/80 backdrop-blur-xl overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 relative my-8 bg-white dark:bg-white/10">
              <button onClick={() => setShowAddEditModal(false)} className="absolute top-6 right-6 text-current opacity-50 hover:opacity-100 bg-current/10 rounded-full p-1 transition-colors"><X size={20} /></button>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-current">{editingMovie ? <Edit size={24} /> : <Plus size={24} />} {editingMovie ? 'Edit Movie' : 'Add New Movie'}</h3>
              {errorMsg && <div className="bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">{errorMsg}</div>}
              <form onSubmit={handleSaveMovie} className="space-y-4">
                <div><label className="block text-xs font-medium text-current opacity-50 uppercase tracking-wider mb-1.5 pl-1">Movie Title *</label><input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-current focus:outline-none focus:ring-2 focus:ring-current/50 transition-all" placeholder="e.g. Inception" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-current opacity-50 uppercase tracking-wider mb-1.5 pl-1">Download URL *</label><input required type="url" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-current focus:outline-none focus:ring-2 focus:ring-current/50 transition-all" placeholder="https://..." /></div>
                  <div><label className="block text-xs font-medium text-current opacity-50 uppercase tracking-wider mb-1.5 pl-1">Watch URL (Optional)</label><input type="url" value={formData.viewUrl} onChange={(e) => setFormData({...formData, viewUrl: e.target.value})} className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-current focus:outline-none focus:ring-2 focus:ring-current/50 transition-all" placeholder="https://..." /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-current opacity-50 uppercase tracking-wider mb-1.5 pl-1">Poster Image URL *</label><input required type="url" value={formData.posterUrl} onChange={(e) => setFormData({...formData, posterUrl: e.target.value})} className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-current focus:outline-none focus:ring-2 focus:ring-current/50 transition-all" placeholder="https://..." /></div>
                </div>
                <div><label className="block text-xs font-medium text-current opacity-50 uppercase tracking-wider mb-1.5 pl-1">Description *</label><textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-current focus:outline-none focus:ring-2 focus:ring-current/50 transition-all resize-none" placeholder="A brief synopsis..." /></div>
                <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-current font-bold rounded-xl py-3 transition-colors">Cancel</button><button type="submit" className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold rounded-xl py-3 transition-opacity">{editingMovie ? 'Save Changes' : 'Add Movie'}</button></div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {movieToDelete && (
          <motion.div key="delete-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 dark:bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm glass-panel rounded-3xl p-6 text-center bg-white dark:bg-white/10">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-red-500" /></div>
              <h3 className="text-xl font-bold mb-2 text-current">Delete Movie</h3>
              <p className="text-current opacity-50 mb-6 text-sm">Are you sure you want to delete this movie? This action cannot be undone.</p>
              <div className="flex gap-3"><button onClick={() => setMovieToDelete(null)} className="flex-1 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-current font-bold rounded-xl py-3 transition-colors">Cancel</button><button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-3 transition-colors">Delete</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MovieCard: React.FC<{ movie: Movie, isAdmin: boolean, onEdit: (m: Movie) => void, onDelete: (id: string) => void, onDownload: (id: string) => void }> = ({ movie, isAdmin, onEdit, onDelete, onDownload }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3 group w-full"
    >
      <div className="relative rounded-2xl overflow-hidden aspect-[2/3] w-full bg-black/5 dark:bg-white/5 shadow-xl ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-black/10 dark:group-hover:ring-white/30 transition-all">
        {/* Skeleton Loader */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-current opacity-10 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <img 
          src={movie.posterUrl} 
          alt={movie.title} 
          onLoad={() => setIsImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-sm'}`} 
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Rating & Views Badges removed */}

        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      <div className="flex flex-col gap-2.5 px-1">
        <h3 className="text-current font-bold text-sm md:text-base leading-tight group-hover:opacity-80 transition-opacity">
          {movie.title}
        </h3>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {movie.viewUrl && (
              <a 
                href={movie.viewUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all active:scale-95"
              >
                <Play size={14} className="fill-current" /> Watch
              </a>
            )}
            <a 
              href={movie.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => onDownload(movie.id)}
              className="flex-1 bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-current py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black/10 dark:hover:bg-white/20 transition-all active:scale-95"
            >
              <Download size={14} /> Download
            </a>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5 mt-1">
              <button 
                onClick={() => onEdit(movie)}
                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Edit size={14} /> Edit
              </button>
              <button 
                onClick={() => onDelete(movie.id)}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
