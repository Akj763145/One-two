const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
code = code.replace(/\\n/g, '\n');
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
