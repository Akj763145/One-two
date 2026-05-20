import React, { useState, useEffect } from 'react';
import { HardDrive, Search, Loader, Plus, AlertCircle, ExternalLink, Play, CheckCircle2, ChevronRight, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
  createdTime: string;
}

interface DriveBrowserProps {
  onImport: (file: DriveFile) => void;
  onLogin: () => void;
  accessToken: string | null;
}

export const DriveBrowser: React.FC<DriveBrowserProps> = ({ onImport, onLogin, accessToken }) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/drive/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFiles(accessToken);
    }
  }, [accessToken]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes?: string) => {
    if (!bytes) return 'Unknown size';
    const b = parseInt(bytes);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = b;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 mb-6 border border-red-600/20">
          <HardDrive size={40} />
        </div>
        <h3 className="text-2xl font-black mb-2">Connect Google Drive</h3>
        <p className="text-white/40 max-w-md mb-8">
          Sign in with your Google account to browse and import your movies directly from Google Drive.
        </p>
        <button 
          onClick={onLogin}
          className="bg-white text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-2xl flex items-center gap-3"
        >
          <Globe size={20} /> Authorize Google Access
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <HardDrive className="text-red-500" size={32} /> Google Drive Movies
          </h2>
          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">Import content directly from your cloud storage</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Search your drive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all placeholder:text-white/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-white/20">
          <Loader size={48} className="animate-spin mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest">Scanning Drive...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Sync Error</h3>
          <p className="text-white/40 mb-6">{error}</p>
          <button 
            onClick={() => fetchFiles(accessToken)}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-white/20">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-white/40">No video files found</h3>
          <p className="text-white/20 text-sm mt-1">Try a different search term or check your Drive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={file.id} 
                className="group relative bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden hover:border-red-600/30 transition-all shadow-xl"
              >
                <div className="aspect-video relative overflow-hidden bg-black">
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink.replace('=s220', '=s800')} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <Play size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white/80 border border-white/10 flex items-center gap-1">
                    <Lock size={10} /> DRIVE
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="text-sm font-black truncate mb-1 group-hover:text-red-500 transition-colors uppercase tracking-tight">{file.name}</h4>
                  <div className="flex items-center justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    <span>{formatSize(file.size)}</span>
                    <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <button 
                      onClick={() => onImport(file)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Plus size={16} /> Import Movie
                    </button>
                    <a 
                      href={file.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl border border-white/5 transition-all active:scale-[0.98]"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
