const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// There are duplicate AdminMobileNavs
// Let's remove any AdminMobileNav in App.tsx!

const navRegex = /const AdminMobileNav: React\.FC<[\s\S]*?> = \(\{[\s\S]*?\}\) => \{[\s\S]*?\] as const;/g;
code = code.replace(navRegex, "");

// We also need to fix `}> = ({ activeTab...` leftovers.
code = code.replace(/onLogout: \(\) => void\n\}> = \(\{\s*activeTab[^\n]*\n/g, "");

fs.writeFileSync('src/App.tsx', code);
