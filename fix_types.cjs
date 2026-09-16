const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  onLogout: () => void
}const AdminMobileNav: React.FC`;
const fix1 = `  onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-red-500' },
    { id: 'movies', label: 'Movies', icon: Film, color: 'text-blue-500' },
    { id: 'drive', label: 'Google Drive', icon: HardDrive, color: 'text-emerald-500' },
    { id: 'feedback', label: 'Feedback', icon: Users, color: 'text-emerald-500' },
    { id: 'logs', label: 'Audit Logs', icon: Activity, color: 'text-amber-500' },
    { id: 'ads', label: 'Ads Manager', icon: Link, color: 'text-orange-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-purple-500' },
  ] as const;
  
  return (
    <div className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col hidden lg:flex h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">
          Admin Panel
        </h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === item.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}\`}
          >
            <item.icon size={20} className={activeTab === item.id ? item.color : ''} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={onAddClick}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-colors mb-2 font-medium"
        >
          <Plus size={20} /> Add Movie
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

const AdminMobileNav: React.FC`;

code = code.replace(target1, fix1);

// Now for line 423
code = code.replace('};\n> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {', '};\nconst AdminMobileNav: React.FC<{\n  activeTab: \'dashboard\' | \'movies\' | \'feedback\' | \'settings\' | \'logs\' | \'ads\' | \'drive\',\n  setActiveTab: (tab: \'dashboard\' | \'movies\' | \'feedback\' | \'settings\' | \'logs\' | \'ads\' | \'drive\') => void,\n  onAddClick: () => void,\n  onLogout: () => void\n}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {');

fs.writeFileSync('src/App.tsx', code);
