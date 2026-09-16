const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  );
};
> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Stats', icon: BarChart3 },`;

const fix = `  );
};
const AdminMobileNav: React.FC<{
  activeTab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive',
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive') => void,
  onAddClick: () => void,
  onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Stats', icon: BarChart3 },`;

code = code.replace(target, fix);
fs.writeFileSync('src/App.tsx', code);
