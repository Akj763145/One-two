const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/index.css');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-black\/5 dark:bg-white\/10/g, 'bg-white/10');
content = content.replace(/border-black\/10 dark:border-white\/10/g, 'border-white/10');
content = content.replace(/bg-black dark:bg-white/g, 'bg-white');
content = content.replace(/text-white dark:text-black/g, 'text-black');
content = content.replace(/bg-black\/5 dark:bg-white\/20/g, 'bg-white/20');
content = content.replace(/text-black dark:text-white/g, 'text-white');
content = content.replace(/hover:bg-black\/10 dark:hover:bg-white\/30/g, 'hover:bg-white/30');
content = content.replace(/border-black\/5 dark:border-white\/10/g, 'border-white/10');

fs.writeFileSync(file, content);
console.log('Done');
