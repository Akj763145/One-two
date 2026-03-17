import React, { useState, useEffect } from 'react';
import { Sun, Moon, Search, MoreVertical, Shield, Plus, X, Edit, Trash2, Link as LinkIcon, Image as ImageIcon, FileText, Film, Download } from 'lucide-react';
import { supabase } from './supabaseClient';

// Types
interface Movie {
  id: string;
  title: string;
  url: string;
  posterUrl: string;
  description: string;
}

// Initial dummy data if local storage is empty
const INITIAL_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The raja Saab',
    url: '#',
    posterUrl: 'https://picsum.photos/seed/raja/600/900',
    description: 'Download now'
  }
];

export default function App() {
  // State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
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
    posterUrl: '',
    description: ''
  });

  // Load from Supabase or Local Storage
  useEffect(() => {
    fetchMovies();
    
    // Check system preference for dark mode initially
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
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
    if (adminPassword === '00000000') {
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

  const openAddModal = () => {
    setErrorMsg(null);
    setEditingMovie(null);
    setFormData({ title: '', url: '', posterUrl: '', description: '' });
    setShowAddEditModal(true);
  };

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${isDarkMode ? 'bg-black border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <span className="text-sm leading-none text-center">M<br/>W</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Movie Wallah</h1>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredMovies.map(movie => (
              <div 
                key={movie.id} 
                className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl flex flex-col ${isDarkMode ? 'bg-[#141414] border-gray-800 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}
              >
                <div className="block relative aspect-[3/4] overflow-hidden">
                  <img 
                    src={movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600&h=900'} 
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=600&h=900';
                    }}
                  />
                </div>
                
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold mb-1 leading-tight">{movie.title}</h3>
                  <p className={`text-[10px] flex-1 line-clamp-2 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {movie.description}
                  </p>
                  
                  <a 
                    href={movie.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="relative flex items-center justify-center w-full py-1.5 bg-gradient-to-r from-white via-gray-400 to-black animate-gradient rounded-lg text-xs font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] isolate"
                  >
                    <span className="flex items-center gap-1.5 mix-blend-difference text-white">
                      <Download size={14} />
                      Download
                    </span>
                  </a>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleEdit(movie); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDelete(movie.id); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
        <p className="text-sm font-medium">Proudly made by Bihar</p>
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
                  WATCH URL
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
  );
}
