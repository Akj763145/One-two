const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/key=\{`\$\{movie\.id\}-\$\{idx\}`\}/g, "key={`${movie.id}-${index}`}");
fs.writeFileSync('src/App.tsx', code);
