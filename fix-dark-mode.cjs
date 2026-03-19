const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-white dark:bg-black/g, 'bg-black');
content = content.replace(/text-black dark:text-white/g, 'text-white');
content = content.replace(/bg-black\/5 dark:bg-white\/5/g, 'bg-white/5');
content = content.replace(/bg-black\/5 dark:bg-black\/50/g, 'bg-black/50');
content = content.replace(/border-black\/10 dark:border-white\/10/g, 'border-white/10');
content = content.replace(/text-black\/50 dark:text-white\/50/g, 'text-white/50');
content = content.replace(/text-black\/40 dark:text-white\/40/g, 'text-white/40');
content = content.replace(/text-black\/30 dark:text-white\/30/g, 'text-white/30');
content = content.replace(/text-black\/20 dark:text-white\/20/g, 'text-white/20');
content = content.replace(/text-black\/10 dark:text-white\/10/g, 'text-white/10');
content = content.replace(/bg-black\/10 dark:bg-white\/10/g, 'bg-white/10');
content = content.replace(/bg-black\/5 dark:bg-white\/10/g, 'bg-white/10');
content = content.replace(/hover:bg-black\/10 dark:hover:bg-white\/20/g, 'hover:bg-white/20');
content = content.replace(/hover:bg-black\/10 dark:hover:bg-white\/10/g, 'hover:bg-white/10');
content = content.replace(/hover:bg-black\/5 dark:hover:bg-white\/5/g, 'hover:bg-white/5');
content = content.replace(/border-black\/5 dark:border-white\/5/g, 'border-white/5');
content = content.replace(/border-black\/5 dark:border-white\/10/g, 'border-white/10');
content = content.replace(/bg-black dark:bg-white/g, 'bg-white');
content = content.replace(/text-white dark:text-black/g, 'text-black');
content = content.replace(/bg-black\/20 dark:bg-black\/80/g, 'bg-black/80');
content = content.replace(/bg-white dark:bg-white\/10/g, 'bg-white/10');
content = content.replace(/ring-black\/5 dark:ring-white\/10/g, 'ring-white/10');
content = content.replace(/group-hover:ring-black\/10 dark:group-hover:ring-white\/30/g, 'group-hover:ring-white/30');
content = content.replace(/bg-zinc-200 dark:bg-zinc-800/g, 'bg-zinc-800');
content = content.replace(/text-red-600 dark:text-red-500/g, 'text-red-500');
content = content.replace(/text-red-600 dark:text-red-200/g, 'text-red-200');
content = content.replace(/hover:text-black dark:hover:text-white/g, 'hover:text-white');
content = content.replace(/focus:bg-black\/10 dark:focus:bg-white\/10/g, 'focus:bg-white/10');

fs.writeFileSync(file, content);
console.log('Done');
