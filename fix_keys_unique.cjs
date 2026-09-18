const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard loops using map(movie => ) with map((movie, idx) => )
code = code.replace(/map\(\(\s*movie\s*\)\s*=>/g, "map((movie, idx) =>");
code = code.replace(/map\(\s*movie\s*=>/g, "map((movie, idx) =>");

// Now safely change key={movie.id} to key={`${movie.id}-${idx}`}
code = code.replace(/key=\{movie\.id\}/g, "key={`${movie.id}-${idx}`}");

fs.writeFileSync('src/App.tsx', code);
