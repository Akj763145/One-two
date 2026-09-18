const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The issue is that the map argument is (movie, idx) but the key is using `index`
code = code.replace(/key=\{`\$\{movie\.id\}-\$\{index\}`\}/g, "key={`${movie.id}-${idx}`}");

fs.writeFileSync('src/App.tsx', code);
