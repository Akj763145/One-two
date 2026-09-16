const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "  onAddClick: () => void,\n    const menuItems = [",
  "  onAddClick: () => void,\n  onLogout: () => void\n}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {\n    const menuItems = ["
);

// We should also lazy import AdminMobileNav!
const lazyImport = `const AdminMobileNav = React.lazy(() => import('./components/AdminMobileNav').then(m => ({ default: m.AdminMobileNav })));\n`;
if (!code.includes('AdminMobileNav = React.lazy')) {
  const importPoint = code.indexOf("const DriveBrowser = React.lazy(");
  code = code.substring(0, importPoint) + lazyImport + code.substring(importPoint);
}

fs.writeFileSync('src/App.tsx', code);
