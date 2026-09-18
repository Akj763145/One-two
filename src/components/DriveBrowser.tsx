import React from 'react';
import { HardDrive, LogIn, CheckCircle2 } from 'lucide-react';

interface DriveBrowserProps {
  onImport: (file: any) => void;
  onLogin: () => Promise<void>;
  accessToken: string | null;
}

export const DriveBrowser: React.FC<DriveBrowserProps> = ({ onImport, onLogin, accessToken }) => {
  const mockDriveFiles = [
    {
      id: 'mock-1',
      name: 'interstellar_2014_1080p.mp4',
      size: '2306867200', // ~2.15 GB
      webViewLink: 'https://drive.google.com/file/d/1mock_interstellar/view',
      webContentLink: 'https://drive.google.com/uc?export=download&id=1mock_interstellar',
      thumbnailLink: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=220',
    },
    {
      id: 'mock-2',
      name: 'inception_bluray_4k.mkv',
      size: '4831838208', // ~4.5 GB
      webViewLink: 'https://drive.google.com/file/d/1mock_inception/view',
      webContentLink: 'https://drive.google.com/uc?export=download&id=1mock_inception',
      thumbnailLink: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=220',
    },
    {
      id: 'mock-3',
      name: 'the_dark_knight_imax.mp4',
      size: '3435973836', // ~3.2 GB
      webViewLink: 'https://drive.google.com/file/d/1mock_tdk/view',
      webContentLink: 'https://drive.google.com/uc?export=download&id=1mock_tdk',
      thumbnailLink: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=220',
    }
  ];

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden p-6">
      <div className="flex items-center gap-3 mb-6">
        <HardDrive className="text-blue-500" size={28} />
        <div>
          <h2 className="text-xl font-bold">Google Drive Media Importer</h2>
          <p className="text-xs text-white/40">Browse and import video files from your Drive to the catalog</p>
        </div>
      </div>

      {!accessToken ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
            <HardDrive size={28} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Connect Google Account</h3>
          <p className="text-sm text-white/50 max-w-sm mb-6">
            Log in to view and select video files directly from your personal or shared Google Drive.
          </p>
          <button
            onClick={onLogin}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-95 cursor-pointer"
          >
            <LogIn size={18} /> Connect Drive
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-3 rounded-xl mb-6 text-sm">
            <CheckCircle2 size={16} />
            <span>Successfully connected to Google Drive!</span>
          </div>

          <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">Available Movie Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDriveFiles.map((file) => (
              <div 
                key={file.id} 
                className="bg-zinc-800/40 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 hover:bg-zinc-800/80 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 mb-3 relative">
                    <img 
                      src={file.thumbnailLink} 
                      alt={file.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 text-[10px] text-white/70 font-semibold rounded">
                      {(parseInt(file.size) / (1024 * 1024 * 1024)).toFixed(2)} GB
                    </div>
                  </div>
                  <h4 className="font-medium text-white/90 text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-xs text-white/40 mb-4">Google Drive File</p>
                </div>
                <button
                  onClick={() => onImport(file)}
                  className="w-full py-2 bg-zinc-700/50 hover:bg-blue-600 hover:text-white text-zinc-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Pre-fill Movie Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
