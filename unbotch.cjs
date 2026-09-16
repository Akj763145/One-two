const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the lazy imports
const lazyImports = `
const FeedbackManager = React.lazy(() => import('./components/FeedbackManager'));
const LegalModal = React.lazy(() => import('./components/LegalModal'));
const AdminSidebar = React.lazy(() => import('./components/AdminSidebar'));
const AdminMobileNav = React.lazy(() => import('./components/AdminMobileNav'));
const WelcomeAnimation = React.lazy(() => import('./components/WelcomeAnimation'));
`;
code = code.replace(lazyImports, '');

// 2. Restore AdminSidebar
const adminSidebarType = `const AdminSidebar: React.FC<{
  activeTab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive',
  setActiveTab: (tab: 'dashboard' | 'movies' | 'feedback' | 'settings' | 'logs' | 'ads' | 'drive') => void,
  onAddClick: () => void,
  onLogout: () => void
}`;
code = code.replace(/> = \(\{\s*activeTab,\s*setActiveTab,\s*onAddClick,\s*onLogout\s*\}\) => \{/g, (match, offset) => {
    // We have two of these! AdminSidebar and AdminMobileNav!
    // AdminSidebar is around line 110. AdminMobileNav is around 419.
    // Let's do this safer.
    return match;
});

// Let's just do exact replacements
code = code.replace('> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {', adminSidebarType + '> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {');
code = code.replace('> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {', adminSidebarType.replace('AdminSidebar', 'AdminMobileNav') + '> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {');

code = code.replace('> = ({ movies }) => {', 'const FeedbackManager: React.FC<{ movies: Movie[] }> = ({ movies }) => {');
code = code.replace('> = ({ type, onClose }) => {', 'const LegalModal: React.FC<{ type: string | null, onClose: () => void }> = ({ type, onClose }) => {');
code = code.replace('> = ({ onComplete }) => {', 'const WelcomeAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {');

fs.writeFileSync('src/App.tsx', code);
