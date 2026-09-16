const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const searchIndex = code.indexOf('// Sync URL with selected movie and clean up');
console.log(code.substring(searchIndex - 500, searchIndex + 1500));
