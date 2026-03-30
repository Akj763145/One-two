import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Shield, Plus, X, Edit, Trash2, Download, Play, Star, Film, LogOut, ChevronRight, Eye, MoreVertical, Settings, ChevronLeft, ThumbsUp, FileText, Link, Info, BarChart3, Share2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel, EffectCoverflow, Autoplay, Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import AdsterraAd from './components/AdsterraAd';
import AdsterraNativeBanner from './components/AdsterraNativeBanner';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface Movie {
  id: string;
  title: string;
  url: string;
  viewUrl?: string;
  posterUrl: string;
  description: string;
  category?: string;
  director?: string;
  cast?: string;
  created_at?: string;
  downloads?: number;
  views?: number;
  is_hero?: boolean;
  release_year?: string;
  maturity_rating?: string;
  duration?: string;
  quality?: string;
  match_score?: number;
}

interface Review {
  id: string;
  movie_id: string;
  user_name: string;
  rating: number;
  text: string;
  created_at?: string;
}

const INITIAL_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The raja Saab',
    url: '#',
    viewUrl: '#',
    posterUrl: 'https://picsum.photos/seed/raja/600/900',
    description: 'Download now',
    category: 'Action',
    downloads: 0,
    views: 0
  }
];

const CATEGORIES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Other'];

const WelcomeAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 1, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black transition-colors duration-500"
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
          className="text-white/50 tracking-[0.2em] uppercase text-sm mt-12 font-medium"
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
            <span className="text-[6px] md:text-[8px] text-red-500 tracking-[0.2em] uppercase font-bold">
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
  isSearchActive: boolean,
  setIsSearchActive: (active: boolean) => void,
  movies: Movie[],
  onDMCAClick: () => void,
  adminView: 'all' | 'featured',
  setAdminView: (view: 'all' | 'featured') => void,
  setActiveCategory: (cat: string) => void
}> = ({ isAdmin, onAdminClick, onLogout, searchQuery, setSearchQuery, onAddClick, isSearchActive, setIsSearchActive, movies, onDMCAClick, adminView, setAdminView, setActiveCategory }) => {
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
        ? 'bg-black/90 backdrop-blur-2xl border-b border-white/10 py-3' 
        : 'bg-black/40 backdrop-blur-md border-b border-white/5'
    }`}>
      <div className={`flex items-center gap-8 md:gap-12 flex-shrink-0 transition-all duration-300 ${isSearchActive ? 'opacity-0 -translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        <div className="cursor-pointer" onClick={() => { setSearchQuery(''); setIsSearchActive(false); setActiveCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Logo />
        </div>
        
        {isAdmin && (
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setAdminView('all')}
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-white ${adminView === 'all' ? 'text-white border-b-2 border-red-600 pb-1' : 'text-white/40'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setAdminView('featured')}
              className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-white ${adminView === 'featured' ? 'text-white border-b-2 border-red-600 pb-1' : 'text-white/40'}`}
            >
              Featured
            </button>
            <button 
              onClick={onAddClick}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20"
            >
              <Plus size={14} /> Add Movie
            </button>
          </div>
        )}
      </div>

      {/* Search Bar - Centered */}
      <div className={`absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 transition-all duration-500 ${isSearchActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="p-[1px] rounded-full bg-gradient-to-r from-red-500 to-red-900 shadow-xl shadow-red-500/10">
          <div className="relative group bg-black rounded-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 opacity-80 group-focus-within:opacity-100 transition-opacity" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              autoFocus={isSearchActive}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, series, originals..." 
              className="w-full bg-transparent border-none rounded-full pl-12 pr-12 py-3 text-sm focus:outline-none transition-all placeholder-white/30 text-white"
            />
            <button 
              onClick={() => { setIsSearchActive(false); setSearchQuery(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <X size={18} className="opacity-50 hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>

      <div className={`flex items-center gap-4 md:gap-8 transition-all duration-300 ${isSearchActive ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        {/* Search Toggle */}
        <button 
          onClick={() => setIsSearchActive(true)}
          className="p-[1px] rounded-full bg-gradient-to-r from-red-500 to-red-900 hover:from-red-400 hover:to-red-800 transition-all shadow-lg shadow-red-500/20"
        >
          <div className="bg-black rounded-full p-2">
            <Search size={22} className="text-white opacity-80 hover:opacity-100 transition-opacity" />
          </div>
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
                      
                      {/* Total Stats */}
                      <div className="mx-2 mb-2 bg-white/5 rounded-xl border border-white/10 p-3 flex justify-between items-center">
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-[10px] text-white/50 flex items-center gap-1 uppercase tracking-wider font-bold mb-1"><Eye size={10} /> Views</span>
                          <span className="font-bold text-lg leading-none text-blue-400">
                            {movies.reduce((sum, m) => sum + (m.views || 0), 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2"></div>
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-[10px] text-white/50 flex items-center gap-1 uppercase tracking-wider font-bold mb-1"><Download size={10} /> Dls</span>
                          <span className="font-bold text-lg leading-none text-emerald-400">
                            {movies.reduce((sum, m) => sum + (m.downloads || 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => { onAddClick(); setShowAdminMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
                      >
                        <Plus size={18} className="text-emerald-400" /> Add New Movie
                      </button>
                      <button 
                        onClick={() => { setAdminView('all'); setShowAdminMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium ${adminView === 'all' ? 'bg-white/10 text-white' : 'text-white/70'}`}
                      >
                        <Shield size={18} className="text-blue-400" /> Admin Dashboard
                      </button>
                      <button 
                        onClick={() => { setAdminView('featured'); setShowAdminMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium ${adminView === 'featured' ? 'bg-white/10 text-white' : 'text-white/70'}`}
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
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-current opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"
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
                    {!isAdmin && (
                      <>
                        <div className="px-4 py-2 text-[10px] font-bold text-current opacity-30 uppercase tracking-widest">Account</div>
                        <button 
                          onClick={() => { onAdminClick(); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                          <Shield size={18} /> Admin Login
                        </button>
                      </>
                    )}
                    <div className="h-px bg-white/10 my-1" />
                    <button 
                      onClick={() => { onDMCAClick(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-red-400"
                    >
                      <Shield size={18} /> DMCA Policy
                    </button>
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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);
  const hasHandledInitialUrl = useRef(false);
  const [showDMCA, setShowDMCA] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [adminView, setAdminView] = useState<'all' | 'featured'>('all');
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '', url: '', viewUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, director: '', cast: '',
    release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0
  });

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    fetchMovies();
  }, []);

  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('movieWallah_movies', JSON.stringify(movies));
    }
  }, [movies]);

  useEffect(() => {
    const heroMovies = movies.filter(m => m.is_hero);
    const featured = heroMovies.length > 0 ? heroMovies : movies.slice(0, 5);
    if (featured.length > 0) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = featured[0].posterUrl;
      // @ts-ignore
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [movies]);

  // Handle URL query parameter to open movie details modal (Initial load only)
  useEffect(() => {
    if (hasHandledInitialUrl.current || movies.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('movie');
    if (movieId && !selectedMovieForDetails) {
      const movie = movies.find(m => m.id === movieId);
      if (movie) {
        setSelectedMovieForDetails(movie);
        hasHandledInitialUrl.current = true;
      }
    }
  }, [movies]);

  // Sync URL with selected movie and clean up
  useEffect(() => {
    const url = new URL(window.location.href);
    const currentMovieId = url.searchParams.get('movie');
    
    if (selectedMovieForDetails) {
      if (currentMovieId !== selectedMovieForDetails.id) {
        url.searchParams.set('movie', selectedMovieForDetails.id);
        window.history.replaceState({}, '', url);
      }
    } else if (currentMovieId && !isLoading) {
      // Only remove if we are not loading and no movie is selected
      url.searchParams.delete('movie');
      window.history.replaceState({}, '', url);
    }
  }, [selectedMovieForDetails, isLoading]);

  // Handle browser back button to close movie details modal
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (selectedMovieForDetails) {
        setSelectedMovieForDetails(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMovieForDetails) {
        if (window.history.state?.modal === 'movie-details') {
          window.history.back();
        }
        setSelectedMovieForDetails(null);
      }
    };

    if (selectedMovieForDetails) {
      // Push a new state when the modal opens
      window.history.pushState({ modal: 'movie-details' }, '');
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedMovieForDetails !== null]);

  // Handle browser back button to close search
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isSearchActive) {
        setIsSearchActive(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchActive) {
        if (window.history.state?.modal === 'search') {
          window.history.back();
        }
        setIsSearchActive(false);
        setSearchQuery('');
      }
    };

    if (isSearchActive) {
      // Push a new state when search opens
      window.history.pushState({ modal: 'search' }, '');
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchActive]);

  // Also lock scroll for other modals
  useEffect(() => {
    if (showAddEditModal || showDMCA || showAdminLogin || movieToDelete) {
      document.body.style.overflow = 'hidden';
    } else if (!selectedMovieForDetails) {
      document.body.style.overflow = 'unset';
    }
  }, [showAddEditModal, showDMCA, showAdminLogin, movieToDelete, selectedMovieForDetails]);

  const fetchMovies = async () => {
    if (!supabase) {
      const savedMovies = localStorage.getItem('movieWallah_movies');
      setMovies(savedMovies ? JSON.parse(savedMovies) : INITIAL_MOVIES);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching movies:', error.message);
      setErrorMsg('Failed to load movies. Please try again.');
    } else if (data) {
      setMovies(data);
    }
    setIsLoading(false);
  };

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
        const { data, error } = await supabase.from('movies').insert([movieData]).select('*');
        if (error) return setErrorMsg('Error adding movie: ' + error.message);
        if (data && data.length > 0) setMovies([...data, ...movies]);
        else {
          setMovies([{ ...movieData, id: Date.now().toString(), downloads: 0, views: 0 }, ...movies]);
          fetchMovies();
        }
      }
    }
    
    setShowAddEditModal(false);
    setFormData({ title: '', url: '', viewUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, director: '', cast: '', release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0 });
    setEditingMovie(null);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title, url: movie.url, viewUrl: movie.viewUrl || '',
      posterUrl: movie.posterUrl, description: movie.description,
      category: movie.category || 'Other',
      is_hero: movie.is_hero || false,
      director: movie.director || '',
      cast: movie.cast || '',
      release_year: movie.release_year || '',
      maturity_rating: movie.maturity_rating || '18+',
      duration: movie.duration || '',
      quality: movie.quality || 'HD',
      match_score: movie.match_score || 98,
      downloads: movie.downloads || 0,
      views: movie.views || 0
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
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    const newDownloads = (movie.downloads || 0) + 1;
    setMovies(prev => prev.map(m => m.id === movieId ? { ...m, downloads: newDownloads } : m));

    if (supabase) {
      try {
        const { error } = await supabase.from('movies').update({ downloads: newDownloads }).eq('id', movieId);
        if (error) console.error('Error updating downloads:', error.message);
      } catch (err) {
        console.error('Failed to update downloads:', err);
      }
    }
  };

  const handleView = async (movieId: string) => {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    const newViews = (movie.views || 0) + 1;
    setMovies(prev => prev.map(m => m.id === movieId ? { ...m, views: newViews } : m));

    if (supabase) {
      try {
        const { error } = await supabase.from('movies').update({ views: newViews }).eq('id', movieId);
        if (error) console.error('Error updating views:', error.message);
      } catch (err) {
        console.error('Failed to update views:', err);
      }
    }
  };

  const filteredMovies = React.useMemo(() => {
    const query = deferredSearchQuery.toLowerCase().trim();
    if (!query && activeCategory === 'All') return movies;

    return movies.filter(m => {
      const matchesSearch = !query || 
        m.title.toLowerCase().includes(query) ||
        (m.cast && m.cast.toLowerCase().includes(query)) ||
        (m.director && m.director.toLowerCase().includes(query));
      
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [movies, deferredSearchQuery, activeCategory]);

  const currentMovies = filteredMovies;

  const heroMovies = movies.filter(m => m.is_hero);
  const featuredMovies = heroMovies.length > 0 ? heroMovies : movies.slice(0, 5);
  const trendingMovies = movies.slice(0, 10);

  return (
    <div className={`min-h-screen bg-black text-white font-sans selection:bg-red-500/30 transition-colors duration-500 overflow-x-hidden dark`}>
      <AnimatePresence>
        {/* Welcome animation removed */}
      </AnimatePresence>

      {/* Main Content */}
      <Navbar 
        isAdmin={isAdmin} 
        onAdminClick={() => setShowAdminLogin(true)} 
        onLogout={() => { setIsAdmin(false); setAdminView('all'); }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddClick={() => { setEditingMovie(null); setFormData({ title: '', url: '', viewUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, director: '', cast: '', release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0 }); setShowAddEditModal(true); }}
        isSearchActive={isSearchActive}
        setIsSearchActive={(active) => {
          if (!active && window.history.state?.modal === 'search') {
            window.history.back();
          }
          setIsSearchActive(active);
          if (!active) setSearchQuery('');
        }}
        movies={movies}
        onDMCAClick={() => setShowDMCA(true)}
        adminView={adminView}
        setAdminView={setAdminView}
        setActiveCategory={setActiveCategory}
      />
      
      <main className="pt-20 md:pt-24 pb-24">
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isAdmin && adminView === 'featured' ? (
          <div className="px-6 md:px-16 pt-12">
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Star className="text-yellow-500" /> Featured Content (Hero Section)
              </h2>
              <p className="text-white/50 mb-8">These movies are currently featured in the Hero section on the homepage.</p>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  {heroMovies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {heroMovies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={setSelectedMovieForDetails} searchQuery={searchQuery} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                      <Star size={48} className="mx-auto mb-4 text-white/20" />
                      <h3 className="text-xl font-bold mb-2">No Featured Movies</h3>
                      <p className="text-white/50">Edit a movie and check "Show in Hero Section" to feature it.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            {featuredMovies.length > 0 && !searchQuery && !isSearchActive && activeCategory === 'All' && (
              <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden pt-10 md:pt-16">
                <Swiper
                  effect={'coverflow'}
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView={'auto'}
                  loop={true}
                  speed={1500}
                  autoplay={{
                    delay: 2000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  mousewheel={{
                    forceToAxis: true,
                    sensitivity: 1,
                  }}
                  coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2,
                    slideShadows: false,
                  }}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  modules={[EffectCoverflow, Autoplay, Pagination, Mousewheel]}
                  className="hero-swiper w-full h-full !px-4 md:!px-20"
                >
                  {featuredMovies.map((movie) => (
                    <SwiperSlide key={movie.id} className="!w-[85vw] md:!w-[800px] !h-[55vh] md:!h-[75vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
                      <MoviePoster src={movie.posterUrl} alt={movie.title} className="hero-zoom-img" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
                      >
                        <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg tracking-tight">{movie.title}</h2>
                        {movie.category && (
                          <span className="inline-block w-fit text-[10px] md:text-xs font-bold uppercase tracking-widest bg-red-600 text-white px-3 py-1 rounded-full mb-4">
                            {movie.category}
                          </span>
                        )}
                        <div className="flex items-center gap-4">
                          {movie.viewUrl && (
                            <a href={movie.viewUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleView(movie.id)} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl">
                              <Play size={18} className="fill-current" /> Watch Now
                            </a>
                          )}
                          <button 
                            onClick={() => setSelectedMovieForDetails(movie)}
                            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
                          >
                            <Info size={18} /> More Info
                          </button>
                          <a 
                            href={movie.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={() => handleDownload(movie.id)}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-110 active:scale-90"
                          >
                            <Download size={20} />
                          </a>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* Search Results or Rows */}
            <div className={`px-6 md:px-16 ${searchQuery || featuredMovies.length === 0 || activeCategory !== 'All' ? 'pt-12' : 'mt-12 relative z-20'}`}>
              
              {/* Category Filter */}
              <div className="mb-8 overflow-x-auto custom-scrollbar pb-2">
                <div className="flex items-center gap-3">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeCategory === category 
                          ? 'bg-white text-black' 
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {searchQuery || activeCategory !== 'All' ? (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    {searchQuery ? (
                      <>Search Results <span className="text-white/50 font-normal text-lg">for "{searchQuery}"</span></>
                    ) : (
                      <>{activeCategory} Movies</>
                    )}
                  </h2>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                      {currentMovies.length > 0 ? (
                        <div className="flex flex-col gap-12">
                          <motion.div 
                            initial="hidden"
                            animate="visible"
                            variants={{
                              visible: { transition: { staggerChildren: 0.05 } }
                            }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                          >
                            {currentMovies.map(movie => (
                              <MovieCard key={movie.id} movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={setSelectedMovieForDetails} searchQuery={searchQuery} />
                            ))}
                          </motion.div>
                        </div>
                      ) : (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                          <Search size={48} className="mx-auto mb-4 text-white/20" />
                          <h3 className="text-xl font-bold mb-2">No results found</h3>
                          <p className="text-white/50">Try adjusting your search query.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* 160x300 Vertical Banner Ad */}
                    <div className="hidden lg:block w-[160px] shrink-0">
                      <div className="sticky top-24">
                        <AdsterraAd adKey="48fc53489149f9fac60634e87fd9f134" width={160} height={300} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Trending Row */}
                  {trendingMovies.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Trending Now</h2>
                        <button 
                          onClick={() => {
                            const element = document.getElementById('watch-next');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="text-sm font-medium text-white/50 hover:text-white flex items-center transition-colors"
                        >
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
                        {trendingMovies.map((movie, idx) => (
                          <SwiperSlide key={movie.id} className="!w-[160px] md:!w-[220px]">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={setSelectedMovieForDetails} searchQuery={searchQuery} />
                            </motion.div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  )}
                  
                  {/* Adsterra Native Banner Ad */}
                  <div className="my-12">
                    <AdsterraNativeBanner />
                  </div>

                  {/* All Movies Grid */}
                  <div id="watch-next" className="mb-12 scroll-mt-24">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">Watch Next</h2>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="flex-1 flex flex-col gap-12">
                        <motion.div 
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                          }}
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8"
                        >
                          {currentMovies.map((movie) => (
                            <motion.div
                              key={movie.id}
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                              }}
                            >
                              <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={setSelectedMovieForDetails} searchQuery={searchQuery} />
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                      
                      {/* 160x300 Vertical Banner Ad */}
                      <div className="hidden lg:block w-[160px] shrink-0">
                        <div className="sticky top-24">
                          <AdsterraAd adKey="48fc53489149f9fac60634e87fd9f134" width={160} height={300} />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
      </main>
      
      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 border-t border-white/10 bg-black transition-colors duration-500">
        <div className="flex flex-col items-center gap-8">
          <Logo className="scale-125" />
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">Proudly made by Bihari</p>
            <p className="text-red-500 text-xs font-bold uppercase tracking-[0.3em]">Developed by AYUSH</p>
          </div>
          
          <div className="flex items-center gap-6 text-white/30 text-xs uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-red-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-red-600 transition-colors">Terms of Service</a>
            <button onClick={() => setShowDMCA(true)} className="hover:text-red-600 transition-colors uppercase">DMCA Policy</button>
            <a href="#" className="hover:text-red-600 transition-colors">Contact Us</a>
          </div>
          
          <p className="text-white/10 text-[10px] uppercase tracking-[0.3em] mt-4">
            © 2026 Movie Wallah. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showDMCA && (
          <DMCAModal key="dmca-modal" onClose={() => setShowDMCA(false)} />
        )}
        {showAdminLogin && (
          <motion.div key="admin-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="w-full max-w-sm glass-panel rounded-3xl p-8 relative bg-white/10">
              <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 text-current opacity-50 hover:opacity-100 bg-current/10 rounded-full p-1 transition-colors"><X size={20} /></button>
              <div className="flex justify-center mb-6"><div className="w-16 h-16 rounded-full bg-current/10 flex items-center justify-center"><Shield size={32} className="text-current" /></div></div>
              <h3 className="text-2xl font-bold text-center mb-2">Admin Access</h3>
              <p className="text-current opacity-50 text-center text-sm mb-6">Enter your password to manage movies.</p>
              <form onSubmit={handleAdminLogin}>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Password" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-current placeholder-current/30 focus:outline-none focus:ring-2 focus:ring-current/50 transition-all mb-4" autoFocus />
                {errorMsg && <p className="text-red-400 text-xs mb-4 text-center">{errorMsg}</p>}
                <button type="submit" className="w-full bg-white text-black font-bold rounded-xl py-3 hover:opacity-90 transition-opacity">Unlock</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddEditModal && (
          <motion.div key="add-edit-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl overflow-y-auto p-0 md:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-3xl p-6 md:p-10 relative bg-zinc-900 border-x-0 md:border border-white/10 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex flex-col gap-1">
                  <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md w-fit ${editingMovie ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                    {editingMovie ? 'Management Mode' : 'Creation Mode'}
                  </div>
                  <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
                    {editingMovie ? <Edit size={24} className="text-blue-400" /> : <Plus size={24} className="text-green-400" />} 
                    {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                  </h3>
                </div>
                <button onClick={() => setShowAddEditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"><X size={24} /></button>
              </div>

              {errorMsg && <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm shrink-0">{errorMsg}</div>}
              
              <form onSubmit={handleSaveMovie} className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar pb-20 md:pb-6">
                <div className="space-y-10">
                  {/* Section: Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <FileText size={16} className="text-blue-400" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Basic Information</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Movie Title *</label>
                        <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="e.g. Inception" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Description *</label>
                        <textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all resize-none" placeholder="A brief synopsis..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Category *</label>
                        <div className="relative">
                          <select 
                            required 
                            value={formData.category} 
                            onChange={(e) => setFormData({...formData, category: e.target.value})} 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all appearance-none cursor-pointer"
                          >
                            {CATEGORIES.filter(c => c !== 'All').map(category => (
                              <option key={category} value={category} className="bg-zinc-900 text-white">{category}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            <ChevronRight size={18} className="rotate-90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Media Links */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Link size={16} className="text-purple-400" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Media & Assets</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Poster Image URL *</label>
                        <input required type="url" value={formData.posterUrl} onChange={(e) => setFormData({...formData, posterUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Download URL *</label>
                        <input required type="url" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Watch URL (Optional)</label>
                        <input type="url" value={formData.viewUrl} onChange={(e) => setFormData({...formData, viewUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="https://..." />
                      </div>
                    </div>
                  </div>

                  {/* Section: Movie Metadata */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Info size={16} className="text-emerald-400" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Movie Details</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Director</label>
                          <input type="text" value={formData.director} onChange={(e) => setFormData({...formData, director: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="e.g. Christopher Nolan" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Cast</label>
                          <input type="text" value={formData.cast} onChange={(e) => setFormData({...formData, cast: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="e.g. Leonardo DiCaprio" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Year</label>
                          <input type="text" value={formData.release_year} onChange={(e) => setFormData({...formData, release_year: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="2026" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Rating</label>
                          <input type="text" value={formData.maturity_rating} onChange={(e) => setFormData({...formData, maturity_rating: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="18+" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Duration</label>
                          <input type="text" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="2h 15m" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Quality</label>
                          <input type="text" value={formData.quality} onChange={(e) => setFormData({...formData, quality: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="HD" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Match %</label>
                          <input type="number" value={formData.match_score} onChange={(e) => setFormData({...formData, match_score: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="98" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Stats & Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <BarChart3 size={16} className="text-yellow-400" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Stats & Settings</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Initial Views</label>
                          <input type="number" value={formData.views} onChange={(e) => setFormData({...formData, views: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Initial Downloads</label>
                          <input type="number" value={formData.downloads} onChange={(e) => setFormData({...formData, downloads: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="0" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all" onClick={() => setFormData({...formData, is_hero: !formData.is_hero})}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_hero ? 'bg-red-600 border-red-600' : 'border-white/20'}`}>
                          {formData.is_hero && <Plus size={16} className="text-white rotate-45" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-current">Show in Hero Section</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">Featured on homepage slider</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-3 shrink-0 mt-auto">
                  <button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-current font-bold rounded-xl py-4 transition-colors order-2 sm:order-1">Cancel</button>
                  <button type="submit" className="flex-1 bg-white text-black hover:bg-red-600 hover:text-white font-bold rounded-xl py-4 transition-all order-1 sm:order-2 shadow-xl shadow-white/5">
                    {editingMovie ? 'Save Changes' : 'Add Movie'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {selectedMovieForDetails && (
            <MovieDetailModal 
              key={selectedMovieForDetails.id} 
              movie={selectedMovieForDetails} 
              allMovies={movies}
              onClose={() => {
                if (window.history.state?.modal === 'movie-details') {
                  window.history.back();
                }
                setSelectedMovieForDetails(null);
              }} 
              onMovieClick={(m) => setSelectedMovieForDetails(m)}
              onDownload={handleDownload}
              onView={handleView}
            />
          )}
        </AnimatePresence>

        {movieToDelete && (
          <motion.div key="delete-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm glass-panel rounded-3xl p-8 text-center bg-zinc-900 border border-white/10 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Delete Movie?</h3>
              <p className="text-white/50 mb-8 text-sm leading-relaxed">
                Are you sure you want to delete <span className="text-white font-bold">"{movies.find(m => m.id === movieToDelete)?.title}"</span>? This action is permanent and cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-red-600/20 active:scale-95">
                  Yes, Delete Permanently
                </button>
                <button onClick={() => setMovieToDelete(null)} className="w-full bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl py-4 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable Movie Poster Component with Fallback
const MoviePoster: React.FC<{ src: string; alt: string; className?: string; contain?: boolean; autoHeight?: boolean }> = ({ src, alt, className = "", contain = false, autoHeight = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative w-full ${autoHeight ? 'h-auto' : 'h-full'} bg-zinc-800/50 overflow-hidden ${className}`}>
      {(!isLoaded && !hasError) && (
        <div className={`${autoHeight ? 'aspect-[2/3]' : 'absolute inset-0'} bg-zinc-800/80 flex items-center justify-center z-10`}>
          <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}
      
      {(hasError || !src) ? (
        <div className={`${autoHeight ? 'aspect-[2/3]' : 'absolute inset-0'} flex flex-col items-center justify-center bg-zinc-900 text-white/20 p-4 text-center z-10`}>
          <Film size={40} className="mb-2 opacity-20" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">No Poster</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full ${autoHeight ? 'h-auto' : 'h-full'} ${contain ? 'object-contain' : 'object-cover'} transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} 
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

const MovieCard: React.FC<{ 
  movie: Movie, 
  isAdmin: boolean, 
  onEdit: (m: Movie) => void, 
  onDelete: (id: string) => void, 
  onDownload: (id: string) => void, 
  onView: (id: string) => void, 
  onShowDetails: (m: Movie) => void,
  searchQuery?: string
}> = React.memo(({ movie, isAdmin, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery = '' }) => {
  const query = searchQuery.toLowerCase().trim();
  const matchesCast = query && movie.cast?.toLowerCase().includes(query);
  const matchesDirector = query && movie.director?.toLowerCase().includes(query);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col gap-3 group w-full"
    >
      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-red-500 to-red-900 shadow-xl shadow-red-500/10">
        <div 
          onClick={() => onShowDetails(movie)}
          className="relative rounded-2xl overflow-hidden w-full bg-black cursor-pointer"
        >
          <MoviePoster src={movie.posterUrl} alt={movie.title} contain autoHeight className="group-hover:scale-105 transition-transform duration-500" />
          
          {/* Persistent Info Icon for Discoverability */}
          <div className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 group-hover:text-white group-hover:bg-red-600 transition-all duration-300 shadow-lg">
            <Info size={14} />
          </div>
          
          {/* Tooltip */}
          <div className="absolute inset-0 z-10 hidden group-hover:flex flex-col justify-end p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Info size={14} className="text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Click for details</span>
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{movie.title}</h4>
            <p className="text-white/70 text-xs line-clamp-2 mb-2">{movie.description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-current font-bold text-sm md:text-base leading-tight group-hover:opacity-80 transition-opacity whitespace-normal flex-1">
            {movie.title}
          </h3>
          {movie.category && (
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
              {movie.category}
            </span>
          )}
        </div>
        <p className="text-white/50 text-[10px] md:text-xs line-clamp-2 leading-relaxed">
          {movie.description}
        </p>
        
        {(matchesCast || matchesDirector) && (
          <div className="flex flex-col gap-1 mt-1">
            {matchesDirector && (
              <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-blue-400 font-medium">
                <span className="opacity-60 uppercase tracking-tighter">Director:</span>
                <span className="line-clamp-1">{movie.director}</span>
              </div>
            )}
            {matchesCast && (
              <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] text-emerald-400 font-medium">
                <span className="opacity-60 uppercase tracking-tighter">Cast:</span>
                <span className="line-clamp-1">{movie.cast}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {movie.viewUrl && (
              <a 
                href={movie.viewUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => onView(movie.id)}
                className="flex-1 bg-white text-black py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all active:scale-95"
              >
                <Play size={14} className="fill-current" /> Watch
              </a>
            )}
            <a 
              href={movie.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => onDownload(movie.id)}
              className="flex-1 bg-white/10 border border-white/10 text-current py-2 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95"
            >
              <Download size={14} /> Download
            </a>
          </div>
          
          <button 
            onClick={() => onShowDetails(movie)}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
          >
            <Info size={14} className="text-emerald-400" /> Full Movie Details
          </button>

          {isAdmin && (
            <div className="flex flex-col gap-2 pt-1 border-t border-white/5 mt-1">
              <div className="flex items-center justify-between px-1 text-[10px] md:text-xs text-white/50 font-medium">
                <span className="flex items-center gap-1"><Eye size={12} /> {movie.views || 0} Views</span>
                <span className="flex items-center gap-1"><Download size={12} /> {movie.downloads || 0} Downloads</span>
              </div>
              <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
const MovieDetailModal: React.FC<{ 
  movie: Movie; 
  allMovies: Movie[];
  onClose: () => void; 
  onMovieClick: (m: Movie) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
}> = ({ movie, allMovies, onClose, onMovieClick, onDownload, onView }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?movie=${movie.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Check out ${movie.title} on MovieWallah!`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const fetchReviews = useCallback(async () => {
    setIsReviewsLoading(true);
    try {
      if (supabase) {
        const { data } = await supabase.from('reviews').select('*').eq('movie_id', movie.id).order('created_at', { ascending: false });
        setReviews(data || []);
      } else {
        const saved = localStorage.getItem(`reviews_${movie.id}`);
        if (saved) setReviews(JSON.parse(saved));
        else setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [movie.id]);

  useEffect(() => {
    fetchReviews();
    const modalContainer = document.getElementById('movie-detail-modal-container');
    if (modalContainer) modalContainer.scrollTo({ top: 0, behavior: 'auto' });
  }, [movie.id, fetchReviews]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const similarMovies = useMemo(() => {
    return allMovies
      .filter(m => m.category === movie.category && m.id !== movie.id)
      .slice(0, 12);
  }, [allMovies, movie.category, movie.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !text.trim()) return;
    setIsSubmitting(true);
    
    const newReview: Review = {
      id: Date.now().toString(),
      movie_id: movie.id,
      user_name: userName,
      rating,
      text,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('reviews').insert([newReview]);
        if (error) {
          console.error('Error submitting review:', error.message);
          alert('Failed to submit review. Please try again.');
        } else {
          fetchReviews();
        }
      } catch (err) {
        console.error('Failed to submit review:', err);
      }
    } else {
      const updated = [newReview, ...reviews];
      setReviews(updated);
      localStorage.setItem(`reviews_${movie.id}`, JSON.stringify(updated));
    }
    
    setUserName('');
    setRating(5);
    setText('');
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Scrollable Container */}
      <div 
        id="movie-detail-modal-container"
        className="fixed inset-0 overflow-y-auto pt-4 md:pt-12 pb-12 px-0 md:px-4 custom-scrollbar overscroll-contain scroll-pt-8 md:scroll-pt-12"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex justify-center min-h-full items-start">
          <motion.div 
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0, scale: 0.99, y: 10 },
              visible: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  type: "spring",
                  damping: 30,
                  stiffness: 300,
                  staggerChildren: 0.05,
                  delayChildren: 0.1
                }
              }
            }}
            className="w-full max-w-4xl bg-black rounded-none md:rounded-xl shadow-2xl relative overflow-hidden flex flex-col border border-white/5 mb-8"
            style={{ willChange: 'transform, opacity' }}
          >
          {/* Hero Section */}
          <div className="relative min-h-[450px] md:aspect-video shrink-0 group flex flex-col justify-end">
            {/* Poster Background */}
            <div className="absolute inset-0 overflow-hidden">
              <MoviePoster src={movie.posterUrl} alt="" className="scale-100 md:group-hover:scale-105 transition-transform duration-[8000ms] opacity-70" style={{ willChange: 'transform' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            
            {/* Content Overlay */}
            <div className="relative z-10 p-8 md:p-14 w-full">
              <motion.h2 
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-white line-clamp-2 leading-[0.9]"
              >
                {movie.title}
              </motion.h2>
              
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="flex flex-wrap items-center gap-4"
              >
                {movie.viewUrl && (
                  <a 
                    href={movie.viewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => onView(movie.id)}
                    className="bg-white text-black px-6 md:px-10 py-3 md:py-4 rounded font-bold flex items-center justify-center gap-2 md:gap-3 hover:bg-white/90 transition-all text-sm md:text-lg active:scale-95 shadow-lg"
                  >
                    <Play size={20} className="fill-current md:w-6 md:h-6" /> Play
                  </a>
                )}
                <a 
                  href={movie.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => onDownload(movie.id)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 md:px-10 py-3 md:py-4 rounded font-bold flex items-center justify-center gap-2 md:gap-3 transition-all text-sm md:text-lg backdrop-blur-xl border border-white/10 active:scale-95"
                >
                  <Download size={20} className="md:w-6 md:h-6" /> Download
                </a>
                
                {/* Social Sharing */}
                <div className="flex items-center gap-2 ml-2">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all font-bold text-sm border border-white/5 active:scale-95"
                  >
                    <Share2 size={20} />
                    Share
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Close Button - Moved after Hero to ensure it's on top */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] p-2 bg-black/40 hover:bg-white/10 text-white rounded-full transition-all backdrop-blur-md border border-white/10 active:scale-90"
          >
            <X size={20} />
          </button>

          {/* Content Section */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="p-6 md:p-14 pt-10 space-y-16"
          >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Metadata & Description */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-wrap items-center gap-5 text-sm font-semibold tracking-wide">
                <span className="text-green-500">{movie.match_score || 98}% Match</span>
                <span className="text-white/50">{movie.release_year || (movie.created_at ? new Date(movie.created_at).getFullYear() : '2026')}</span>
                <span className="border border-white/30 px-2 py-0.5 text-[11px] rounded-sm text-white/70">{movie.maturity_rating || '18+'}</span>
                <span className="text-white/50">{movie.duration || '2h 15m'}</span>
                <span className="border border-white/30 px-2 py-0.5 text-[11px] rounded-sm text-white/70 uppercase">{movie.quality || 'HD'}</span>
              </div>
              
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">
                {movie.description}
              </p>
            </div>

            {/* Right Column: Cast & Details */}
            <div className="space-y-6 text-sm border-l border-white/5 pl-8 hidden lg:block">
              {movie.cast && (
                <div className="space-y-1">
                  <span className="text-white/30 block uppercase text-[10px] font-bold tracking-widest">Cast</span>
                  <span className="text-white/70 block leading-snug">{movie.cast}</span>
                </div>
              )}
              {movie.director && (
                <div className="space-y-1">
                  <span className="text-white/30 block uppercase text-[10px] font-bold tracking-widest">Director</span>
                  <span className="text-white/70 block leading-snug">{movie.director}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-white/30 block uppercase text-[10px] font-bold tracking-widest">Genres</span>
                <span className="text-white/70 block leading-snug">{movie.category}</span>
              </div>
            </div>
            
            {/* Mobile Cast & Details */}
            <div className="space-y-4 text-sm lg:hidden">
              {movie.cast && (
                <div>
                  <span className="text-white/30">Cast: </span>
                  <span className="text-white/70">{movie.cast}</span>
                </div>
              )}
              {movie.director && (
                <div>
                  <span className="text-white/30">Director: </span>
                  <span className="text-white/70">{movie.director}</span>
                </div>
              )}
              <div>
                <span className="text-white/30">Genres: </span>
                <span className="text-white/70">{movie.category}</span>
              </div>
            </div>
          </div>

          {/* More Like This Section */}
          {similarMovies.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {similarMovies.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => onMovieClick(m)}
                    className="bg-[#242424] rounded-lg overflow-hidden cursor-pointer group transition-all border border-white/5 hover:border-white/20"
                  >
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <MoviePoster src={m.posterUrl} alt={m.title} className="group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all" />
                    </div>
                    <div className="p-4 md:p-5 space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/40">{m.release_year || (m.created_at ? new Date(m.created_at).getFullYear() : '2026')}</span>
                      </div>
                      <h4 className="font-bold text-sm md:text-base truncate text-white/90">{m.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="space-y-12 border-t border-white/5 pt-16">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-white">User Reviews</h3>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Star size={16} className="text-white fill-current" />
                <span className="font-bold text-white">4.8</span>
                <span>(1.2k reviews)</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/[0.02] rounded-2xl p-8 border border-white/5">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 focus:outline-none focus:border-white/20 transition-all text-white placeholder:text-white/20"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Rating</label>
                    <div className="flex items-center gap-3 h-[58px]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-all hover:scale-125 active:scale-90"
                        >
                          <Star size={24} className={star <= rating ? "text-white fill-current" : "text-white/5"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Review</label>
                  <textarea 
                    placeholder="Share your thoughts on this movie..." 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 focus:outline-none focus:border-white/20 transition-all min-h-[120px] resize-none text-white placeholder:text-white/20"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-white text-black font-black py-4 px-10 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 active:scale-95 text-lg shadow-xl"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="bg-white/[0.02] rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-white/40 border border-white/5">
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-base block text-white/90">{review.user_name}</span>
                        <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? "text-white fill-current" : "text-white/5"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/60 text-base leading-relaxed italic">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
          </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showCopiedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <Link size={16} />
            Link Copied to Clipboard
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DMCAModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="w-full max-w-3xl glass-panel rounded-3xl p-6 md:p-10 bg-zinc-900/90 border border-white/10 my-8 flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-white/10 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Shield className="text-red-500" size={32} />
            DMCA / Copyright Policy
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-6 text-white/80 leading-relaxed">
          <p>
            Movie Wallah respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at <a href="http://www.copyright.gov/legislation/dmca.pdf" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">http://www.copyright.gov/legislation/dmca.pdf</a>, we will respond expeditiously to claims of copyright infringement committed using the Movie Wallah service that are reported to our Designated Copyright Agent.
          </p>
          
          <h3 className="text-xl font-bold text-white mt-4">Takedown Request Process</h3>
          <p>
            If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent. Upon receipt of the Notice as described below, we will take whatever action, in our sole discretion, we deem appropriate, including removal of the challenged material from the Site.
          </p>

          <h3 className="text-xl font-bold text-white mt-4">DMCA Notice of Alleged Infringement ("Notice")</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.</li>
            <li>Identify the material that you claim is infringing (or to be the subject of infringing activity) and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material, including at a minimum, if applicable, the URL of the link shown on the Site where such material may be found.</li>
            <li>Provide your mailing address, telephone number, and, if available, email address.</li>
            <li>Include both of the following statements in the body of the Notice:
              <ul className="list-[circle] pl-6 mt-2 space-y-2 text-white/60">
                <li>"I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."</li>
                <li>"I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."</li>
              </ul>
            </li>
            <li>Provide your full legal name and your electronic or physical signature.</li>
          </ul>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-4">
            <h4 className="font-bold text-white mb-2">Deliver this Notice, with all items completed, to:</h4>
            <p className="font-mono text-red-400">moviewallah.online@gmail.com</p>
          </div>
          
          <p className="text-sm text-white/50 mt-4">
            Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to liability.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
