const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("import { Search,", "import { Search, AlertTriangle,");
fs.writeFileSync('src/App.tsx', code);
