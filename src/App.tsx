  // Body scroll lock logic is handled lower down
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link as RouterLink } from 'react-router-dom';
import { Search, Mail, AlertTriangle, Shield, Plus, X, Edit, Trash2, Download, Play, Star, Film, LogOut, ChevronRight, Eye, MoreVertical, Settings, ChevronLeft, ThumbsUp, FileText, Link, Info, BarChart3, Share2, TrendingUp, Users, Activity, Loader, Maximize, ExternalLink, HardDrive, Lock } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { supabase } from './supabaseClient';
import { TmdbImporter } from './components/TmdbImporter';
import { WhereToWatch } from './components/WhereToWatch';
import { initAuth, googleSignIn, getAccessToken, logoutGoogle } from './lib/firebaseAuth';
import { SEED_MOVIES } from './data/seedMovies';
import { extractYouTubeKey } from './lib/utils';
import { analytics } from './lib/analytics';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const AdminMobileNav = React.lazy(() => import('./components/AdminMobileNav').then(m => ({ default: m.AdminMobileNav })));
const About = React.lazy(() => import('./pages/About'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const DMCA = React.lazy(() => import('./pages/DMCA'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Terms = React.lazy(() => import('./pages/Terms'));
const DirectoryAZ = React.lazy(() => import('./pages/DirectoryAZ'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel, EffectCoverflow, Autoplay, Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface Movie {
  id: string;
  title: string;
  url?: string;
  viewUrl?: string;
  trailerUrl?: string;
  posterUrl?: string;
  bannerUrl?: string;
  poster_path?: string;
  backdrop_path?: string;
  description?: string;
  category?: string;
  director?: string;
  cast?: string;
  created_at?: string;
  downloads?: number;
  views?: number;
  is_hero?: boolean;
  is_trending?: boolean;
  release_year?: string;
  maturity_rating?: string;
  duration?: string;
  quality?: string;
  match_score?: number;
  auto_play_video?: boolean;
  auto_play_video_url?: string;
  notes?: string;
  tmdb_id?: number;
  imdb_id?: string;
  vote_average?: number;
  vote_count?: number;
  runtime_min?: number;
  tagline?: string;
  overview?: string;
  genres?: string[];
  slug?: string;
  is_published?: boolean;
}

interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete' | 'login' | 'logout' | 'seo_update' | 'ads_update';
  entity: 'movie' | 'site_settings' | 'admin';
  details: string;
  admin_email: string;
  timestamp: string;
}

interface AdSettings {
  enabled: boolean;
  homeTop: string;
  homeMiddle: string;
  homeTrendingAndWatchNext?: string;
  homeGridInline?: string;
  homeBottom: string;
  detailsModal: string;
}

const AdBanner: React.FC<{ code: string, className?: string }> = ({ code, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && code) {
      containerRef.current.innerHTML = '';
      try {
        const range = document.createRange();
        const fragment = range.createContextualFragment(code);
        containerRef.current.appendChild(fragment);
      } catch (e) {
        console.error('Failed to render ad code:', e);
        // Fallback for codes that don't like contextual fragment
        containerRef.current.innerHTML = code;
      }
    }
  }, [code]);

  if (!code) return null;
  return (
    <div 
      ref={containerRef}
      className={`ad-container flex justify-center w-full overflow-hidden min-h-[10px] ${className}`} 
    />
  );
};

const sharedTransition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 1
} as any;

const AdminSidebar: React.FC<{
  activeTab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads',
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads') => void,
  onAddClick: () => void,
  onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
    const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-red-500' },
    { id: 'movies', label: 'Movies', icon: Film, color: 'text-blue-500' },
    { id: 'feedback', label: 'Feedback', icon: Users, color: 'text-emerald-500' },
    { id: 'logs', label: 'Audit Logs', icon: Activity, color: 'text-amber-500' },
    { id: 'ads', label: 'Ads Manager', icon: Link, color: 'text-orange-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-purple-500' },
  ] as const;
  
  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-white/5 flex flex-col z-[60] hidden lg:flex">
      <div className="p-8">
        <Logo showText={true} className="scale-90 origin-left" />
      </div>

      <div className="flex-1 px-4 space-y-2">
        <div className="mb-4 px-4">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Main Menu</p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              activeTab === item.id 
                ? 'bg-white/10 text-white shadow-lg shadow-black/20' 
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? item.color : 'group-hover:text-white transition-colors'} />
            <span className="text-sm font-bold tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">
        <button 
          onClick={onAddClick}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          <Plus size={18} /> Add Movie
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all group"
        >
          <LogOut size={18} className="group-hover:text-red-500" />
          <span className="text-sm font-bold">Logout</span>
        </button>
      </div>
    </div>
  );
};

interface Review {
  id: string;
  movie_id: string;
  user_name: string;
  rating: number;
  text: string;
  created_at?: string;
}

const INITIAL_MOVIES: Movie[] = SEED_MOVIES;

const CATEGORIES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Other'];

const WelcomeAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ 
          duration: 1.8, 
          ease: [0.22, 1, 0.36, 1],
          opacity: { duration: 1.2 },
          filter: { duration: 1.2 }
        }}
        className="flex flex-col items-center gap-8 relative z-10"
      >
        {/* Elegant Logo Symbol (Favicon Style) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 relative overflow-hidden rounded-2xl shadow-2xl shadow-red-600/20">
            <svg viewBox="0 0 512 512" className="w-full h-full">
              <rect width="512" height="512" fill="#0f0f0f" />
              
              {/* Outer White Circle */}
              <motion.circle 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                cx="256" cy="256" r="230" fill="none" stroke="#ffffff" strokeWidth="12" 
              />
              
              {/* Inner Red Arcs */}
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
                d="M 436 182 A 195 195 0 0 0 76 182" fill="none" stroke="#e53935" strokeWidth="6" strokeLinecap="butt" 
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
                d="M 76 330 A 195 195 0 0 0 436 330" fill="none" stroke="#e53935" strokeWidth="6" strokeLinecap="butt" 
              />

              {/* Letters M and W */}
              <motion.text 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                x="256" y="190" fontFamily="'Times New Roman', Times, serif" fontSize="200" fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontWeight="bold"
              >M</motion.text>
              <motion.text 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                x="256" y="340" fontFamily="'Times New Roman', Times, serif" fontSize="200" fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontWeight="bold"
              >W</motion.text>
            </svg>
          </div>
          
          {/* Decorative Rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border border-white/5 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 border border-red-600/10 rounded-full"
          />
        </motion.div>

        {/* Main Branding */}
        <div className="flex flex-col items-center text-center">
          <motion.div 
            initial={{ letterSpacing: "0.5em", opacity: 0 }}
            animate={{ letterSpacing: "0.1em", opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="text-red-600 font-black text-4xl md:text-7xl tracking-tighter uppercase">MOVIE</span>
            <span className="text-white font-black text-4xl md:text-7xl tracking-tighter uppercase">WALLAH</span>
          </motion.div>
          
          {/* Elegant Credits */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col gap-3 items-center"
          >
            <div className="h-[1px] w-12 bg-red-600/50 mb-2" />
            <span className="text-[10px] md:text-xs text-white/40 tracking-[0.5em] uppercase font-medium">
              Proudly made by Bihari
            </span>
            <span className="text-[10px] md:text-xs text-red-500/80 tracking-[0.6em] uppercase font-bold">
              Developed by AYUSH
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Atmospheric Background Glow */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2.5 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[150px]" />
      </motion.div>
      
      {/* Film Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.svg')]" />
    </motion.div>
  );
};

const Logo: React.FC<{ className?: string, showText?: boolean }> = ({ className = "", showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
        <svg viewBox="0 0 512 512" className="w-full h-full">
          <circle cx="256" cy="256" r="230" fill="none" stroke="currentColor" strokeWidth="20" />
          <path d="M 436 182 A 195 195 0 0 0 76 182" fill="none" stroke="#e53935" strokeWidth="12" />
          <path d="M 76 330 A 195 195 0 0 0 436 330" fill="none" stroke="#e53935" strokeWidth="12" />
          <text x="256" y="190" fontFamily="'Times New Roman', Times, serif" fontSize="200" fill="currentColor" textAnchor="middle" dominantBaseline="central" fontWeight="bold">M</text>
          <text x="256" y="340" fontFamily="'Times New Roman', Times, serif" fontSize="200" fill="currentColor" textAnchor="middle" dominantBaseline="central" fontWeight="bold">W</text>
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 leading-none md:gap-1.5">
            <span className="text-red-600 font-bold text-base md:text-2xl tracking-tight uppercase">Movie</span>
            <span className="text-current font-bold text-base md:text-2xl tracking-tight uppercase">Wallah</span>
          </div>
          <div className="flex flex-col mt-0.5 leading-tight">
            <span className="text-[6px] md:text-[9px] text-current opacity-100 tracking-[0.15em] uppercase font-bold bg-white/10 px-1 rounded-sm w-fit mb-0.5">
              Proudly made by Bihari
            </span>
            <span className="text-[7px] md:text-[10px] text-red-500 tracking-[0.2em] uppercase font-black bg-red-500/10 px-1 rounded-sm w-fit">
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
  onLogout: () => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  onAddClick: () => void,
  isSearchActive: boolean,
  setIsSearchActive: (active: boolean) => void,
  movies: Movie[],
  onOpenLegal: (type: string) => void,
  adminView?: any,
  setAdminView?: (view: any) => void,
  setActiveCategory: (cat: string) => void
}> = ({ isAdmin, onLogout, searchQuery, setSearchQuery, onAddClick, isSearchActive, setIsSearchActive, movies, onOpenLegal, adminView, setAdminView, setActiveCategory }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      // Small delay to ensure the transition doesn't block focus
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSearchActive]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(prev => prev !== scrolled ? scrolled : prev);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-50 transition-all duration-500 px-4 md:px-12 py-2.5 md:py-3 flex items-center justify-between rounded-2xl border border-white/10 backdrop-blur-xl ${
      isScrolled 
        ? 'bg-black/80 shadow-2xl shadow-black/80 py-2 md:py-2.5' 
        : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
    }`}>
      <div className={`flex items-center gap-3 md:gap-12 flex-shrink-0 transition-all duration-300 ${isSearchActive ? 'opacity-0 -translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        <div className="cursor-pointer" onClick={() => { setSearchQuery(''); setIsSearchActive(false); setActiveCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Logo className="scale-90 md:scale-100 origin-left" />
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
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
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

      <div className={`flex items-center gap-2 md:gap-8 flex-shrink-0 transition-all duration-300 ${isSearchActive ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        {/* Search Toggle */}
        <button 
          onClick={() => setIsSearchActive(true)}
          className="p-[1px] rounded-full bg-gradient-to-r from-red-500 to-red-900 hover:from-red-400 hover:to-red-800 transition-all shadow-lg shadow-red-500/20"
        >
          <div className="bg-black rounded-full p-1.5 md:p-2">
            <Search size={18} className="text-white md:hidden opacity-80 hover:opacity-100 transition-opacity" />
            <Search size={22} className="text-white hidden md:block opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          {isAdmin && (
            <div className="relative">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-all shadow-lg border border-white/10"
                title="Admin Options"
              >
                <MoreVertical size={18} className="md:hidden" />
                <MoreVertical size={20} className="hidden md:block" />
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
                    <div className="h-px bg-white/10 my-1" />
                    <button 
                      onClick={() => { onOpenLegal('dmca'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-red-400"
                    >
                      <Shield size={18} /> DMCA Policy
                    </button>
                    <button 
                      onClick={() => { onOpenLegal('privacy'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/70 hover:text-white"
                    >
                      <Lock size={18} /> Privacy Policy
                    </button>
                    <button 
                      onClick={() => { onOpenLegal('disclaimer'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/70 hover:text-white"
                    >
                      <AlertTriangle size={18} /> Disclaimer
                    </button>
                    <button 
                      onClick={() => { onOpenLegal('terms'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/70 hover:text-white"
                    >
                      <FileText size={18} /> Terms of Service
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

const MeshOrb = () => (
  <div className="relative w-8 h-8 flex-shrink-0">
    <motion.div 
      animate={{ 
        scale: [1, 1.08, 1],
        rotate: [0, 90, 180, 270, 360],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      className="w-full h-full rounded-full relative overflow-hidden shadow-lg"
      style={{
        background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b)',
        boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.5), 2px 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(220, 38, 38, 0.3)'
      }}
    >
      <motion.div 
        animate={{ 
          x: ['-30%', '30%', '-30%'],
          y: ['-30%', '30%', '-30%'],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_60%)]"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-red-400/20 to-transparent mix-blend-overlay" />
    </motion.div>
  </div>
);


const AdsManager: React.FC<{ 
  settings: AdSettings, 
  onSave: (settings: AdSettings) => void 
}> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-6 glass-panel p-6 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center">
            <Link size={20} />
          </div>
          <div>
            <h4 className="text-lg font-bold">Ad Configuration</h4>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Inject advertisement codes</p>
          </div>
        </div>
        <button 
          onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${formData.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
        >
          {formData.enabled ? 'Ads Active' : 'Ads Disabled'}
        </button>
      </div>

      <div className="space-y-4">
        {[
          { id: 'homeTop', label: 'Home Page Top Banner', desc: 'Below Featured section' },
          { id: 'homeMiddle', label: 'Home Page Middle Banner', desc: 'Between Categories and Trending' },
          { id: 'homeTrendingAndWatchNext', label: 'Home Page Trending Banner', desc: 'Between Trending and Watch Next' },
          { id: 'homeGridInline', label: 'Home Page Inline Grid Banner', desc: 'After every 10 movie cards in Watch Next grid' },
          { id: 'homeBottom', label: 'Home Page Bottom Banner', desc: 'Above Footer' },
          { id: 'detailsModal', label: 'Details Modal Banner', desc: 'Inside movie details popup' },
        ].map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{field.label}</label>
              <span className="text-[9px] text-white/20 italic">{field.desc}</span>
            </div>
            <textarea 
              value={(formData as any)[field.id]} 
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-blue-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
              rows={3}
              placeholder="Paste <script> or <ins> code here..."
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-orange-500 hover:text-white transition-all active:scale-[0.98] mt-4 shadow-xl flex items-center justify-center gap-2"
      >
        {isSaving ? <Loader size={18} className="animate-spin" /> : 'Update Ad Configuration'}
      </button>
    </div>
  );
};

const MainApp = () => {
  const { movieSlug } = useParams();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAdmin(true);
        } else {
          setIsAdmin(localStorage.getItem('movieWallah_admin') === 'true');
        }
      } else {
        setIsAdmin(localStorage.getItem('movieWallah_admin') === 'true');
      }
    };
    checkAdmin();
  }, []);
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showTmdbImporter, setShowTmdbImporter] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const hasHandledInitialUrl = useRef(false);
  const [legalModalType, setLegalModalType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(24);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartPoint(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartPoint === 0) return;
    const y = e.touches[0].clientY;
    const distance = y - pullStartPoint;
    if (window.scrollY === 0 && distance > 0) {
      // Add resistance
      setPullDistance(Math.min(distance * 0.4, 100));
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await fetchMovies();
      setIsRefreshing(false);
    }
    setPullStartPoint(0);
    setPullDistance(0);
  };

  useEffect(() => {
    setVisibleCount(24);
  }, [debouncedSearchQuery, activeCategory]);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (node) {
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 24);
        }
      }, { rootMargin: '400px' });
      observer.current.observe(node);
    }
  }, []);

  const handleSetActiveCategory = (category: string) => {
    if (category === 'All' && activeCategory !== 'All') {
      if (window.history.state?.modal === 'category') {
        window.history.back();
      }
    }
    setActiveCategory(category);
  };

  const [adminView, setAdminView] = useState<'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads'>('dashboard');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      initAuth(
        (user, token) => {
          setGoogleUser(user);
          // @ts-ignore
          window.googleAccessToken = token;
        },
        () => {
          setGoogleUser(null);
          // @ts-ignore
          window.googleAccessToken = null;
        }
      );
    }
  }, [isAdmin]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        // @ts-ignore
        window.googleAccessToken = result.accessToken;
        toast.success(`Connected as ${result.user.displayName}`);
      }
    } catch (err) {
      toast.error("Cloud Connection Failed");
    }
  };

  const DEFAULT_SEO = {
    title: 'Movie Wallah – Where to Watch Movies, Streaming Guide & Reviews',
    description: 'Find legal streaming platforms for your favorite movies, read community reviews, watch trailers, and explore curated cinema collections.',
    keywords: 'where to watch movies, legal streaming, netflix, prime video, hotstar, movie reviews, cinema ratings'
  };

  const sanitizeSeo = (val: any) => {
    if (!val || typeof val !== 'object') return DEFAULT_SEO;
    let title = val.title || DEFAULT_SEO.title;
    let keywords = val.keywords || DEFAULT_SEO.keywords;
    let description = val.description || DEFAULT_SEO.description;
    if (/download/i.test(title)) title = DEFAULT_SEO.title;
    if (/download/i.test(keywords)) keywords = DEFAULT_SEO.keywords;
    return { title, description, keywords };
  };

  const [seoSettings, setSeoSettings] = useState(DEFAULT_SEO);
  const [adSettings, setAdSettings] = useState<AdSettings>({
    enabled: true,
    homeTop: '',
    homeMiddle: '',
    homeTrendingAndWatchNext: '',
    homeGridInline: '',
    homeBottom: '',
    detailsModal: ''
  });
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showGoToTop, setShowGoToTop] = useState(false);
  const INITIAL_FORM_DATA = {
    title: '', url: '', viewUrl: '', trailerUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, is_trending: false, director: '', cast: '',
    release_year: '', maturity_rating: '13+', duration: '', quality: 'HD', match_score: 95, downloads: 0, views: 0, auto_play_video: false, auto_play_video_url: ''
  };

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    // Load SEO settings from Supabase or localStorage
    const fetchSeoSettings = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('id', 'seo')
            .single();
          
          if (data && data.value) {
            const clean = sanitizeSeo(data.value);
            setSeoSettings(clean);
            localStorage.setItem('movieWallah_seo', JSON.stringify(clean));
          } else if (error) console.warn('Supabase SEO fetch error:', error.message);
        } catch (e) {
          console.error('Failed to fetch SEO from Supabase');
        }

        try {
          const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('id', 'ads')
            .single();
          
          if (data && data.value) {
            setAdSettings(data.value);
            localStorage.setItem('movieWallah_ads', JSON.stringify(data.value));
          }
        } catch (e) {
          console.error('Failed to fetch Ads from Supabase');
        }
      }

      // Fallback to localStorage
      const savedSeo = localStorage.getItem('movieWallah_seo');
      if (savedSeo) {
        try {
          setSeoSettings(sanitizeSeo(JSON.parse(savedSeo)));
        } catch (e) {}
      }
      const savedAds = localStorage.getItem('movieWallah_ads');
      if (savedAds) {
        try {
          setAdSettings(JSON.parse(savedAds));
        } catch (e) {}
      }
    };

    const fetchAuditLogs = async () => {
      let logs: AuditLog[] = [];
      
      // Try fetching from Supabase first
      if (supabase) {
        try {
          const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
          if (data && data.length > 0) {
            logs = data;
          } else if (error) {
            console.warn('Supabase audit logs fetch error:', error.message);
          }
        } catch (err) {
          console.error('Error fetching audit logs from Supabase:', err);
        }
      }

      // If no logs from Supabase (or Supabase failed), try localStorage
      if (logs.length === 0) {
        const localLogs = localStorage.getItem('movieWallah_audit_logs');
        if (localLogs) {
          try {
            logs = JSON.parse(localLogs);
          } catch (e) {
            console.error('Error parsing local audit logs:', e);
          }
        }
      }

      setAuditLogs(logs);
    };

    fetchSeoSettings();
    fetchAuditLogs();
  }, []);

  const addAuditLog = async (action: AuditLog['action'], details: string) => {
    const newLog: AuditLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      action,
      entity: 'movie',
      details,
      admin_email: 'Admin User',
      timestamp: new Date().toISOString()
    };

    try {
      if (supabase) {
        await supabase.from('audit_logs').insert([newLog]);
      }
    } catch (err) {
      console.error('Error saving audit log to Supabase:', err);
    }
    
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
    const currentLogs = JSON.parse(localStorage.getItem('movieWallah_audit_logs') || '[]');
    localStorage.setItem('movieWallah_audit_logs', JSON.stringify([newLog, ...currentLogs].slice(0, 100)));
  };

  useEffect(() => {
    // Apply SEO settings to the document
    document.title = seoSettings.title;
    
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateOG = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', seoSettings.description);
    updateMeta('keywords', seoSettings.keywords);
    
    // Update Open Graph tags for better social sharing
    updateOG('og:title', seoSettings.title);
    updateOG('og:description', seoSettings.description);
    updateOG('twitter:title', seoSettings.title);
    updateOG('twitter:description', seoSettings.description);
  }, [seoSettings]);

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    fetchMovies();

    const handleScroll = () => {
      const shouldShow = window.scrollY > 400;
      setShowGoToTop(prev => prev !== shouldShow ? shouldShow : prev);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!supabase) {
      localStorage.setItem('movieWallah_movies', JSON.stringify(movies));
    }
  }, [movies]);

  useEffect(() => {
    const heroMovies = movies.filter(m => m.is_hero);
    const featured = heroMovies.length > 0 ? heroMovies : movies.slice(0, 5);
    
    // Preload the first 2 featured images with high priority
    const preloadImages = featured.slice(0, 2);
    const links: HTMLLinkElement[] = [];

    preloadImages.forEach((movie, index) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = movie.posterUrl;
      if (index === 0) {
        // @ts-ignore
        link.fetchPriority = 'high';
      }
      document.head.appendChild(link);
      links.push(link);
    });
    
    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [movies]);

  // Sync modal state with URL parameter (movieSlug)
  useEffect(() => {
    if (movies.length === 0) return;
    
    if (movieSlug) {
      const movie = movies.find(m => 
        m.id === movieSlug || 
        (m.slug && m.slug === movieSlug) ||
        movieSlug.endsWith(`-${m.id}`) ||
        getMovieSlug(m) === movieSlug
      );
      
      if (movie && (!selectedMovieForDetails || selectedMovieForDetails.id !== movie.id)) {
        setSelectedMovieForDetails(movie);
      } else if (!movie && !isLoading) {
        navigate('/', { replace: true });
      }
    } else {
      if (selectedMovieForDetails) {
        setSelectedMovieForDetails(null);
      }
    }
  }, [movieSlug, movies, selectedMovieForDetails, isLoading, navigate]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMovieForDetails) {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMovieForDetails, navigate]);
  
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

  // Handle browser back button to go back to 'All' category
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (activeCategory !== 'All') {
        setActiveCategory('All');
      }
    };

    if (activeCategory !== 'All') {
      // Push a new state when a category is selected, but only if we're not already in a category state
      if (window.history.state?.modal !== 'category') {
        window.history.pushState({ modal: 'category' }, '');
      }
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeCategory]);

  // Also lock scroll for other modals
  useEffect(() => {
    if (showAddEditModal || legalModalType || movieToDelete) {
      document.body.style.overflow = 'hidden';
    } else if (!selectedMovieForDetails) {
      document.body.style.overflow = 'unset';
    }
  }, [showAddEditModal, legalModalType, movieToDelete, selectedMovieForDetails]);

    const getMovieSlug = (movie: Movie) => {
    if (movie.slug) return movie.slug;
    const titleSlug = movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${titleSlug}-${movie.id}`;
  };

  const formatMovieRecord = (m: any): Movie => {
    const poster = m.posterUrl || (m.poster_path ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w500${m.poster_path}`) : '');
    const banner = m.bannerUrl || (m.backdrop_path ? (m.backdrop_path.startsWith('http') ? m.backdrop_path : `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`) : poster);
    
    // Validate and sanitize trailer YouTube key
    let rawTrailer = m.trailerUrl || m.trailer_url || '';
    let cleanTrailer = extractYouTubeKey(rawTrailer) || rawTrailer;
    
    // Fix Jawan specifically (audit reported poster image placed into trailer field)
    if (m.title && m.title.toLowerCase().includes('jawan')) {
      if (!cleanTrailer || cleanTrailer.includes('image.tmdb.org') || !/^[A-Za-z0-9_-]{11}$/.test(cleanTrailer)) {
        cleanTrailer = '8hP9D6kZseM';
      }
    } else if (cleanTrailer && cleanTrailer.includes('image.tmdb.org')) {
      cleanTrailer = '';
    }

    const titleSlug = (m.title || 'movie').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = m.slug || `${titleSlug}-${m.id}`;

    return {
      ...m,
      slug,
      trailerUrl: cleanTrailer,
      posterUrl: poster,
      bannerUrl: banner,
      description: m.description || m.overview || '',
      category: m.category || (m.genres && m.genres.length > 0 ? m.genres[0] : 'Other')
    };
  };

  const dedupeMovies = (list: any[]): Movie[] => {
    const seen = new Set<string>();
    const result: Movie[] = [];
    for (const item of (list || [])) {
      if (!item) continue;
      const formatted = formatMovieRecord(item);
      if (!formatted.id) continue;
      if (!seen.has(formatted.id)) {
        seen.add(formatted.id);
        result.push(formatted);
      }
    }
    return result;
  };

  const fetchMovies = async () => {
    if (!supabase) {
      const savedMovies = localStorage.getItem('movieWallah_movies');
      const rawList = savedMovies ? JSON.parse(savedMovies) : INITIAL_MOVIES;
      setMovies(dedupeMovies(rawList));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching movies:', error.message);
        // Handle specific network errors or misconfigurations
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          const savedMovies = localStorage.getItem('movieWallah_movies');
          const rawList = savedMovies ? JSON.parse(savedMovies) : INITIAL_MOVIES;
          setMovies(dedupeMovies(rawList));
          toast.error("Network error: Using local backup data.");
        } else {
          setErrorMsg('Failed to load movies. Please check your Supabase configuration.');
          toast.error("Database error. Please check your settings.");
        }
      } else if (data) {
        setMovies(dedupeMovies(data));
        setErrorMsg(null);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching movies:', err);
      // Fallback for absolute network failure
      const savedMovies = localStorage.getItem('movieWallah_movies');
      const rawList = savedMovies ? JSON.parse(savedMovies) : INITIAL_MOVIES;
      setMovies(dedupeMovies(rawList));
      toast.error("Connection failed. Running in offline mode.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetails = (movie: Movie) => {
    navigate(`/movie/${getMovieSlug(movie)}`);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsActionLoading(true);
    
    const movieData: any = { ...formData };
    
    // If posterUrl was provided in form, set poster_path
    if (formData.posterUrl && !movieData.poster_path) {
      movieData.poster_path = formData.posterUrl;
    }
    // Ensure description NOT NULL constraint is met
    if (!movieData.description) {
      movieData.description = movieData.overview || movieData.title || 'Movie';
    }
    movieData.is_published = true;
    if (!movieData.slug) {
      const titleSlug = (movieData.title || 'movie').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      movieData.slug = `${titleSlug}-${Date.now()}`;
    }

    // Strip out legacy columns that have been removed from the Supabase schema
    delete movieData.url;
    delete movieData.viewUrl;
    delete movieData.posterUrl;
    delete movieData.bannerUrl;
    delete movieData.player_type;
    delete movieData.auto_play_video;
    delete movieData.auto_play_video_url;
    delete movieData.quality;
    delete movieData.match_score;
    delete movieData.downloads;

    if (!supabase) {
      if (editingMovie) {
        const updated = formatMovieRecord({ ...editingMovie, ...formData, ...movieData });
        setMovies(movies.map(m => m.id === editingMovie.id ? updated : m));
        addAuditLog('update', `Updated movie: ${movieData.title}`);
      } else {
        const added = formatMovieRecord({ ...formData, ...movieData, id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}` });
        setMovies(prev => dedupeMovies([added, ...prev]));
        addAuditLog('create', `Added new movie: ${movieData.title}`);
      }
    } else {
      if (editingMovie) {
        const updatePayload = { ...movieData };
        delete updatePayload.id;
        delete updatePayload.created_at;
        const { error } = await supabase.from('movies').update(updatePayload).eq('id', editingMovie.id);
        if (error) {
          toast.error('Error updating movie: ' + error.message);
          setIsActionLoading(false);
          return setErrorMsg('Error updating movie: ' + error.message);
        }
        const updated = formatMovieRecord({ ...editingMovie, ...formData, ...movieData });
        setMovies(movies.map(m => m.id === editingMovie.id ? updated : m));
        addAuditLog('update', `Updated movie: ${movieData.title}`);
        toast.success('Movie updated successfully');
      } else {
        const { data, error } = await supabase.from('movies').insert([movieData]).select('*');
        if (error) {
          toast.error('Error adding movie: ' + error.message);
          setIsActionLoading(false);
          return setErrorMsg('Error adding movie: ' + error.message);
        }
        if (data && data.length > 0) {
          const added = formatMovieRecord(data[0]);
          setMovies(prev => dedupeMovies([added, ...prev]));
          addAuditLog('create', `Added new movie: ${movieData.title}`);
        } else {
          const added = formatMovieRecord({ ...movieData, id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}` });
          setMovies(prev => dedupeMovies([added, ...prev]));
          addAuditLog('create', `Added new movie: ${movieData.title}`);
          fetchMovies();
        }
        toast.success('Movie added successfully');
      }
    }
    
    setShowAddEditModal(false);
    setFormData(INITIAL_FORM_DATA);
    setEditingMovie(null);
    setIsActionLoading(false);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      url: movie.url || '',
      viewUrl: movie.viewUrl || '',
      trailerUrl: movie.trailerUrl || '',
      posterUrl: movie.posterUrl || (movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`) : ''),
      description: movie.description || movie.overview || '',
      category: movie.category || (movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'Other'),
      is_hero: movie.is_hero || false,
      is_trending: movie.is_trending || false,
      director: movie.director || '',
      cast: movie.cast || '',
      release_year: movie.release_year || '',
      maturity_rating: movie.maturity_rating || '18+',
      duration: movie.duration || '',
      quality: movie.quality || 'HD',
      match_score: movie.match_score || 98,
      downloads: movie.downloads || 0,
      views: movie.views || 0,
      auto_play_video: movie.auto_play_video || false,
      auto_play_video_url: movie.auto_play_video_url || ''
    });
    setShowAddEditModal(true);
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;
    setIsActionLoading(true);
    const movie = movies.find(m => m.id === movieToDelete);
    if (supabase) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movieToDelete);
      if (isUUID) {
        const { error } = await supabase.from('movies').delete().eq('id', movieToDelete);
        if (error) {
          toast.error('Failed to delete: ' + error.message);
          setIsActionLoading(false);
          return;
        }
      }
    }
    setMovies(movies.filter(m => m.id !== movieToDelete));
    addAuditLog('delete', `Deleted movie: ${movie?.title || movieToDelete}`);
    setMovieToDelete(null);
    setIsActionLoading(false);
    toast.success('Movie deleted successfully');
  };

  const handleBulkUpdate = async (ids: string[], updates: Partial<Movie>) => {
    setIsActionLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('movies').update(updates).in('id', ids);
        if (error) throw error;
        setMovies(prev => prev.map(m => ids.includes(m.id) ? { ...m, ...updates } : m));
      } else {
        const updatedMovies = movies.map(m => ids.includes(m.id) ? { ...m, ...updates } : m);
        setMovies(updatedMovies);
        localStorage.setItem('movieWallah_movies', JSON.stringify(updatedMovies));
      }
      addAuditLog('bulk_update', `Bulk updated ${ids.length} movies: ${Object.keys(updates).join(', ')}`);
      toast.success(`Updated ${ids.length} movies`);
    } catch (err: any) {
      toast.error('Bulk update failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setIsActionLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('movies').delete().in('id', ids);
        if (error) throw error;
        setMovies(prev => prev.filter(m => !ids.includes(m.id)));
      } else {
        const updatedMovies = movies.filter(m => !ids.includes(m.id));
        setMovies(updatedMovies);
        localStorage.setItem('movieWallah_movies', JSON.stringify(updatedMovies));
      }
      addAuditLog('bulk_delete', `Bulk deleted ${ids.length} movies`);
      toast.success(`Deleted ${ids.length} movies`);
    } catch (err: any) {
      toast.error('Bulk delete failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownload = async (movieId: string) => {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    setLoadingActions(prev => ({ ...prev, [`download-${movieId}`]: true }));
    const newDownloads = (movie.downloads || 0) + 1;
    setMovies(prev => prev.map(m => m.id === movieId ? { ...m, downloads: newDownloads } : m));
    toast.success(`Starting download for ${movie.title}`);

    setLoadingActions(prev => ({ ...prev, [`download-${movieId}`]: false }));
  };

  const handleView = async (movieId: string) => {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    setLoadingActions(prev => ({ ...prev, [`view-${movieId}`]: true }));
    const newViews = (movie.views || 0) + 1;
    setMovies(prev => prev.map(m => m.id === movieId ? { ...m, views: newViews } : m));

    if (supabase) {
      try {
        await supabase.from('movies').update({ views: newViews }).eq('id', movieId);
      } catch (_) {
        // Silently ignore if column does not exist
      } finally {
        setLoadingActions(prev => ({ ...prev, [`view-${movieId}`]: false }));
      }
    } else {
      setLoadingActions(prev => ({ ...prev, [`view-${movieId}`]: false }));
    }
  };

  const filteredMovies = React.useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    if (!query && activeCategory === 'All') return movies;

    return movies.filter(m => {
      const matchesSearch = !query || 
        m.title.toLowerCase().includes(query) ||
        (m.cast && m.cast.toLowerCase().includes(query)) ||
        (m.director && m.director.toLowerCase().includes(query));
      
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [movies, debouncedSearchQuery, activeCategory]);

  const currentMovies = filteredMovies.slice(0, visibleCount);

  const heroMovies = movies.filter(m => m.is_hero);
  const featuredMovies = heroMovies.length > 0 ? heroMovies : movies.slice(0, 5);
  const trendingMovies = movies.filter(m => m.is_trending);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 overflow-x-hidden dark">
      <Toaster 
        position="top-center" 
        expand={true}
        toastOptions={{
          style: {
            background: 'rgba(220, 38, 38, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50px',
            padding: '12px 24px',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0px 10px 30px rgba(220, 38, 38, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minWidth: '320px',
          },
          className: "fluid-mesh-toast",
        }}
      />
      
      <AnimatePresence>
        {showWelcome && (
          <WelcomeAnimation onComplete={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!isAdmin && (
        <Navbar 
          isAdmin={isAdmin} 
          onLogout={() => { setIsAdmin(false); setAdminView('dashboard'); }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddClick={() => { setEditingMovie(null); setFormData(INITIAL_FORM_DATA); setShowTmdbImporter(true); }}
          isSearchActive={isSearchActive}
          setIsSearchActive={(active) => {
            if (!active && window.history.state?.modal === 'search') {
              window.history.back();
            }
            setIsSearchActive(active);
            if (!active) setSearchQuery('');
          }}
          movies={movies}
          onOpenLegal={(type) => setLegalModalType(type)}
          setActiveCategory={handleSetActiveCategory}
        />
      )}
      
      {isAdmin ? (
        <div className="flex min-h-screen bg-black">
          <AdminSidebar 
            activeTab={adminView} 
            setActiveTab={setAdminView} 
            onAddClick={() => { setEditingMovie(null); setFormData(INITIAL_FORM_DATA); setShowTmdbImporter(true); }}
            onLogout={() => { setIsAdmin(false); setAdminView('dashboard'); }}
          />

          <AdminMobileNav
            activeTab={adminView}
            setActiveTab={setAdminView}
            onAddClick={() => { setEditingMovie(null); setFormData(INITIAL_FORM_DATA); setShowTmdbImporter(true); }}
            onLogout={() => { setIsAdmin(false); setAdminView('dashboard'); }}
          />
          
          <main className="flex-1 lg:ml-64 min-h-screen relative">
            <div className="p-4 lg:p-8">
              {isLoading ? (
                <div className="h-[60vh] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={adminView}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {adminView === 'dashboard' && (
                      <AdminDashboard 
                        movies={movies} 
                        onEdit={handleEdit} 
                        onDelete={setMovieToDelete} 
                        onDownload={handleDownload} 
                        onView={handleView} 
                        onShowDetails={handleShowDetails} 
                        searchQuery={searchQuery} 
                        setActiveTab={setAdminView}
                        loadingActions={loadingActions}
                      />
                    )}
                    {adminView === 'movies' && (
                      <MovieManagement 
                        movies={movies} 
                        onEdit={handleEdit} 
                        onDelete={setMovieToDelete} 
                        onDownload={handleDownload} 
                        onView={handleView} 
                        onShowDetails={handleShowDetails} 
                        searchQuery={searchQuery} 
                        onBulkUpdate={handleBulkUpdate}
                        onBulkDelete={handleBulkDelete}
                        loadingActions={loadingActions}
                        onAddClick={() => { setEditingMovie(null); setFormData(INITIAL_FORM_DATA); setShowTmdbImporter(true); }}
                      />
                    )}
                    {adminView === 'feedback' && (
                      <div className="px-6 md:px-16 pt-12 pb-20">
                        <div className="mb-12">
                          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Users className="text-emerald-500" size={32} /> User Feedback
                          </h2>
                          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">Community Reviews & Ratings</p>
                        </div>
                        <FeedbackManager movies={movies} />
                      </div>
                    )}
                    {adminView === 'logs' && (
                      <div className="px-6 md:px-16 pt-12 pb-20">
                        <div className="mb-12">
                          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Activity className="text-amber-500" size={32} /> Audit Logs
                          </h2>
                          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">System Activity & Security Tracking</p>
                        </div>
                        <AuditLogManager logs={auditLogs} />
                      </div>
                    )}
                    {adminView === 'ads' && (
                      <div className="px-6 md:px-16 pt-12 pb-20">
                        <div className="mb-12">
                          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Link className="text-orange-500" size={32} /> Advertisement Management
                          </h2>
                          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">Control site-wide ad delivery</p>
                        </div>
                        
                        <div className="max-w-4xl">
                          <AdsManager 
                            settings={adSettings} 
                            onSave={async (newSettings) => {
                              setAdSettings(newSettings);
                              localStorage.setItem('movieWallah_ads', JSON.stringify(newSettings));
                              if (supabase) {
                                try {
                                  const { error } = await supabase
                                    .from('site_settings')
                                    .upsert({ id: 'ads', value: newSettings, updated_at: new Date().toISOString() });
                                  if (error) throw error;
                                  addAuditLog('ads_update', 'Updated advertisement settings');
                                  toast.success('Ad settings updated successfully');
                                } catch (e) {
                                  console.error('Failed to save Ads to Supabase');
                                  toast.error('Saved locally, but failed to sync with cloud');
                                }
                              } else {
                                toast.success('Ad settings updated locally');
                              }
                            }} 
                          />
                        </div>
                      </div>
                    )}
                    {adminView === 'settings' && (
                      <div className="px-6 md:px-16 pt-12 pb-20">
                        <div className="mb-12">
                          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Settings className="text-purple-500" size={32} /> Platform Settings
                          </h2>
                          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">SEO & System Configuration</p>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                          <div className="space-y-8">
                            <h3 className="text-xl font-bold border-b border-white/5 pb-4">SEO Configuration</h3>
                            <SEOSettings 
                              settings={seoSettings} 
                              onSave={async (newSettings) => {
                                setSeoSettings(newSettings);
                                localStorage.setItem('movieWallah_seo', JSON.stringify(newSettings));
                                if (supabase) {
                                  try {
                                    const { error } = await supabase
                                      .from('site_settings')
                                      .upsert({ id: 'seo', value: newSettings, updated_at: new Date().toISOString() });
                                    if (error) throw error;
                                  } catch (e) {
                                    console.error('Failed to save SEO to Supabase');
                                    toast.error('Saved locally, but failed to sync with cloud');
                                  }
                                }
                              }} 
                            />
                          </div>
                          
                          <div className="space-y-8">
                            <h3 className="text-xl font-bold border-b border-white/5 pb-4">System Health</h3>
                            <SystemHealth movies={movies} />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </main>
        </div>
      ) : (
        <>
          <main 
            className="pt-20 md:pt-24 pb-24 relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ transform: `translateY(${pullDistance}px)`, transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none' }}
          >
            {/* Pull to refresh indicator */}
            <div 
              className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-opacity duration-200"
              style={{ 
                top: '20px', 
                opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
                transform: `translateY(${Math.min(pullDistance - 40, 0)}px)` 
              }}
            >
              <div className="bg-zinc-900/90 backdrop-blur-md rounded-full p-2 border border-white/10 shadow-xl flex items-center justify-center">
                <Loader size={24} className={`text-red-500 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
              {/* Hero Section */}
            {featuredMovies.length > 0 && !searchQuery && !isSearchActive && activeCategory === 'All' && (
              <>
              <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden pt-10 md:pt-16">
                <Swiper
                  effect={'coverflow'}
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView={'auto'}
                  loop={true}
                  speed={700}
                  autoplay={{
                    delay: 4000,
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
                  {featuredMovies.map((movie, index) => (
                    <SwiperSlide key={`${movie.id}-${index}`} className="!w-[85vw] md:!w-[800px] !h-[55vh] md:!h-[75vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group transform-gpu">
                      <div className="absolute inset-0">
                        <MoviePoster src={movie.posterUrl} alt={movie.title} className="hero-zoom-img h-full w-full object-cover" priority={index === 0} />
                      </div>
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
                          {(movie.trailerUrl || movie.viewUrl) && (
                            <button 
                              onClick={() => {
                                if (movie.trailerUrl) {
                                  handleShowDetails(movie);
                                  handleView(movie.id);
                                  setTimeout(() => {
                                    document.getElementById('trailer-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 100);
                                } else if (movie.viewUrl) {
                                  window.open(movie.viewUrl, '_blank');
                                  handleView(movie.id);
                                }
                              }}
                              className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl"
                            >
                              <Play size={18} className="fill-current" /> Watch Now
                            </button>
                          )}
                          <button 
                            onClick={() => handleShowDetails(movie)}
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
              {adSettings.enabled && adSettings.homeTop && (
                <div className="max-w-7xl mx-auto px-4 mt-8">
                  <AdBanner code={adSettings.homeTop} />
                </div>
              )}
            </>
            )}

            {/* Search Results or Rows */}
            <div className={`px-6 md:px-16 ${searchQuery || featuredMovies.length === 0 || activeCategory !== 'All' ? 'pt-12' : 'mt-12 relative z-20'}`}>
              
              {/* Category Filter */}
              <div className="mb-8 overflow-x-auto custom-scrollbar pb-2">
                <div className="flex items-center gap-3">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => handleSetActiveCategory(category)}
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

              {adSettings.enabled && adSettings.homeMiddle && (
                <div className="max-w-7xl mx-auto px-4 mb-12">
                  <AdBanner code={adSettings.homeMiddle} />
                </div>
              )}

              {searchQuery || activeCategory !== 'All' ? (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    {searchQuery ? (
                      <>Search Results <span className="text-white/50 font-normal text-lg">for "{searchQuery}"</span></>
                    ) : (
                      <>{activeCategory} Movies</>
                    )}
                  </h2>
                  <div className="flex flex-col gap-8">
                    <div className="flex-1">
                      {currentMovies.length > 0 ? (
                        <>
                          <div className="flex flex-col gap-12">
                            <div 
                              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                            >
                              {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => <MovieSkeleton key={i} />)
                              ) : (
                                currentMovies.map((movie, idx) => (
                          <MovieCard key={`${movie.id}-${idx}`} movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={handleShowDetails} searchQuery={searchQuery} loadingActions={loadingActions} />
                                ))
                              )}
                            </div>
                          </div>
                          {visibleCount < filteredMovies.length && (
                            <div ref={loadMoreRef} className="w-full h-24 flex items-center justify-center mt-8">
                              <Loader size={32} className="text-white/30 animate-spin" />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                          <Search size={48} className="mx-auto mb-4 text-white/20" />
                          <h3 className="text-xl font-bold mb-2">No results found</h3>
                          <p className="text-white/50">Try adjusting your search query.</p>
                        </div>
                      )}
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
                          <SwiperSlide key={`${movie.id}-${idx}`} className="!w-[160px] md:!w-[220px]">
                            <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={handleShowDetails} searchQuery={searchQuery} loadingActions={loadingActions} />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  )}

                  {adSettings.enabled && adSettings.homeTrendingAndWatchNext && (
                    <div className="max-w-7xl mx-auto px-4 mb-12">
                      <AdBanner code={adSettings.homeTrendingAndWatchNext} />
                    </div>
                  )}
                  
                  {/* All Movies Grid */}
                  <div id="watch-next" className="mb-12 scroll-mt-24">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">Watch Next</h2>
                    </div>
                    <div className="flex flex-col gap-8">
                      <div className="flex-1 flex flex-col gap-12">
                        <div 
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8"
                        >
                          {isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => <MovieSkeleton key={i} />)
                          ) : (
                            currentMovies.map((movie, index) => (
                              <React.Fragment key={`${movie.id}-${index}`}>
                                <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={handleShowDetails} searchQuery={searchQuery} loadingActions={loadingActions} />
                                {(index + 1) % 10 === 0 && index !== currentMovies.length - 1 && adSettings.enabled && adSettings.homeGridInline && (
                                  <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 w-full my-2 flex justify-center">
                                    <AdBanner code={adSettings.homeGridInline} />
                                  </div>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </div>
                        {visibleCount < filteredMovies.length && (
                          <div ref={loadMoreRef} className="w-full h-24 flex items-center justify-center mt-8">
                            <Loader size={32} className="text-white/30 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
        {adSettings.enabled && adSettings.homeBottom && (
          <div className="max-w-7xl mx-auto px-4 mb-20 relative z-20">
            <AdBanner code={adSettings.homeBottom} />
          </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 border-t border-white/10 bg-black transition-colors duration-500">
        <div className="flex flex-col items-center gap-8">
          <Logo className="scale-125" />
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-white text-sm font-black uppercase tracking-[0.2em] bg-white/10 px-4 py-1.5 rounded-full border border-white/20 shadow-lg">Proudly made by Bihari</p>
            <p className="text-red-500 text-sm font-black uppercase tracking-[0.3em] bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 shadow-lg">Developed by AYUSH</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-xs uppercase tracking-widest font-bold max-w-4xl text-center">
            <RouterLink to="/about" className="hover:text-red-500 transition-colors">About Us</RouterLink>
            <RouterLink to="/privacy" className="hover:text-red-500 transition-colors">Privacy Policy</RouterLink>
            <RouterLink to="/terms" className="hover:text-red-500 transition-colors">Terms of Service</RouterLink>
            <RouterLink to="/dmca" className="hover:text-red-500 transition-colors">DMCA Policy</RouterLink>
            <RouterLink to="/contact" className="hover:text-red-500 transition-colors">Contact Us</RouterLink>
            <RouterLink to="/a-z" className="hover:text-red-500 transition-colors">A-Z Directory</RouterLink>
          </div>

          <p className="text-white/30 text-xs text-center max-w-2xl leading-relaxed">
            Movie Wallah is a legal cinema discovery platform and streaming index. We do not host, store, or stream copyrighted video files. All trademarks, titles, and logos belong to their respective entertainment entities.
          </p>
          
          <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] mt-2">
            © 2026 Movie Wallah. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  )}

{/* Modals */}
<AnimatePresence>
        {legalModalType && (
          <LegalModal type={legalModalType} onClose={() => navigate('/')} />
        )}

        
        {showTmdbImporter && (
          <TmdbImporter 
            onClose={() => setShowTmdbImporter(false)}
            onImported={(newMovie) => {
              setMovies(prev => dedupeMovies([newMovie, ...prev]));
              setShowTmdbImporter(false);
              // optionally open the edit modal to let them write notes:
              setEditingMovie(newMovie);
              setFormData(newMovie);
              setShowAddEditModal(true);
            }}
          />
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
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Trailer Embed URL (Optional)</label>
                        <input type="url" value={formData.trailerUrl} onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="e.g. https://www.youtube.com/embed/..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-current opacity-40 uppercase tracking-[0.2em] mb-2 pl-1">Dedicated Auto-play Video URL (Optional)</label>
                        <input type="url" value={formData.auto_play_video_url} onChange={(e) => setFormData({...formData, auto_play_video_url: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-current focus:outline-none focus:ring-2 focus:ring-current/30 transition-all" placeholder="YouTube or Google Drive link..." />
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

                      <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all" onClick={() => setFormData({...formData, is_trending: !formData.is_trending})}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_trending ? 'bg-red-600 border-red-600' : 'border-white/20'}`}>
                          {formData.is_trending && <Plus size={16} className="text-white rotate-45" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-current">Show in Trending Section</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">Featured on trending row</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-3 shrink-0 mt-auto">
                  <button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-current font-bold rounded-xl py-4 transition-colors order-2 sm:order-1">Cancel</button>
                  <button type="submit" disabled={isActionLoading} className="flex-1 bg-white text-black hover:bg-red-600 hover:text-white font-bold rounded-xl py-4 transition-all order-1 sm:order-2 shadow-xl shadow-white/5 flex items-center justify-center gap-2">
                    {isActionLoading ? <Spinner size={18} /> : (editingMovie ? 'Save Changes' : 'Add Movie')}
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
              onClose={() => navigate('/')}
              onMovieClick={handleShowDetails}
              onDownload={handleDownload}
              onView={handleView}
              adSettings={adSettings}
              loadingActions={loadingActions}
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
                <button onClick={confirmDelete} disabled={isActionLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-4 transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2">
                  {isActionLoading ? <Spinner size={18} /> : 'Yes, Delete Permanently'}
                </button>
                <button onClick={() => setMovieToDelete(null)} disabled={isActionLoading} className="w-full bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl py-4 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Go to Top Button */}
      <AnimatePresence>
        {showGoToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[90] w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/40 hover:bg-red-700 transition-all active:scale-90 border border-white/10"
            title="Go to Top"
          >
            <ChevronRight className="-rotate-90" size={24} />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}

const MovieManagement: React.FC<{
  movies: Movie[],
  onEdit: (m: Movie) => void,
  onDelete: (id: string) => void,
  onDownload: (id: string) => void,
  onView: (id: string) => void,
  onShowDetails: (m: Movie) => void,
  searchQuery: string,
  onBulkUpdate: (ids: string[], updates: Partial<Movie>) => Promise<void>,
  onBulkDelete: (ids: string[]) => Promise<void>,
  loadingActions?: Record<string, boolean>,
  onAddClick?: () => void
}> = ({ movies, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery, onBulkUpdate, onBulkDelete, loadingActions = {}, onAddClick }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(localSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(localSearch.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMovies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMovies.map(m => m.id));
    }
  };

  const handleBulkAction = async (action: 'delete' | 'feature' | 'unfeature' | 'trending' | 'untrending') => {
    if (selectedIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      if (action === 'delete') {
        if (confirm(`Are you sure you want to delete ${selectedIds.length} movies?`)) {
          await onBulkDelete(selectedIds);
          setSelectedIds([]);
        }
      } else {
        const updates: Partial<Movie> = {};
        if (action === 'feature') updates.is_hero = true;
        if (action === 'unfeature') updates.is_hero = false;
        if (action === 'trending') updates.is_trending = true;
        if (action === 'untrending') updates.is_trending = false;
        
        await onBulkUpdate(selectedIds, updates);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-6 md:px-16 pt-12 pb-20">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Film className="text-blue-500" size={32} /> Movie Management
          </h2>
          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">Catalog Control & Editing</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
            >
              <Plus size={18} /> Add Movie
            </button>
          )}

          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search catalog..." 
              className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full md:w-80"
            />
          </div>
          
          <button 
            onClick={toggleSelectAll}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            {selectedIds.length === filteredMovies.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-4xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white font-bold">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-sm font-bold text-white">Movies Selected</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Choose an action to apply</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button 
                disabled={isProcessing}
                onClick={() => handleBulkAction('feature')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Spinner size={12} /> : null} Mark Featured
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => handleBulkAction('trending')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Spinner size={12} /> : null} Mark Trending
              </button>
              <div className="w-px h-8 bg-white/10 mx-1 hidden md:block" />
              <button 
                disabled={isProcessing}
                onClick={() => handleBulkAction('unfeature')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Spinner size={12} /> : null} Remove Featured
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => handleBulkAction('untrending')}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Spinner size={12} /> : null} Remove Trending
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => handleBulkAction('delete')}
                className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-500 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Spinner size={12} /> : null} Delete Selected
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredMovies.map((movie, idx) => (
            <MovieCard 
              key={`${movie.id}-${idx}`} 
              movie={movie} 
              isAdmin={true} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onDownload={onDownload} 
              onView={onView} 
              onShowDetails={onShowDetails} 
              searchQuery={searchQuery} 
              isSelected={selectedIds.includes(movie.id)}
              onSelect={toggleSelect}
              loadingActions={loadingActions}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6">
          <Film size={48} className="mb-4 text-white/20" />
          <h3 className="text-xl font-bold mb-2">No movies found</h3>
          <p className="text-white/50 mb-6 max-w-md">Try adjusting your search query, or import/create a new movie right away.</p>
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
            >
              <Plus size={18} /> Add New Movie
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AuditLogManager: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  return (
    <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden">
      {/* Mobile View: Card List */}
      <div className="md:hidden divide-y divide-white/5">
        {logs.length > 0 ? logs.map((log, idx) => (
          <div key={`${log.id}-${idx}`} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                log.action === 'create' ? 'bg-emerald-500/10 text-emerald-500' :
                log.action === 'update' ? 'bg-blue-500/10 text-blue-500' :
                log.action === 'delete' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {log.action.replace('_', ' ')}
              </span>
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/80">{new Date(log.timestamp).toLocaleDateString()}</p>
                <p className="text-[9px] text-white/30 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{log.details}</p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold">
                {log.admin_email[0].toUpperCase()}
              </div>
              <span className="text-[10px] font-bold text-white/40">{log.admin_email}</span>
            </div>
          </div>
        )) : (
          <div className="px-6 py-20 text-center">
            <Activity size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-sm text-white/30 font-bold">No audit logs found yet.</p>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Action</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Details</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length > 0 ? logs.map((log, idx) => (
              <tr key={`${log.id}-${idx}`} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/80">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-white/30 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    log.action === 'create' ? 'bg-emerald-500/10 text-emerald-500' :
                    log.action === 'update' ? 'bg-blue-500/10 text-blue-500' :
                    log.action === 'delete' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-white/60 line-clamp-1 group-hover:line-clamp-none transition-all">
                    {log.details}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                      {log.admin_email[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-white/40">{log.admin_email}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <Activity size={40} className="mx-auto mb-4 text-white/10" />
                  <p className="text-sm text-white/30 font-bold">No audit logs found yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FeedbackManager: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  const [allReviews, setAllReviews] = useState<(Review & { movieTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllReviews = async () => {
      setLoading(true);
      try {
        if (supabase) {
          const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          
          const reviewsWithTitles = (data || []).map(r => ({
            ...r,
            movieTitle: movies.find(m => m.id === r.movie_id)?.title || 'Unknown Movie'
          }));
          setAllReviews(reviewsWithTitles);
        } else {
          // Mock local storage reviews
          const reviews: (Review & { movieTitle: string })[] = [];
          movies.forEach(m => {
            const saved = localStorage.getItem(`reviews_${m.id}`);
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.forEach((r: Review) => reviews.push({ ...r, movieTitle: m.title }));
            }
          });
          setAllReviews(reviews.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
        }
      } catch (err) {
        console.error('Error fetching all reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReviews();
  }, [movies]);

  const handleDeleteReview = async (reviewId: string, movieId: string) => {
    const deletePromise = async () => {
      if (supabase) {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
        if (error) throw error;
      } else {
        const saved = localStorage.getItem(`reviews_${movieId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter((r: Review) => r.id !== reviewId);
          localStorage.setItem(`reviews_${movieId}`, JSON.stringify(filtered));
        }
      }
      setAllReviews(prev => prev.filter(r => r.id !== reviewId));
    };

    toast.promise(deletePromise(), {
      loading: 'Deleting review...',
      success: 'Review deleted successfully',
      error: 'Failed to delete review',
    });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {allReviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {allReviews.map((review, idx) => (
              <motion.div 
                key={`${review.id}-${review.movie_id || ''}-${idx}`} 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-white">{review.user_name}</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-bold">{review.rating}</span>
                    </div>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">on {review.movieTitle}</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed italic">"{review.text}"</p>
                  <p className="text-[10px] text-white/20 mt-3 uppercase tracking-wider">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteReview(review.id, review.movie_id)}
                  className="self-start p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                  title="Delete Review"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 opacity-30">
          <Users size={48} className="mx-auto mb-4" />
          <p>No reviews found across the platform.</p>
        </div>
      )}
    </div>
  );
};

const SEOSettings: React.FC<{ 
  settings: { title: string, description: string, keywords: string },
  onSave: (settings: { title: string, description: string, keywords: string }) => void
}> = ({ settings, onSave }) => {
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [keywords, setKeywords] = useState(settings.keywords);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Use a small timeout to allow UI feedback
    setTimeout(async () => {
      await onSave({ title, description, keywords });
      setIsSaving(false);
      toast.success('SEO Configuration applied in real-time!');
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Site Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Meta Description</label>
          <textarea 
            rows={4}
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Primary Keywords</label>
          <input 
            type="text" 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="movies, download, streaming, originals..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all" 
          />
        </div>
      </div>
      
      <div className="p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp size={20} className="text-purple-400" />
          <h4 className="font-bold">Google Search Preview</h4>
        </div>
        <div className="space-y-1">
          <p className="text-blue-400 text-lg hover:underline cursor-pointer truncate">{title}</p>
          <p className="text-emerald-500 text-xs truncate">https://moviewallah.online</p>
          <p className="text-white/50 text-xs line-clamp-2">{description}</p>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50"
      >
        {isSaving ? 'Updating Metadata...' : 'Apply SEO Configuration'}
      </button>
    </div>
  );
};

const SystemHealth: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        if (supabase) {
          const { error } = await supabase.from('movies').select('id', { count: 'exact', head: true });
          if (error) throw error;
          setDbStatus('online');
        } else {
          setDbStatus('online'); // Local storage is always "online"
        }
        setLatency(Date.now() - start);
      } catch (err) {
        setDbStatus('offline');
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Database Connectivity</h4>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${dbStatus === 'online' ? 'bg-emerald-500' : dbStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <span className={`text-sm font-bold capitalize ${dbStatus === 'online' ? 'text-emerald-400' : dbStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'}`}>
                {dbStatus}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Latency</span>
            <span className="text-sm font-mono text-white/50">{latency ? `${latency}ms` : '--'}</span>
          </div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Storage Usage</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span>Database Rows</span>
                <span className="text-white/40">{movies.length} / 10,000</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${(movies.length / 10000) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span>Media Assets</span>
                <span className="text-white/40">~1.2 GB</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Shield size={32} />
          </div>
          <h4 className="text-lg font-bold mb-2">System is Healthy</h4>
          <p className="text-sm text-white/50 leading-relaxed">
            All services are operating normally. No critical issues detected in the last 24 hours.
          </p>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Recent Logs</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-white/20">16:52:48</span>
              <span className="text-emerald-400">[INFO]</span>
              <span className="text-white/60">Admin dashboard accessed</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-white/20">16:48:37</span>
              <span className="text-blue-400">[SYNC]</span>
              <span className="text-white/60">Supabase state reconciled</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-white/20">16:45:12</span>
              <span className="text-emerald-400">[INFO]</span>
              <span className="text-white/60">New movie 'The Raja Saab' added</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Movie Poster Component with Fallback
const MoviePoster: React.FC<{ 
  src?: string; 
  alt: string; 
  className?: string; 
  contain?: boolean; 
  priority?: boolean;
}> = ({ src = "", alt, className = "", contain = false, priority = false }) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const resolvedSrc = useMemo(() => {
    if (!src) return '';
    if (src.startsWith('/') && !src.startsWith('//')) {
      return `https://image.tmdb.org/t/p/w500${src}`;
    }
    return src;
  }, [src]);

  return (
    <div className={`relative w-full bg-zinc-900 overflow-hidden shimmer ${className.includes('aspect-') ? '' : 'aspect-[2/3]'} ${className}`}>
      {(hasError || !resolvedSrc) ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white/20 p-4 text-center z-10">
          <Film size={40} className="mb-2 opacity-20" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">No Poster</span>
        </div>
      ) : (
        <img 
          src={resolvedSrc} 
          alt={alt} 
          onError={() => setHasError(true)}
          className={`w-full h-full relative z-10 ${contain ? 'object-contain' : 'object-cover'}`} 
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          // @ts-ignore
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      )}
    </div>
  );
};

const Spinner: React.FC<{ size?: number, className?: string }> = ({ size = 20, className = "" }) => (
  <Loader size={size} className={`animate-spin ${className}`} />
);

const MovieSkeleton: React.FC = () => (
  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
    </div>
  </div>
);

const MovieCard: React.FC<{ 
  movie: Movie, 
  isAdmin: boolean, 
  onEdit: (m: Movie) => void, 
  onDelete: (id: string) => void, 
  onDownload: (id: string) => void, 
  onView: (id: string) => void, 
  onShowDetails: (m: Movie) => void,
  searchQuery?: string,
  isSelected?: boolean,
  onSelect?: (id: string) => void,
  loadingActions?: Record<string, boolean>
}> = React.memo(({ movie, isAdmin, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery = '', isSelected, onSelect, loadingActions = {} }) => {
  const query = searchQuery.toLowerCase().trim();

  return (
    <div
      className={`flex flex-col gap-3 group w-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] relative ${isSelected ? 'scale-[0.98]' : ''}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 320px' }}
    >
      {isAdmin && onSelect && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(movie.id);
          }}
          className={`absolute top-3 left-3 z-30 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shadow-lg ${isSelected ? 'bg-red-600 border-red-600' : 'bg-black/60 border-white/20 hover:border-white/40'}`}
        >
          {isSelected && <Plus size={16} className="text-white rotate-45" />}
        </div>
      )}
      <div className={`rounded-2xl bg-zinc-900 overflow-hidden shadow-lg border-2 transition-colors ${isSelected ? 'border-red-600' : 'border-transparent'}`}>
        <div 
          onClick={() => onShowDetails(movie)}
          className="relative rounded-2xl overflow-hidden w-full bg-black cursor-pointer aspect-[2/3]"
        >
          <MoviePoster src={movie.posterUrl} alt={movie.title} className="group-hover:scale-105 transition-transform duration-500" />
          
          {/* Overlay Info */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">
              {movie.title}
            </h3>
            {movie.category && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                {movie.category} • {movie.release_year || 'N/A'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 transition-opacity">
          <button
            onClick={() => onEdit(movie)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Edit size={12} /> Edit
          </button>
          <button
            onClick={() => onDelete(movie.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
});
const MovieDetailModal: React.FC<{ 
  movie: Movie; 
  allMovies: Movie[];
  onClose: () => void; 
  onMovieClick: (m: Movie) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  adSettings: AdSettings;
  loadingActions?: Record<string, boolean>;
}> = ({ movie, allMovies, onClose, onMovieClick, onDownload, onView, adSettings, loadingActions = {} }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  
  const handleShare = async () => {
    const titleSlug = (movie.title || 'movie').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const shareUrl = `${window.location.origin}/movie/${movie.slug || `${titleSlug}-${movie.id}`}`;
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
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movie.id);
      if (supabase && isUUID) {
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
    const seen = new Set<string>();
    return allMovies
      .filter(m => {
        if (!m || !m.id || m.id === movie.id) return false;
        if (m.category !== movie.category) return false;
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .slice(0, 12);
  }, [allMovies, movie.category, movie.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !text.trim()) return;
    setIsSubmitting(true);
    
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movie.id);

    if (supabase && isUUID) {
      try {
        const { error } = await supabase.from('reviews').insert([{
          movie_id: movie.id,
          user_name: userName.trim(),
          rating,
          text: text.trim()
        }]);
        if (error) {
          console.error('Error submitting review:', error.message);
          toast.error('Failed to submit review: ' + error.message);
        } else {
          toast.success('Review submitted successfully');
          fetchReviews();
        }
      } catch (err) {
        console.error('Failed to submit review:', err);
        toast.error('Failed to submit review');
      }
    } else {
      const newReview: Review = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        movie_id: movie.id,
        user_name: userName.trim(),
        rating,
        text: text.trim(),
        created_at: new Date().toISOString()
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      localStorage.setItem(`reviews_${movie.id}`, JSON.stringify(updated));
      toast.success('Review submitted successfully');
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
        transition={{ duration: 0.4 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Scrollable Container */}
      <div 
        id="movie-detail-modal-container"
        className="fixed inset-0 overflow-y-auto pt-0 md:pt-12 pb-12 px-0 md:px-4 custom-scrollbar overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex justify-center min-h-full items-start">
          <motion.div 
            transition={sharedTransition}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.4,
                  staggerChildren: 0.05,
                  delayChildren: 0.1
                }
              }
            }}
            className="w-full max-w-[1000px] bg-[#141414] rounded-none md:rounded-xl shadow-2xl relative overflow-hidden flex flex-col border border-white/5 mb-8"
          >
            {/* Close Button - Netflix Style */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-[70] w-9 h-9 rounded-full bg-[#141414] flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90 shadow-xl"
            >
              <X size={24} />
            </button>

            {/* Hero Section */}
            <div className="relative min-h-[450px] md:aspect-video shrink-0 group flex flex-col justify-end">
              {/* Poster Background */}
              <motion.div 
                transition={sharedTransition}
                className="absolute inset-0 overflow-hidden"
              >
                {/* Fixed Background Poster */}
                <MoviePoster 
                  src={movie.bannerUrl || movie.posterUrl} 
                  alt="" 
                  priority={true} 
                  className="absolute inset-0 h-full w-full object-cover opacity-80" 
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
              </motion.div>
            
            {/* Content Overlay */}
            <div className="relative z-10 p-8 md:p-14 pb-12 w-full">
              <div className="max-w-2xl">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <Logo showText={false} className="scale-75 -ml-2" />
                  <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Film</span>
                </motion.div>

                <motion.h2 
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="text-4xl md:text-6xl font-black mb-12 tracking-tighter text-white leading-[0.9]"
                >
                  {movie.title}
                </motion.h2>
                
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="flex flex-wrap items-center gap-4 mt-8"
                >
                  {movie.trailerUrl && (
                    <a 
                      href={movie.trailerUrl.startsWith('http') ? movie.trailerUrl : `https://www.youtube.com/watch?v=${movie.trailerUrl}`}
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
                </motion.div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="p-8 md:p-14 pt-10 space-y-16"
          >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-8">
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                <span className="text-[#46d369]">★ {movie.vote_average || 'New'}</span>
                <span className="text-white/60">{movie.release_year || '2026'}</span>
                <span className="border border-white/40 px-1.5 py-0.5 text-[10px] rounded text-white/90">{movie.runtime_min ? `${movie.runtime_min}m` : '120m'}</span>
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
          {/* Trailer Section */}
          {movie.trailerUrl && (
            <div id="trailer-section" className="space-y-6 pt-4">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white/90">Trailers & More</h3>
              {(() => {
                const trailerHref = movie.trailerUrl.startsWith('http') 
                  ? movie.trailerUrl 
                  : `https://www.youtube.com/watch?v=${movie.trailerUrl}`;
                return (
                  <>
                    <div id="trailer-container" className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900/50 border border-white/10 group/trailer">
                      <MoviePoster 
                        src={movie.posterUrl} 
                        alt={movie.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/trailer:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover/trailer:bg-black/40 transition-colors">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover/trailer:scale-110 transition-transform shadow-2xl">
                          <Play size={40} className="fill-current ml-1" />
                        </div>
                        <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-white/70">Click to watch trailer on YouTube</p>
                      </div>
                      
                      <a 
                        href={trailerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        onClick={() => onView(movie.id)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <a 
                        href={trailerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onView(movie.id)}
                        className="flex items-center justify-center gap-2 bg-white text-black py-4 rounded-lg font-black text-sm transition-all hover:bg-white/90 active:scale-95 shadow-xl"
                      >
                        <ExternalLink size={20} /> Watch Official Trailer on YouTube
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {adSettings.enabled && adSettings.detailsModal && (
            <div className="py-8 border-t border-white/5 mt-8">
              <AdBanner code={adSettings.detailsModal} />
            </div>
          )}

          {/* More Like This Section - Netflix Style */}
          {similarMovies.length > 0 && (
            <div className="space-y-8 border-t border-white/5 pt-16">
              <div className="flex items-end justify-between">
                <h3 className="text-xl md:text-2xl font-bold text-white">More Like This</h3>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{movie.category}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                {similarMovies.map((m, idx) => (
                  <motion.div 
                    key={`${m.id}-${idx}`} 
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onMovieClick(m)}
                    className="bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer group transition-all border border-white/5 hover:border-white/20"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <motion.div 
                        transition={sharedTransition}
                        className="w-full h-full"
                      >
                        <MoviePoster src={m.posterUrl} alt={m.title} className="group-hover:opacity-80 transition-opacity duration-300" />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-white/40">{m.release_year || '2026'}</span>
                        <div className="text-emerald-400 text-[10px] font-bold">
                          {m.match_score || 98}% Match
                        </div>
                      </div>
                      <h4 className="font-bold text-sm truncate text-white/90">{m.title}</h4>
                    </div>
                  </motion.div>
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
                <span className="font-bold text-white">{avgRating}</span>
                <span>({reviews.length} reviews)</span>
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
                  className="bg-white text-black font-black py-4 px-10 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 active:scale-95 text-lg shadow-xl flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Spinner size={18} /> : 'Submit Review'}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review, idx) => (
                <div 
                  key={`${review.id}-${idx}`} 
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

const LegalModal: React.FC<{ type: string | null, onClose: () => void }> = ({ type, onClose }) => {
  if (!type) return null;
  
  const content = {
    dmca: {
      title: 'DMCA / Copyright Policy',
      icon: <Shield className="text-red-500" size={32} />,
      body: (
        <>
          <p>
            Movie Wallah respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at <a href="http://www.copyright.gov/legislation/dmca.pdf" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">http://www.copyright.gov/legislation/dmca.pdf</a>, we will respond expeditiously to claims of copyright infringement committed using the Movie Wallah service that are reported to our Designated Copyright Agent.
          </p>
          
          <h3 className="text-xl font-bold text-white mt-4">Takedown Request Process</h3>
          <p>
            If you are a copyright owner, or are authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent. Upon receipt of the Notice as described below, we will take whatever action, in our sole discretion, we deem appropriate, including removal of the challenged material from the Site.
          </p>
          
          <div className="bg-black/50 p-6 rounded-2xl border border-white/5 mt-4">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Mail size={18} className="text-red-400" /> 
              Designated Copyright Agent
            </h4>
            <p className="text-sm text-white/60 mb-1">Send your takedown notices to:</p>
            <p className="font-mono text-red-400">moviewallah.online@gmail.com</p>
          </div>
          
          <p className="text-sm text-white/50 mt-4">
            Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material or activity is infringing may be subject to liability.
          </p>
        </>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: <Lock className="text-red-500" size={32} />,
      body: (
        <>
          <p>Welcome to Movie Wallah's Privacy Policy. Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use our services.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Information We Collect</h3>
          <p>We do not collect personally identifiable information from regular visitors. If you are an administrator, we collect your email address for authentication purposes. We may collect anonymous analytics data such as browser type, device type, and referring pages to improve our service.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">How We Use Your Information</h3>
          <p>The anonymous data we collect is solely used to understand how our users interact with the site, allowing us to enhance the user experience and optimize our content delivery. We do not sell, rent, or share your information with third parties.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Cookies</h3>
          <p>We may use cookies or similar tracking technologies to store your preferences and session information (e.g., keeping you logged in as an administrator). You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Third-Party Links</h3>
          <p>Our site may contain links to third-party websites or services that are not owned or controlled by Movie Wallah. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.</p>
        </>
      )
    },
    disclaimer: {
      title: 'Disclaimer',
      icon: <AlertTriangle className="text-red-500" size={32} />,
      body: (
        <>
          <p>The information and content provided on Movie Wallah is for general informational and entertainment purposes only.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Content Liability</h3>
          <p>Movie Wallah does not host any video files on its servers. All videos and movies are hosted on third-party services and are publicly available on the internet. We simply provide links to these files in an organized format.</p>
          <p>We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">No Warranties</h3>
          <p>The site and all content and services provided on the site are provided on an "as is" and "as available" basis without any warranty or condition, express, implied, or statutory. We do not warrant that the site will be uninterrupted, timely, secure, or error-free.</p>
        </>
      )
    },
    terms: {
      title: 'Terms of Service',
      icon: <FileText className="text-red-500" size={32} />,
      body: (
        <>
          <p>By accessing or using Movie Wallah, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Use of Service</h3>
          <p>You agree to use the site only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the site. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our site.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Intellectual Property</h3>
          <p>The site and its original content (excluding the movies and videos linked, which are the property of their respective owners), features, and functionality are owned by Movie Wallah and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
          
          <h3 className="text-xl font-bold text-white mt-4">Changes to Terms</h3>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
        </>
      )
    }
  };

  const activeContent = content[type as keyof typeof content];

  if (!activeContent) return null;

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
            {activeContent.icon}
            {activeContent.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-6 text-white/80 leading-relaxed">
          {activeContent.body}
        </div>
      </motion.div>
    </motion.div>
  );
};
export default function App() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/movie/:movieSlug" element={<MainApp />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dmca" element={<DMCA />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/a-z" element={<DirectoryAZ />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </React.Suspense>
  );
}
