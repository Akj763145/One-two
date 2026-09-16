const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /onLogout: \(\) => void\s*\}\> = \(\{\s*activeTab, setActiveTab, onAddClick, onLogout\s*\}\) => \{\s*activeTab: 'dashboard' \| 'movies' \| 'feedback' \| 'settings' \| 'logs' \| 'ads' \| 'drive',\s*setActiveTab: \(tab: 'dashboard' \| 'movies' \| 'feedback' \| 'settings' \| 'logs' \| 'ads' \| 'drive'\) => void,\s*onAddClick: \(\) => void,\s*onLogout: \(\) => void\s*\}\> = \(\{\s*activeTab, setActiveTab, onAddClick, onLogout\s*\}\) => \{/g;

code = code.replace(regex, `onLogout: () => void
}> = ({ activeTab, setActiveTab, onAddClick, onLogout }) => {`);

fs.writeFileSync('src/App.tsx', code);
