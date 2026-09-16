const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("}const AdminMobileNav: React.FC<{", "}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {");
code = code.replace("}const AdminMobileNav: React.FC<{", "}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {");

fs.writeFileSync('src/App.tsx', code);
