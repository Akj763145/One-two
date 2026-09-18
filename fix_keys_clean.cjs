const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard map iterations to include index explicitly
code = code.replace(/map\(\(([\w]+)\)\s*=>/g, "map(($1, index) =>");
code = code.replace(/map\(([\w]+)\s*=>/g, "map(($1, index) =>");

// Replace the key property with index
code = code.replace(/key=\{([\w]+)\.id\}/g, "key={`${$1.id}-${index}`}");

fs.writeFileSync('src/App.tsx', code);
