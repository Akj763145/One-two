const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/key=\{`\$\{movie\.id\}-\$\{index\}`\}/g, "key={movie.id}");
fs.writeFileSync('src/App.tsx', code);
