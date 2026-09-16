const fs = require('fs');

const imports = `import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Film, HardDrive, Users, Settings, Plus, LogOut, Link, Activity } from 'lucide-react';

export const AdminMobileNav: React.FC<{
  activeTab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive',
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive') => void,
  onAddClick: () => void,
  onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Stats', icon: BarChart3 },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'drive', label: 'Cloud', icon: HardDrive },
    { id: 'feedback', label: 'Feed', icon: Users },
    { id: 'settings', label: 'Cfg', icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 z-[100] lg:hidden px-2 py-2 pb-safe">
      <div className="flex items-center justify-between gap-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={\`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all \${activeTab === item.id ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}\`}
          >
            <item.icon size={20} className="mb-1" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/AdminMobileNav.tsx', imports);
