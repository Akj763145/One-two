import React, { useMemo } from 'react';
import { Activity, Star, Eye, Download, Film, Shield, TrendingUp, Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { Movie } from '../types';
import { motion } from 'framer-motion';
import { BarChart3, Edit, Trash2 } from 'lucide-react';
const sharedTransition = { type: "spring", stiffness: 260, damping: 32, mass: 1 } as any;
 // Wait, does Dashboard use MovieCard? No, it doesn't. Wait, it might.
// Let's check if it uses MovieCard.

const Dashboard: React.FC<{
  movies: Movie[],
  onEdit: (m: Movie) => void,
  onDelete: (id: string) => void,
  onDownload?: (id: string) => void,
  onView: (id: string) => void,
  onShowDetails: (m: Movie) => void,
  searchQuery: string,
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads') => void,
  loadingActions?: Record<string, boolean>
}> = ({ movies, onEdit, onDelete, onView, onShowDetails, searchQuery, setActiveTab, loadingActions = {} }) => {
  const stats = useMemo(() => {
    const totalMovies = movies.length;
    const totalViews = movies.reduce((sum, m) => sum + (m.views || 0), 0);
    const publishedCount = movies.filter(m => m.is_published !== false).length;
    
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

    return { totalMovies, totalViews, publishedCount, chartData };
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
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Across all catalog content</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield size={80} />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Published Titles</p>
          <h3 className="text-5xl font-black text-emerald-400 mb-1">{stats.publishedCount.toLocaleString()}</h3>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Active streaming guides</p>
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
            {recentMovies.map((movie) => (
              <div 
                key={movie.id} 
                onClick={() => onShowDetails(movie)}
                className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer"
              >
                <motion.div 
                  transition={sharedTransition}
                  className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold truncate">{movie.title}</h5>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{movie.category} • {movie.release_year || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2 px-4 border-l border-white/10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(movie); }}
                    className="p-2 bg-blue-500/10 text-white/40 hover:text-blue-400 transition-all rounded-lg"
                    title="Edit Movie"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(movie.id); }}
                    className="p-2 bg-red-500/10 text-white/40 hover:text-red-500 transition-all rounded-lg"
                    title="Delete Movie"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-4 px-4 border-l border-white/10 hidden md:flex">
                  <div className="text-center">
                    <p className="text-xs font-black">{movie.views || 0}</p>
                    <p className="text-[8px] text-white/30 uppercase">Views</p>
                  </div>
                  {movie.vote_average && (
                    <div className="text-center">
                      <p className="text-xs font-black text-amber-400">{movie.vote_average.toFixed(1)}</p>
                      <p className="text-[8px] text-white/30 uppercase">Rating</p>
                    </div>
                  )}
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
export default Dashboard;
