const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
let lines = code.split('\n');

// We want to delete lines 201 to 235. Wait, 201 is index 200, 235 is index 234.
// Let's make sure by checking the text on those lines.
const startLineText = lines[200];
const endLineText = lines[234];
console.log('Line 201:', startLineText);
console.log('Line 235:', endLineText);

if (endLineText.trim() === '};') {
  lines.splice(200, 35);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log('Removed leftovers');
} else {
  console.log('Unexpected text, aborting');
}
