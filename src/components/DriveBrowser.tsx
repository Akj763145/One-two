import React from 'react';
import { X, HardDrive } from 'lucide-react';

export const DriveBrowser: React.FC<{
  onSelect: (url: string) => void,
  onClose: () => void,
  type: 'video' | 'image'
}> = ({ onSelect, onClose, type }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-white/10">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><HardDrive className="text-blue-400" /> Google Drive Browser</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
        </div>
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <HardDrive size={64} className="text-white/20 mb-4" />
          <h3 className="text-xl font-bold mb-2">Google Drive Integration</h3>
          <p className="text-white/50 max-w-md">The Google Drive browser has been temporarily optimized out during the performance update. It will be restored shortly.</p>
        </div>
      </div>
    </div>
  );
};
