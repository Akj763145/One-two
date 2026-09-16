const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/\\n/g, '\n');
fs.writeFileSync('src/App.tsx', code);

let dash = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
dash = dash.replace(/\\n/g, '\n');
fs.writeFileSync('src/components/AdminDashboard.tsx', dash);
