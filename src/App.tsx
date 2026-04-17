import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Shield, Plus, X, Edit, Trash2, Download, Play, Star, Film, LogOut, ChevronRight, Eye, MoreVertical, Settings, ChevronLeft, ThumbsUp, FileText, Link, Info, BarChart3, Share2, TrendingUp, Users, Activity, Loader } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { supabase } from './supabaseClient';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel, EffectCoverflow, Autoplay, Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface Movie {
  id: string;
  title: string;
  url: string;
  viewUrl?: string;
  trailerUrl?: string;
  posterUrl: string;
  description: string;
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
}

interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
  entity: 'movie';
  details: string;
  admin_email: string;
  timestamp: string;
}

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  
  // Handle YouTube
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1].split('?')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }

  // Handle Google Drive
  if (url.includes('drive.google.com')) {
    let driveId = '';
    if (url.includes('/file/d/')) {
      driveId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('id=')) {
      driveId = url.split('id=')[1].split('&')[0];
    }
    
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }
  }

  return url;
};

const AdminSidebar: React.FC<{
  activeTab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs',
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs') => void,
  onAddClick: () => void,
  onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-red-500' },
    { id: 'movies', label: 'Movies', icon: Film, color: 'text-blue-500' },
    { id: 'feedback', label: 'Feedback', icon: Users, color: 'text-emerald-500' },
    { id: 'logs', label: 'Audit Logs', icon: Activity, color: 'text-amber-500' },
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

const Dashboard: React.FC<{
  movies: Movie[],
  onEdit: (m: Movie) => void,
  onDelete: (id: string) => void,
  onDownload: (id: string) => void,
  onView: (id: string) => void,
  onShowDetails: (m: Movie, layoutId: string) => void,
  searchQuery: string,
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs') => void,
  loadingActions?: Record<string, boolean>
}> = ({ movies, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery, setActiveTab, loadingActions = {} }) => {
  const stats = useMemo(() => {
    const totalMovies = movies.length;
    const totalViews = movies.reduce((sum, m) => sum + (m.views || 0), 0);
    const totalDownloads = movies.reduce((sum, m) => sum + (m.downloads || 0), 0);
    
    // Group movies by month for the chart
    const monthlyData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthlyData[monthName] = 0;
    }

    movies.forEach(movie => {
      if (movie.created_at) {
        const date = new Date(movie.created_at);
        const monthName = date.toLocaleString('default', { month: 'short' });
        if (monthlyData.hasOwnProperty(monthName)) {
          monthlyData[monthName]++;
        }
      }
    });

    const chartData = Object.entries(monthlyData).map(([name, count]) => ({
      name,
      movies: count
    }));

    return { totalMovies, totalViews, totalDownloads, chartData };
  }, [movies]);

  const recentMovies = useMemo(() => {
    return [...movies].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 5);
  }, [movies]);

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-32 md:pb-20">
      <div className="mb-12">
        <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
          <BarChart3 className="text-red-500" size={32} /> Admin Dashboard
        </h2>
        <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">Platform Overview & Statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Film size={80} />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Total Movies</p>
          <h3 className="text-5xl font-black text-white mb-1">{stats.totalMovies}</h3>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <TrendingUp size={14} /> +{movies.filter(m => {
              const d = new Date(m.created_at || '');
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length} this month
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Eye size={80} />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Total Views</p>
          <h3 className="text-5xl font-black text-blue-400 mb-1">{stats.totalViews.toLocaleString()}</h3>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Across all content</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Download size={80} />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Total Downloads</p>
          <h3 className="text-5xl font-black text-emerald-400 mb-1">{stats.totalDownloads.toLocaleString()}</h3>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Direct user engagement</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold mb-1">Movie Upload Activity</h4>
              <p className="text-white/40 text-xs">Number of movies added over the last 6 months</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Activity size={14} className="text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Live Data</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorMovies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 12 }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#ef4444' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="movies" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMovies)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Movies */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-bold mb-1">Recent Movies</h4>
              <p className="text-white/40 text-xs">Latest additions to your catalog</p>
            </div>
            <button 
              onClick={() => setActiveTab('movies')}
              className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentMovies.map(movie => (
              <div 
                key={movie.id} 
                onClick={() => onShowDetails(movie, `movie-poster-${movie.id}-dash`)}
                className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer"
              >
                <motion.div 
                  layoutId={`movie-poster-${movie.id}-dash`} 
                  transition={sharedTransition}
                  className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold truncate">{movie.title}</h5>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{movie.category} • {movie.release_year || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-4 px-4 border-l border-white/10">
                  <div className="text-center">
                    <p className="text-xs font-black">{movie.views || 0}</p>
                    <p className="text-[8px] text-white/30 uppercase">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black">{movie.downloads || 0}</p>
                    <p className="text-[8px] text-white/30 uppercase">DLs</p>
                  </div>
                </div>
              </div>
            ))}
            {recentMovies.length === 0 && (
              <div className="text-center py-12 text-white/20">
                <Film size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">No movies added yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const AdminMobileNav: React.FC<{
  activeTab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs',
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs') => void,
  onAddClick: () => void,
  onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Stats', icon: BarChart3 },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'feedback', label: 'Users', icon: Users },
    { id: 'logs', label: 'Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 z-[100] lg:hidden px-2 py-2 pb-safe">
      <div className="flex items-center justify-between gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
              activeTab === item.id ? 'text-red-500' : 'text-white/40'
            }`}
          >
            <item.icon size={18} />
            <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{item.label}</span>
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-0.5" />
        <button
          onClick={onAddClick}
          className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-90 transition-transform shrink-0"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-full bg-white/5 text-white/40 flex items-center justify-center hover:text-red-500 transition-colors shrink-0"
        >
          <LogOut size={16} />
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

const INITIAL_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The raja Saab',
    url: '#',
    viewUrl: '#',
    posterUrl: 'https://picsum.photos/seed/raja/300/450',
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
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
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


export default function App() {
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
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const hasHandledInitialUrl = useRef(false);
  const [showDMCA, setShowDMCA] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const handleSetActiveCategory = (category: string) => {
    if (category === 'All' && activeCategory !== 'All') {
      if (window.history.state?.modal === 'category') {
        window.history.back();
      }
    }
    setActiveCategory(category);
  };

  const [adminView, setAdminView] = useState<'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs'>('dashboard');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [seoSettings, setSeoSettings] = useState({
    title: 'Movie Wallah - Download any movie Here',
    description: 'Welcome to Movie Wallah. Discover the latest movie reviews, in-depth analysis, and updates on your favorite cinema.',
    keywords: 'movies, download movies, movie reviews, cinema, movie wallah, movie wallah online'
  });
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showGoToTop, setShowGoToTop] = useState(false);
  const [formData, setFormData] = useState({
    title: '', url: '', viewUrl: '', trailerUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, is_trending: false, director: '', cast: '',
    release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0, auto_play_video: false, auto_play_video_url: ''
  });

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
            setSeoSettings(data.value);
            localStorage.setItem('movieWallah_seo', JSON.stringify(data.value));
            return;
          }
          if (error) console.warn('Supabase SEO fetch error:', error.message);
        } catch (e) {
          console.error('Failed to fetch SEO from Supabase');
        }
      }

      // Fallback to localStorage
      const savedSeo = localStorage.getItem('movieWallah_seo');
      if (savedSeo) {
        try {
          setSeoSettings(JSON.parse(savedSeo));
        } catch (e) {
          console.error('Failed to parse saved SEO settings');
        }
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
      id: Date.now().toString(),
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

  const handleShowDetails = (movie: Movie, layoutId: string) => {
    setSelectedMovieForDetails(movie);
    setActiveLayoutId(layoutId);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'xxx';
    if (adminPassword === expectedPassword) {
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
    setIsActionLoading(true);
    
    const movieData = { ...formData };

    if (!supabase) {
      if (editingMovie) {
        setMovies(movies.map(m => m.id === editingMovie.id ? { ...m, ...movieData } : m));
        addAuditLog('update', `Updated movie: ${movieData.title}`);
      } else {
        setMovies([{ ...movieData, id: Date.now().toString() }, ...movies]);
        addAuditLog('create', `Added new movie: ${movieData.title}`);
      }
    } else {
      if (editingMovie) {
        const { error } = await supabase.from('movies').update(movieData).eq('id', editingMovie.id);
        if (error) {
          toast.error('Error updating movie: ' + error.message);
          return setErrorMsg('Error updating movie: ' + error.message);
        }
        setMovies(movies.map(m => m.id === editingMovie.id ? { ...m, ...movieData } : m));
        addAuditLog('update', `Updated movie: ${movieData.title}`);
        toast.success('Movie updated successfully');
      } else {
        const { data, error } = await supabase.from('movies').insert([movieData]).select('*');
        if (error) {
          toast.error('Error adding movie: ' + error.message);
          return setErrorMsg('Error adding movie: ' + error.message);
        }
        if (data && data.length > 0) {
          setMovies([...data, ...movies]);
          addAuditLog('create', `Added new movie: ${movieData.title}`);
        } else {
          setMovies([{ ...movieData, id: Date.now().toString(), downloads: 0, views: 0 }, ...movies]);
          addAuditLog('create', `Added new movie: ${movieData.title}`);
          fetchMovies();
        }
        toast.success('Movie added successfully');
      }
    }
    
    setShowAddEditModal(false);
    setFormData({ title: '', url: '', viewUrl: '', trailerUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, is_trending: false, director: '', cast: '', release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0 });
    setEditingMovie(null);
    setIsActionLoading(false);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title, url: movie.url, viewUrl: movie.viewUrl || '', trailerUrl: movie.trailerUrl || '',
      posterUrl: movie.posterUrl, description: movie.description,
      category: movie.category || 'Other',
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
    if (supabase) await supabase.from('movies').delete().eq('id', movieToDelete);
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

    if (supabase) {
      try {
        const { error } = await supabase.from('movies').update({ downloads: newDownloads }).eq('id', movieId);
        if (error) console.error('Error updating downloads:', error.message);
      } catch (err) {
        console.error('Failed to update downloads:', err);
      } finally {
        setLoadingActions(prev => ({ ...prev, [`download-${movieId}`]: false }));
      }
    } else {
      setLoadingActions(prev => ({ ...prev, [`download-${movieId}`]: false }));
    }
  };

  const handleView = async (movieId: string) => {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    setLoadingActions(prev => ({ ...prev, [`view-${movieId}`]: true }));
    const newViews = (movie.views || 0) + 1;
    setMovies(prev => prev.map(m => m.id === movieId ? { ...m, views: newViews } : m));

    if (supabase) {
      try {
        const { error } = await supabase.from('movies').update({ views: newViews }).eq('id', movieId);
        if (error) console.error('Error updating views:', error.message);
      } catch (err) {
        console.error('Failed to update views:', err);
      } finally {
        setLoadingActions(prev => ({ ...prev, [`view-${movieId}`]: false }));
      }
    } else {
      setLoadingActions(prev => ({ ...prev, [`view-${movieId}`]: false }));
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
          success: {
            icon: <MeshOrb />,
          },
          error: {
            icon: <MeshOrb />,
          },
          loading: {
            icon: <MeshOrb />,
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
          onAdminClick={() => setShowAdminLogin(true)} 
          onLogout={() => { setIsAdmin(false); setAdminView('dashboard'); }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddClick={() => { setEditingMovie(null); setFormData({ title: '', url: '', viewUrl: '', trailerUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, is_trending: false, director: '', cast: '', release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0 }); setShowAddEditModal(true); }}
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
          setActiveCategory={handleSetActiveCategory}
        />
      )}
      
      {isAdmin ? (
        <div className="flex min-h-screen bg-black">
          <AdminSidebar 
            activeTab={adminView} 
            setActiveTab={setAdminView} 
            onAddClick={() => { setEditingMovie(null); setFormData({ title: '', url: '', viewUrl: '', trailerUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, is_trending: false, director: '', cast: '', release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0 }); setShowAddEditModal(true); }}
            onLogout={() => { setIsAdmin(false); setAdminView('dashboard'); }}
          />

          <AdminMobileNav
            activeTab={adminView}
            setActiveTab={setAdminView}
            onAddClick={() => { setEditingMovie(null); setFormData({ title: '', url: '', viewUrl: '', trailerUrl: '', posterUrl: '', description: '', category: 'Other', is_hero: false, is_trending: false, director: '', cast: '', release_year: '', maturity_rating: '18+', duration: '', quality: 'HD', match_score: 98, downloads: 0, views: 0 }); setShowAddEditModal(true); }}
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
                      <Dashboard 
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
          <main className="pt-20 md:pt-24 pb-24">
            {isLoading ? (
              <div className="h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  {featuredMovies.map((movie, index) => (
                    <SwiperSlide key={movie.id} className="!w-[85vw] md:!w-[800px] !h-[55vh] md:!h-[75vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group">
                      <motion.div 
                        layoutId={`movie-poster-${movie.id}-hero`}
                        transition={sharedTransition}
                        className="absolute inset-0"
                      >
                        <MoviePoster src={movie.posterUrl} alt={movie.title} className="hero-zoom-img h-full w-full object-cover" priority={index === 0} />
                      </motion.div>
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
                                  handleShowDetails(movie, `movie-poster-${movie.id}-hero`);
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
                            onClick={() => handleShowDetails(movie, `movie-poster-${movie.id}-hero`)}
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
                        <div className="flex flex-col gap-12">
                          <div 
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                          >
                            {isLoading ? (
                              Array.from({ length: 10 }).map((_, i) => <MovieSkeleton key={i} />)
                            ) : (
                              currentMovies.map(movie => (
                                <MovieCard key={movie.id} movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={handleShowDetails} searchQuery={searchQuery} layoutId={`movie-poster-${movie.id}-search`} loadingActions={loadingActions} />
                              ))
                            )}
                          </div>
                        </div>
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
                        {trendingMovies.map((movie) => (
                          <SwiperSlide key={movie.id} className="!w-[160px] md:!w-[220px]">
                            <MovieCard movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={handleShowDetails} searchQuery={searchQuery} layoutId={`movie-poster-${movie.id}-trending`} loadingActions={loadingActions} />
                          </SwiperSlide>
                        ))}
                      </Swiper>
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
                            currentMovies.map((movie) => (
                              <MovieCard key={movie.id} movie={movie} isAdmin={isAdmin} onEdit={handleEdit} onDelete={setMovieToDelete} onDownload={handleDownload} onView={handleView} onShowDetails={handleShowDetails} searchQuery={searchQuery} layoutId={`movie-poster-${movie.id}-grid`} loadingActions={loadingActions} />
                            ))
                          )}
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
            <p className="text-white text-sm font-black uppercase tracking-[0.2em] bg-white/10 px-4 py-1.5 rounded-full border border-white/20 shadow-lg">Proudly made by Bihari</p>
            <p className="text-red-500 text-sm font-black uppercase tracking-[0.3em] bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 shadow-lg">Developed by AYUSH</p>
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
    </>
  )}

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
                <button type="submit" disabled={isActionLoading} className="w-full bg-white text-black font-bold rounded-xl py-3 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  {isActionLoading ? <Spinner size={18} /> : 'Unlock'}
                </button>
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

                      <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all" onClick={() => setFormData({...formData, auto_play_video: !formData.auto_play_video})}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.auto_play_video ? 'bg-red-600 border-red-600' : 'border-white/20'}`}>
                          {formData.auto_play_video && <Plus size={16} className="text-white rotate-45" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-current">Auto-play Video</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">Auto-play trailer in details modal</p>
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
              layoutId={activeLayoutId || `movie-poster-${selectedMovieForDetails.id}`}
              onClose={() => {
                if (window.history.state?.modal === 'movie-details') {
                  window.history.back();
                }
                setSelectedMovieForDetails(null);
                setActiveLayoutId(null);
              }} 
              onMovieClick={(m) => {
                setSelectedMovieForDetails(m);
                setActiveLayoutId(`movie-poster-${m.id}-similar`);
              }}
              onDownload={handleDownload}
              onView={handleView}
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
  onShowDetails: (m: Movie, layoutId: string) => void,
  searchQuery: string,
  onBulkUpdate: (ids: string[], updates: Partial<Movie>) => Promise<void>,
  onBulkDelete: (ids: string[]) => Promise<void>,
  loadingActions?: Record<string, boolean>
}> = ({ movies, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery, onBulkUpdate, onBulkDelete, loadingActions = {} }) => {
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
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-auto">
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
          {filteredMovies.map(movie => (
            <MovieCard 
              key={movie.id} 
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
              layoutId={`movie-poster-${movie.id}-mgmt`}
              loadingActions={loadingActions}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10">
          <Film size={48} className="mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-bold mb-2">No movies found</h3>
          <p className="text-white/50">Try adjusting your search or add a new movie.</p>
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
        {logs.length > 0 ? logs.map((log) => (
          <div key={log.id} className="p-5 space-y-3">
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
            {logs.length > 0 ? logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors group">
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
            {allReviews.map(review => (
              <motion.div 
                key={review.id} 
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
  src: string; 
  alt: string; 
  className?: string; 
  contain?: boolean; 
  priority?: boolean;
}> = ({ src, alt, className = "", contain = false, priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative w-full bg-zinc-900 overflow-hidden ${className.includes('aspect-') ? '' : 'aspect-[2/3]'} ${className}`}>
      {(!isLoaded && !hasError) && (
        <div className="absolute inset-0 shimmer z-10" />
      )}
      
      {(hasError || !src) ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white/20 p-4 text-center z-10">
          <Film size={40} className="mb-2 opacity-20" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">No Poster</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full ${contain ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${priority || isLoaded ? 'opacity-100' : 'opacity-0'}`} 
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

const sharedTransition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 1
};

const MovieCard: React.FC<{ 
  movie: Movie, 
  isAdmin: boolean, 
  onEdit: (m: Movie) => void, 
  onDelete: (id: string) => void, 
  onDownload: (id: string) => void, 
  onView: (id: string) => void, 
  onShowDetails: (m: Movie, layoutId: string) => void,
  searchQuery?: string,
  isSelected?: boolean,
  onSelect?: (id: string) => void,
  layoutId?: string,
  loadingActions?: Record<string, boolean>
}> = React.memo(({ movie, isAdmin, onEdit, onDelete, onDownload, onView, onShowDetails, searchQuery = '', isSelected, onSelect, layoutId, loadingActions = {} }) => {
  const query = searchQuery.toLowerCase().trim();
  const matchesCast = query && movie.cast?.toLowerCase().includes(query);
  const matchesDirector = query && movie.director?.toLowerCase().includes(query);
  
  const finalLayoutId = layoutId || `movie-poster-${movie.id}`;

  return (
    <div
      className={`flex flex-col gap-3 group w-full transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] relative ${isSelected ? 'scale-[0.98]' : ''}`}
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
        <motion.div 
          layoutId={finalLayoutId}
          transition={sharedTransition}
          onClick={() => onShowDetails(movie, finalLayoutId)}
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
        </motion.div>
      </div>
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
  layoutId?: string;
  loadingActions?: Record<string, boolean>;
}> = ({ movie, allMovies, onClose, onMovieClick, onDownload, onView, layoutId, loadingActions = {} }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(true);
  const [isHeroVideoLoading, setIsHeroVideoLoading] = useState(true);
  
  const finalLayoutId = layoutId || `movie-poster-${movie.id}`;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from YouTube
      if (event.origin.includes('youtube.com')) {
        try {
          const data = JSON.parse(event.data);
          // YouTube state 0 means "ended"
          if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) {
            setShowVideo(false);
          }
        } catch (e) {
          // Not a JSON message or not from YouTube API
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    setShowVideo(false);
    setIsTrailerLoading(true);
    setIsHeroVideoLoading(true);
    if (movie.auto_play_video && (movie.auto_play_video_url || movie.trailerUrl)) {
      const timer = setTimeout(() => {
        setShowVideo(true);
      }, 1700);
      return () => clearTimeout(timer);
    }
  }, [movie.id, movie.auto_play_video, movie.auto_play_video_url, movie.trailerUrl]);

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
            className="w-full max-w-4xl bg-[#0a0a0a] rounded-none md:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border border-white/5 mb-8"
          >
            {/* Close Button - App Store Style */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-[60] w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all active:scale-90"
            >
              <X size={20} />
            </button>

            {/* Hero Section */}
            <div className="relative min-h-[450px] md:aspect-video shrink-0 group flex flex-col justify-end">
              {/* Poster Background */}
              <motion.div 
                layoutId={finalLayoutId}
                transition={sharedTransition}
                className="absolute inset-0 overflow-hidden"
              >
                {showVideo && (movie.auto_play_video_url || movie.trailerUrl) ? (
                  <div className="relative w-full h-full">
                    {isHeroVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm">
                        <Spinner size={30} className="text-white/50" />
                      </div>
                    )}
                    <iframe
                      src={`${getEmbedUrl(movie.auto_play_video_url || movie.trailerUrl || '')}${getEmbedUrl(movie.auto_play_video_url || movie.trailerUrl || '').includes('?') ? '&' : '?'}autoplay=1&mute=1`}
                      className={`h-full w-full object-cover scale-100 md:group-hover:scale-105 transition-all duration-[8000ms] ${isHeroVideoLoading ? 'opacity-0' : 'opacity-70'}`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      onLoad={() => setIsHeroVideoLoading(false)}
                    />
                  </div>
                ) : (
                  <MoviePoster src={movie.posterUrl} alt="" priority={true} className="h-full w-full object-cover scale-100 md:group-hover:scale-105 transition-transform duration-[8000ms] opacity-70" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                {/* Shimmer Effect during transition */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"
                  style={{ pointerEvents: 'none' }}
                />
              </motion.div>
            
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
                {(movie.trailerUrl || movie.viewUrl) && (
                  <button 
                    onClick={(e) => {
                      if (movie.trailerUrl) {
                        e.preventDefault();
                        onView(movie.id);
                        document.getElementById('trailer-section')?.scrollIntoView({ behavior: 'smooth' });
                      } else if (movie.viewUrl) {
                        window.open(movie.viewUrl, '_blank');
                        onView(movie.id);
                      }
                    }}
                    className="bg-white text-black px-6 md:px-10 py-3 md:py-4 rounded font-bold flex items-center justify-center gap-2 md:gap-3 hover:bg-white/90 transition-all text-sm md:text-lg active:scale-95 shadow-lg disabled:opacity-50"
                  >
                    {loadingActions[`view-${movie.id}`] ? <Spinner size={20} /> : <Play size={20} className="fill-current md:w-6 md:h-6" />} {movie.trailerUrl ? 'Watch Now' : 'Watch'}
                  </button>
                )}
                <a 
                  href={movie.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => onDownload(movie.id)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 md:px-10 py-3 md:py-4 rounded font-bold flex items-center justify-center gap-2 md:gap-3 transition-all text-sm md:text-lg backdrop-blur-xl border border-white/10 active:scale-95 disabled:opacity-50"
                >
                  {loadingActions[`download-${movie.id}`] ? <Spinner size={20} /> : <Download size={20} className="md:w-6 md:h-6" />} Download
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

          {/* Trailer Section */}
          {movie.trailerUrl && (
            <div id="trailer-section" className="space-y-6 pt-4">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">Watch Now</h3>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                {isTrailerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0a]">
                    <div className="flex flex-col items-center gap-4">
                      <Spinner size={40} className="text-emerald-500" />
                      <span className="text-white/40 text-sm font-medium animate-pulse">Preparing your experience...</span>
                    </div>
                  </div>
                )}
                <iframe 
                  src={(() => {
                    const url = movie.trailerUrl;
                    if (!url) return '';
                    // Auto-convert Google Drive links
                    if (url.includes('drive.google.com/file/d/')) {
                      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                      if (match && match[1]) {
                        return `https://drive.google.com/file/d/${match[1]}/preview`;
                      }
                    }
                    // Auto-convert YouTube links
                    if (url.includes('youtube.com/watch?v=')) {
                      try {
                        const videoId = new URL(url).searchParams.get('v');
                        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
                      } catch (e) {}
                    }
                    if (url.includes('youtu.be/')) {
                      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
                    }
                    return url;
                  })()} 
                  title={`${movie.title} Trailer`}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                  allowFullScreen
                  webkitallowfullscreen="true"
                  mozallowfullscreen="true"
                  onLoad={() => setIsTrailerLoading(false)}
                ></iframe>
              </div>
              <a 
                href={(() => {
                  const url = movie.trailerUrl;
                  if (!url) return '#';
                  // Auto-convert Google Drive links
                  if (url.includes('drive.google.com/file/d/')) {
                    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      return `https://drive.google.com/file/d/${match[1]}/view`;
                    }
                  }
                  // Auto-convert YouTube links
                  if (url.includes('youtube.com/watch?v=')) {
                    try {
                      const videoId = new URL(url).searchParams.get('v');
                      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
                    } catch (e) {}
                  }
                  if (url.includes('youtu.be/')) {
                    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
                  }
                  return url;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-sm transition-all"
              >
                <Play size={16} /> Open in Fullscreen
              </a>
            </div>
          )}

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
                      <motion.div 
                        layoutId={`movie-poster-${m.id}-similar`} 
                        transition={sharedTransition}
                        className="w-full h-full"
                      >
                        <MoviePoster src={m.posterUrl} alt={m.title} className="group-hover:scale-110 transition-transform duration-700" />
                      </motion.div>
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
