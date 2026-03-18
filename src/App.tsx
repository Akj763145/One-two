import React, { useState, useEffect } from 'react';
import { Sun, Moon, Search, MoreVertical, Shield, Plus, X, Edit, Trash2, Link as LinkIcon, Image as ImageIcon, FileText, Film, Download, Play, Star } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Mousewheel, Parallax } from 'swiper/modules';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useScroll, useInView } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Types
interface Movie {
  id: string;
  title: string;
  url: string;
  viewUrl?: string;
  posterUrl: string;
  description: string;
  created_at?: string;
  rating?: number;
}

// Initial dummy data if local storage is empty
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

// Optimized Image Component for Smooth Loading
const SmoothImage = ({ src, alt, className, parallax }: { src: string, alt: string, className?: string, parallax?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
      <img
        src={src}
        alt={alt}
        data-swiper-parallax={parallax}
        onLoad={() => setIsLoaded(true)}
        className={`${className} w-full h-full ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// 4D Scroll Reveal Card Component (Animation Removed)
const ScrollRevealCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full">
      {children}
    </div>
  );
};

// 3D Tilt Card Component (Effect Removed)
const TiltCard = ({ children, className }: { children: React.ReactNode, className: string, isDarkMode: boolean }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Welcome Animation Component
const WelcomeAnimation = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2, duration: 0.8, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#0a0a0a]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative w-24 h-24 rounded-full border-4 border-white flex items-center justify-center bg-[#111] overflow-hidden mb-6 shadow-2xl">
          <div className="absolute inset-1 rounded-full border-4 border-red-500"></div>
          <div className="text-white font-serif text-2xl leading-[0.9] text-center z-10 flex flex-col items-center justify-center">
            <span>M</span>
            <span>W</span>
          </div>
        </div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-black tracking-tighter uppercase flex gap-2"
        >
          <span className="text-red-500">MOVIE</span>
          <span className="dark:text-white text-black">WALLAH</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-gray-500 tracking-[0.3em] uppercase text-xs mt-4 font-bold"
        >
          Made by AYUSH
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  // State
  const [showWelcome, setShowWelcome] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    viewUrl: '',
    posterUrl: '',
    description: ''
  });

  // Load from Supabase or Local Storage
  useEffect(() => {
    fetchMovies();
  }, []);

  // Save to local storage when movies change (fallback mode)
  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('movieWallah_movies', JSON.stringify(movies));
    }
  }, [movies]);

  const fetchMovies = async () => {
    if (!supabase) {
      const savedMovies = localStorage.getItem('movieWallah_movies');
      if (savedMovies) {
        setMovies(JSON.parse(savedMovies));
      } else {
        setMovies(INITIAL_MOVIES);
      }
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching movies:', error);
    } else if (data) {
      setMovies(data);
    }
    setIsLoading(false);
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handlers
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (adminPassword === 'qqq') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      setShowMenu(false);
    } else {
      setErrorMsg('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowMenu(false);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const movieData = {
      title: formData.title,
      url: formData.url,
      viewUrl: formData.viewUrl,
      posterUrl: formData.posterUrl,
      description: formData.description
    };

    if (!supabase) {
      // Fallback to local state
      if (editingMovie) {
        setMovies(movies.map(m => m.id === editingMovie.id ? { ...m, ...movieData } : m));
      } else {
        setMovies([{ ...movieData, id: Date.now().toString() }, ...movies]);
      }
    } else {
      // Supabase logic
      if (editingMovie) {
        const { error } = await supabase
          .from('movies')
          .update(movieData)
          .eq('id', editingMovie.id);
          
        if (error) {
          setErrorMsg('Error updating movie: ' + error.message + '. Did you create the movies table in Supabase?');
          return;
        }
        setMovies(movies.map(m => m.id === editingMovie.id ? { ...m, ...movieData } : m));
      } else {
        const { data, error } = await supabase
          .from('movies')
          .insert([movieData])
          .select();
          
        if (error) {
          setErrorMsg('Error adding movie: ' + error.message + '. Did you create the movies table in Supabase?');
          return;
        }
        if (data && data.length > 0) {
          setMovies([...data, ...movies]);
        } else {
          // Fallback if RLS prevents returning the inserted row
          setMovies([{ ...movieData, id: Date.now().toString() }, ...movies]);
          fetchMovies(); // Re-fetch to sync
        }
      }
    }
    
    setShowAddEditModal(false);
    setFormData({ title: '', url: '', posterUrl: '', description: '' });
    setEditingMovie(null);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      url: movie.url,
      viewUrl: movie.viewUrl || '',
      posterUrl: movie.posterUrl,
      description: movie.description
    });
    setShowAddEditModal(true);
  };

  const handleDelete = async (id: string) => {
    setMovieToDelete(id);
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;
    
    if (!supabase) {
      setMovies(movies.filter(m => m.id !== movieToDelete));
      setMovieToDelete(null);
      return;
    }
    
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', movieToDelete);
      
    if (error) {
      console.error('Error deleting movie:', error);
      // We'll just log it and still remove from UI for now to prevent getting stuck
    }
    
    setMovies(movies.filter(m => m.id !== movieToDelete));
    setMovieToDelete(null);
  };

  const handleRatingChange = async (movieId: string, newRating: number) => {
    if (!isAdmin) return;

    // Optimistic update
    setMovies(movies.map(m => m.id === movieId ? { ...m, rating: newRating } : m));

    if (supabase) {
      const { error } = await supabase
        .from('movies')
        .update({ rating: newRating })
        .eq('id', movieId);
        
      if (error) {
        console.error('Error updating rating:', error);
        setErrorMsg(`Failed to save rating: ${error.message}. (If it says "new row violates row-level security", you need to add an UPDATE policy in Supabase)`);
        // Revert optimistic update by refetching
        fetchMovies();
      }
    }
  };

  const openAddModal = () => {
    setErrorMsg(null);
    setEditingMovie(null);
    setFormData({ title: '', url: '', viewUrl: '', posterUrl: '', description: '' });
    setShowAddEditModal(true);
  };

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <AnimatePresence>
        {showWelcome && <WelcomeAnimation onComplete={() => setShowWelcome(false)} />}
      </AnimatePresence>
      <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-[#111] overflow-hidden">
            <div className="absolute inset-1 rounded-full border-2 border-red-500"></div>
            <div className="text-white font-serif text-sm leading-[0.9] text-center z-10 flex flex-col items-center justify-center">
              <span>M</span>
              <span>W</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold tracking-wider uppercase flex gap-1.5 leading-none mb-1">
              <span className="text-red-500">MOVIE</span>
              <span className={isDarkMode ? 'text-white' : 'text-black'}>WALLAH</span>
            </h1>
            <span className="text-[9px] tracking-[0.25em] text-gray-500 uppercase font-bold leading-none">Download Any Movie • Made by AYUSH</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="hidden sm:block font-medium hover:text-indigo-500 transition-colors">About</button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden border ${isDarkMode ? 'bg-[#1c1c1e] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-4 py-2 text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  SETTINGS
                </div>
                {isAdmin ? (
                  <button 
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-opacity-80 transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Shield size={18} className="text-red-500" />
                    <span>Disable Admin Mode</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => { setShowAdminLogin(true); setShowMenu(false); }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-opacity-80 transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Shield size={18} />
                    <span>Enable Admin Mode</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {!supabase && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-r-xl">
            <p className="font-bold">Supabase not configured</p>
            <p>Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables to enable database features.</p>
          </div>
        )}
        
        {/* Search and Admin Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
          <div className={`relative flex-1 max-w-2xl w-full rounded-xl overflow-hidden border ${isDarkMode ? 'bg-[#1c1c1e] border-gray-800' : 'bg-white border-gray-300'}`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <input
              type="text"
              placeholder="Search all movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
          
          {isAdmin && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-sm w-full sm:w-auto justify-center"
            >
              <Plus size={20} />
              Add Movie
            </button>
          )}
        </div>

        <h2 className="text-3xl font-bold mb-6">Movies</h2>

        {/* Movies Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="w-full py-16 overflow-visible">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              mousewheel={{
                sensitivity: 1,
                forceToAxis: true,
              }}
              parallax={true}
              speed={800}
              coverflowEffect={{
                rotate: 5,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              modules={[EffectCoverflow, Mousewheel, Parallax]}
              className="w-full !pb-12 !pt-8"
              onProgress={(swiper, progress) => {
                const scrollBar = document.getElementById('carousel-progress');
                if (scrollBar) {
                  scrollBar.style.width = `${progress * 100}%`;
                }
              }}
            >
              {filteredMovies.map((movie, index) => (
                <SwiperSlide key={movie.id} className="!w-[280px] sm:!w-[320px] md:!w-[380px] perspective-1000">
                  <TiltCard 
                    isDarkMode={isDarkMode}
                    className={`group relative rounded-2xl overflow-hidden border flex flex-col h-full will-change-transform ${isDarkMode ? 'bg-[#141414] border-gray-800 shadow-2xl' : 'bg-white border-gray-200 shadow-xl'}`}
                  >
                    <div className="block relative aspect-[16/9] overflow-hidden bg-black/20">
                      {/* Blurred Backdrop for "Full" effect - Optimized for mobile */}
                      <img 
                        src={movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600&h=900'} 
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110 transform-gpu will-change-transform"
                      />
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600&h=900'} 
                          alt={movie.title}
                          loading="lazy"
                          data-swiper-parallax="-20%"
                          className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105 z-10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600&h=900';
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col" style={{ transform: "translateZ(30px)" }}>
                      <div className="flex justify-between items-start mb-2" data-swiper-parallax="-100">
                        <h3 className={`text-xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg text-yellow-500 shrink-0">
                          <Star size={14} className="fill-current" />
                          <span className="text-sm font-black">{movie.rating || 0}</span>
                        </div>
                      </div>
                      
                      <p 
                        className={`text-sm flex-1 mb-6 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        data-swiper-parallax="-200"
                      >
                        {movie.description}
                      </p>

                      <div className="flex flex-col gap-3 mt-auto" data-swiper-parallax="-300">
                        {movie.viewUrl && (
                          <motion.a 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            href={movie.viewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="relative flex items-center justify-center w-full py-2.5 bg-gradient-to-r from-white via-gray-400 to-black animate-gradient rounded-xl text-sm font-bold shadow-lg transition-all isolate overflow-hidden"
                          >
                            <span className="flex items-center gap-2 mix-blend-difference text-white">
                              <Play size={16} className="fill-current" />
                              View Now
                            </span>
                          </motion.a>
                        )}
                        <motion.a 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={movie.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="relative flex items-center justify-center w-full py-2.5 bg-gradient-to-r from-black via-gray-600 to-white animate-gradient rounded-xl text-sm font-bold shadow-lg transition-all isolate overflow-hidden"
                        >
                          <span className="flex items-center gap-2 mix-blend-difference text-white">
                            <Download size={16} />
                            Download
                          </span>
                        </motion.a>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                          <button 
                            onClick={(e) => { e.preventDefault(); handleEdit(movie); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); handleDelete(movie.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </TiltCard>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Carousel Progress Bar */}
            <div className="flex justify-center mt-4 mb-8">
              <div className={`w-48 h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div 
                  id="carousel-progress" 
                  className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: '0%' }}
                />
              </div>
            </div>

            {/* Normal Card Scrolling Section */}
            <div className="mt-4 mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">More to Enjoy</h2>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Explore our complete collection of movies
                  </p>
                </div>
                <div className={`h-px flex-1 mx-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    {filteredMovies.length} ITEMS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredMovies.map((movie, index) => (
                    <div
                      key={`grid-${movie.id}`}
                      className="h-full"
                    >
                      <TiltCard
                        isDarkMode={isDarkMode}
                        className={`group relative rounded-2xl overflow-hidden border flex flex-col h-full ${isDarkMode ? 'bg-[#141414] border-gray-800 shadow-lg' : 'bg-white border-gray-200 shadow-sm'}`}
                      >
                        <div className="relative aspect-[2/3] overflow-hidden">
                          <SmoothImage 
                            src={movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600&h=900'} 
                            alt={movie.title}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {movie.title}
                            </h3>
                            <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg text-yellow-500 shrink-0">
                              <Star size={12} className="fill-current" />
                              <span className="text-xs font-black">{movie.rating || 0}</span>
                            </div>
                          </div>
                          <p className={`text-xs line-clamp-3 mb-4 flex-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {movie.description}
                          </p>

                          <div className="flex flex-col gap-2 mt-auto">
                            {movie.viewUrl && (
                              <a 
                                href={movie.viewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="relative flex items-center justify-center w-full py-2.5 bg-gradient-to-r from-white via-gray-400 to-black animate-gradient rounded-xl text-xs font-bold shadow-lg transition-all isolate overflow-hidden"
                              >
                                <span className="flex items-center gap-1.5 mix-blend-difference text-white">
                                  View Now
                                </span>
                              </a>
                            )}
                            <a 
                              href={movie.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="relative flex items-center justify-center w-full py-2.5 bg-gradient-to-r from-black via-gray-600 to-white animate-gradient rounded-xl text-xs font-bold shadow-lg transition-all isolate overflow-hidden"
                            >
                              <span className="flex items-center gap-1.5 mix-blend-difference text-white">
                                Download
                              </span>
                            </a>
                          </div>
                          
                          {isAdmin && (
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                              <button 
                                onClick={() => handleEdit(movie)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                              >
                                <Edit size={12} />
                                EDIT
                              </button>
                              <button 
                                onClick={() => handleDelete(movie.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={12} />
                                DELETE
                              </button>
                            </div>
                          )}
                        </div>
                      </TiltCard>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <div className={`text-center py-20 rounded-2xl border ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'}`}>
            <Film size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="text-xl font-bold mb-2">No movies found</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              {searchQuery ? "Try adjusting your search query." : "Admin hasn't added any movies yet."}
            </p>
          </div>
        )}
      </main>

      <footer className={`py-6 text-center border-t mt-auto ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        <p className="text-sm font-medium">Proudly made by Bihari</p>
        <p className="text-xs mt-1">(Ayush and Ayush)</p>
      </footer>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#1c1c1e] border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 font-bold text-lg">
                <Shield size={20} className="text-indigo-500" />
                Admin Access
              </div>
              <button 
                onClick={() => {
                  setShowAdminLogin(false);
                  setErrorMsg(null);
                }}
                className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdminLogin} className="p-6">
              <div className="mb-6">
                <label className={`block text-xs font-bold tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ADMIN PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${isDarkMode ? 'bg-[#0a0a0a] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  autoFocus
                />
                {errorMsg && (
                  <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
                )}
              </div>
              
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Unlock Admin Mode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Movie Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border my-8 ${isDarkMode ? 'bg-[#1c1c1e] border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 font-bold text-lg">
                {editingMovie ? <Edit size={20} className="text-indigo-500" /> : <Plus size={20} className="text-indigo-500" />}
                {editingMovie ? 'Edit Movie' : 'Add New Movie'}
              </div>
              <button 
                onClick={() => {
                  setShowAddEditModal(false);
                  setErrorMsg(null);
                }}
                className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMovie} className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  MOVIE TITLE *
                </label>
                <div className={`flex items-center rounded-xl border overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors ${isDarkMode ? 'bg-[#0a0a0a] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="pl-4 pr-2 text-gray-500">
                    <Film size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inception (2010)"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className={`w-full py-3 pr-4 outline-none bg-transparent ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-xs font-bold tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  DOWNLOAD URL
                </label>
                <div className={`flex items-center rounded-xl border overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors ${isDarkMode ? 'bg-[#0a0a0a] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="pl-4 pr-2 text-gray-500">
                    <LinkIcon size={18} />
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className={`w-full py-3 pr-4 outline-none bg-transparent ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  VIEW URL (Optional)
                </label>
                <div className={`flex items-center rounded-xl border overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors ${isDarkMode ? 'bg-[#0a0a0a] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="pl-4 pr-2 text-gray-500">
                    <Play size={18} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.viewUrl}
                    onChange={(e) => setFormData({...formData, viewUrl: e.target.value})}
                    className={`w-full py-3 pr-4 outline-none bg-transparent ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-xs font-bold tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  POSTER IMAGE URL
                </label>
                <div className={`flex items-center rounded-xl border overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors ${isDarkMode ? 'bg-[#0a0a0a] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="pl-4 pr-2 text-gray-500">
                    <ImageIcon size={18} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://.../poster.jpg"
                    value={formData.posterUrl}
                    onChange={(e) => setFormData({...formData, posterUrl: e.target.value})}
                    className={`w-full py-3 pr-4 outline-none bg-transparent ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-xs font-bold tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  DESCRIPTION / TAGS
                </label>
                <div className={`flex items-start rounded-xl border overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors ${isDarkMode ? 'bg-[#0a0a0a] border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="pl-4 pr-2 pt-3 text-gray-500">
                    <FileText size={18} />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Add genre, year, or description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full py-3 pr-4 outline-none bg-transparent resize-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                </div>
              </div>
              
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm">
                  {errorMsg}
                </div>
              )}
              
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors mt-2"
              >
                {editingMovie ? <Edit size={20} /> : <Plus size={20} />}
                {editingMovie ? 'Save Changes' : 'Add to Library'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border p-6 ${isDarkMode ? 'bg-[#1c1c1e] border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-2">Delete Movie</h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to delete this movie? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setMovieToDelete(null)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
